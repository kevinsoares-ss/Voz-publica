const PHOTO_ARCHIVE_BASE_URL =
  "https://cdn.tse.jus.br/estatistica/sead/eleicoes";
const PHOTO_ARCHIVE_TTL_MS = 10 * 60 * 1_000;
const MAX_INDEX_BYTES = 100_000_000;
const MAX_PHOTO_BYTES = 8_000_000;
const MAX_CACHED_ARCHIVES = 8;

type ZipImage = {
  fileName: string;
  flags: number;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  crc32: number;
  localHeaderOffset: number;
};

type PhotoArchiveIndex = {
  url: string;
  size: number;
  entries: Map<string, ZipImage>;
  expiresAt: number;
};

const archiveIndexCache = new Map<string, Promise<PhotoArchiveIndex>>();

export class TsePhotoError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 404 | 502,
  ) {
    super(message);
    this.name = "TsePhotoError";
  }
}

function isZipSignature(bytes: Buffer, offset: number, signature: number): boolean {
  return offset >= 0 && offset + 4 <= bytes.length && bytes.readUInt32LE(offset) === signature;
}

async function requestBytes(
  url: string,
  start: number,
  endExclusive: number,
  totalSize: number,
): Promise<Buffer> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { range: `bytes=${start}-${endExclusive - 1}` },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new TsePhotoError("Could not retrieve the official TSE photo archive.", 502);
  }
  if (response.status !== 206) {
    throw new TsePhotoError(
      `The TSE photo archive did not honor the requested byte range (HTTP ${response.status}).`,
      502,
    );
  }

  const contentRange = response.headers.get("content-range");
  const match = contentRange?.match(/^bytes (\d+)-(\d+)\/(\d+)$/i);
  if (
    !match ||
    Number(match[1]) !== start ||
    Number(match[2]) !== endExclusive - 1 ||
    Number(match[3]) !== totalSize
  ) {
    throw new TsePhotoError("The TSE photo archive returned an invalid byte range.", 502);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== endExclusive - start) {
    throw new TsePhotoError("The TSE photo archive returned an incomplete byte range.", 502);
  }
  return bytes;
}

function readZip64EndRecordOffset(tail: Buffer, endRecordOffset: number): number {
  const locatorOffset = endRecordOffset - 20;
  if (!isZipSignature(tail, locatorOffset, 0x07064b50)) {
    throw new TsePhotoError("The TSE photo archive has an invalid ZIP64 locator.", 502);
  }
  const offset = tail.readBigUInt64LE(locatorOffset + 8);
  if (offset > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new TsePhotoError("The TSE photo archive index is too large to read safely.", 502);
  }
  return Number(offset);
}

function readZip64DirectoryBounds(
  record: Buffer,
  recordOffset: number,
): { offset: number; size: number } {
  if (!isZipSignature(record, 0, 0x06064b50) || record.length < 56) {
    throw new TsePhotoError("The TSE photo archive has an invalid ZIP64 directory record.", 502);
  }
  if (
    record.readUInt32LE(16) !== 0 ||
    record.readUInt32LE(20) !== 0
  ) {
    throw new TsePhotoError("Multi-volume TSE photo archives are not supported.", 502);
  }
  const size = record.readBigUInt64LE(40);
  const offset = record.readBigUInt64LE(48);
  if (
    size > BigInt(MAX_INDEX_BYTES) ||
    offset > BigInt(Number.MAX_SAFE_INTEGER) ||
    offset + size > BigInt(recordOffset)
  ) {
    throw new TsePhotoError("The TSE photo archive directory exceeds its size limit.", 502);
  }
  return { offset: Number(offset), size: Number(size) };
}

function readZipDirectoryBounds(
  tail: Buffer,
  tailStart: number,
): { offset: number; size: number } {
  let endRecordOffset = -1;
  for (let offset = tail.length - 22; offset >= Math.max(0, tail.length - 65_557); offset -= 1) {
    if (
      isZipSignature(tail, offset, 0x06054b50) &&
      offset + 22 + tail.readUInt16LE(offset + 20) === tail.length
    ) {
      endRecordOffset = offset;
      break;
    }
  }
  if (endRecordOffset < 0) {
    throw new TsePhotoError("The TSE photo archive has no valid ZIP end record.", 502);
  }

  const diskNumber = tail.readUInt16LE(endRecordOffset + 4);
  const directoryDisk = tail.readUInt16LE(endRecordOffset + 6);
  const entriesOnDisk = tail.readUInt16LE(endRecordOffset + 8);
  const entryCount = tail.readUInt16LE(endRecordOffset + 10);
  const size32 = tail.readUInt32LE(endRecordOffset + 12);
  const offset32 = tail.readUInt32LE(endRecordOffset + 16);
  if (diskNumber !== 0 || directoryDisk !== 0 || entriesOnDisk !== entryCount) {
    throw new TsePhotoError("Multi-volume TSE photo archives are not supported.", 502);
  }

  if (
    size32 === 0xffffffff ||
    offset32 === 0xffffffff ||
    entryCount === 0xffff
  ) {
    const zip64Offset = readZip64EndRecordOffset(tail, endRecordOffset);
    const relativeOffset = zip64Offset - tailStart;
    if (relativeOffset >= 0 && relativeOffset + 56 <= tail.length) {
      return readZip64DirectoryBounds(
        tail.subarray(relativeOffset, relativeOffset + 56),
        zip64Offset,
      );
    }
    throw new TsePhotoError("The TSE ZIP64 directory record is outside the archive tail.", 502);
  }

  if (size32 > MAX_INDEX_BYTES) {
    throw new TsePhotoError("The TSE photo archive directory exceeds its size limit.", 502);
  }
  return { offset: offset32, size: size32 };
}

function readZip64Extra(
  extra: Buffer,
  uncompressedSize: number,
  compressedSize: number,
  localHeaderOffset: number,
): { uncompressedSize: number; compressedSize: number; localHeaderOffset: number } {
  let cursor = 0;
  while (cursor + 4 <= extra.length) {
    const fieldId = extra.readUInt16LE(cursor);
    const fieldLength = extra.readUInt16LE(cursor + 2);
    const valueStart = cursor + 4;
    if (valueStart + fieldLength > extra.length) break;
    if (fieldId === 0x0001) {
      let valueOffset = valueStart;
      if (uncompressedSize === 0xffffffff) {
        uncompressedSize = Number(extra.readBigUInt64LE(valueOffset));
        valueOffset += 8;
      }
      if (compressedSize === 0xffffffff) {
        compressedSize = Number(extra.readBigUInt64LE(valueOffset));
        valueOffset += 8;
      }
      if (localHeaderOffset === 0xffffffff) {
        localHeaderOffset = Number(extra.readBigUInt64LE(valueOffset));
      }
      return { uncompressedSize, compressedSize, localHeaderOffset };
    }
    cursor = valueStart + fieldLength;
  }
  return { uncompressedSize, compressedSize, localHeaderOffset };
}

function parseZipDirectory(bytes: Buffer): Map<string, ZipImage> {
  const entries = new Map<string, ZipImage>();
  let cursor = 0;
  while (cursor + 46 <= bytes.length && isZipSignature(bytes, cursor, 0x02014b50)) {
    const flags = bytes.readUInt16LE(cursor + 8);
    const compressionMethod = bytes.readUInt16LE(cursor + 10);
    const crc32 = bytes.readUInt32LE(cursor + 16);
    let compressedSize = bytes.readUInt32LE(cursor + 20);
    let uncompressedSize = bytes.readUInt32LE(cursor + 24);
    const fileNameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    let localHeaderOffset = bytes.readUInt32LE(cursor + 42);
    const nameStart = cursor + 46;
    const extraStart = nameStart + fileNameLength;
    const nextEntry = extraStart + extraLength + commentLength;
    if (nextEntry > bytes.length) {
      throw new TsePhotoError("The TSE photo archive directory is truncated.", 502);
    }

    const fileName = bytes.subarray(nameStart, extraStart).toString("utf8");
    const extra = bytes.subarray(extraStart, extraStart + extraLength);
    ({ uncompressedSize, compressedSize, localHeaderOffset } = readZip64Extra(
      extra,
      uncompressedSize,
      compressedSize,
      localHeaderOffset,
    ));
    if (fileName && !fileName.endsWith("/")) {
      entries.set(fileName.toLowerCase(), {
        fileName,
        flags,
        compressedSize,
        uncompressedSize,
        compressionMethod,
        crc32,
        localHeaderOffset,
      });
    }
    cursor = nextEntry;
  }
  if (entries.size === 0) {
    throw new TsePhotoError("The TSE photo archive contains no readable files.", 502);
  }
  return entries;
}

async function loadArchiveIndex(url: string): Promise<PhotoArchiveIndex> {
  let headResponse: Response;
  try {
    headResponse = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new TsePhotoError("Could not connect to the official TSE photo archive.", 502);
  }
  if (!headResponse.ok) {
    throw new TsePhotoError(`The TSE photo archive returned HTTP ${headResponse.status}.`, 502);
  }

  const size = Number(headResponse.headers.get("content-length"));
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new TsePhotoError("The TSE photo archive did not provide a valid size.", 502);
  }

  const tailLength = Math.min(size, 65_557);
  const tailStart = size - tailLength;
  const tail = await requestBytes(url, tailStart, size, size);
  const directory = readZipDirectoryBounds(tail, tailStart);
  if (
    directory.size <= 0 ||
    directory.offset < 0 ||
    directory.offset + directory.size > size ||
    directory.size > MAX_INDEX_BYTES
  ) {
    throw new TsePhotoError("The TSE photo archive directory has invalid bounds.", 502);
  }
  const directoryBytes = await requestBytes(
    url,
    directory.offset,
    directory.offset + directory.size,
    size,
  );
  return {
    url,
    size,
    entries: parseZipDirectory(directoryBytes),
    expiresAt: Date.now() + PHOTO_ARCHIVE_TTL_MS,
  };
}

async function getArchiveIndex(url: string): Promise<PhotoArchiveIndex> {
  const current = archiveIndexCache.get(url);
  if (current) {
    const resolved = await current;
    if (resolved.expiresAt > Date.now()) return resolved;
    archiveIndexCache.delete(url);
  }

  const pending = loadArchiveIndex(url);
  archiveIndexCache.set(url, pending);
  while (archiveIndexCache.size > MAX_CACHED_ARCHIVES) {
    const oldestUrl = archiveIndexCache.keys().next().value;
    if (!oldestUrl || oldestUrl === url) break;
    archiveIndexCache.delete(oldestUrl);
  }
  try {
    return await pending;
  } catch (error) {
    archiveIndexCache.delete(url);
    throw error;
  }
}

async function readImage(index: PhotoArchiveIndex, image: ZipImage): Promise<Buffer> {
  if (
    image.compressedSize > MAX_PHOTO_BYTES ||
    image.uncompressedSize > MAX_PHOTO_BYTES ||
    !Number.isSafeInteger(image.localHeaderOffset) ||
    image.localHeaderOffset < 0
  ) {
    throw new TsePhotoError("The TSE candidate photo exceeds the size limit.", 502);
  }
  if ((image.flags & (0x0001 | 0x0040 | 0x2000)) !== 0) {
    throw new TsePhotoError("The TSE candidate photo uses unsupported ZIP flags.", 502);
  }

  const header = await requestBytes(
    index.url,
    image.localHeaderOffset,
    image.localHeaderOffset + 30,
    index.size,
  );
  if (!isZipSignature(header, 0, 0x04034b50)) {
    throw new TsePhotoError("The TSE candidate photo has an invalid ZIP header.", 502);
  }
  const fileNameLength = header.readUInt16LE(26);
  const extraLength = header.readUInt16LE(28);
  const dataStart = image.localHeaderOffset + 30 + fileNameLength + extraLength;
  const dataEnd = dataStart + image.compressedSize;
  if (dataEnd > index.size) {
    throw new TsePhotoError("The TSE candidate photo exceeds the archive bounds.", 502);
  }

  const compressedBytes = await requestBytes(index.url, dataStart, dataEnd, index.size);
  let bytes: Buffer;
  if (image.compressionMethod === 0) {
    bytes = compressedBytes;
  } else if (image.compressionMethod === 8) {
    const { inflateRawSync } = await import("node:zlib");
    try {
      bytes = inflateRawSync(compressedBytes, { maxOutputLength: MAX_PHOTO_BYTES });
    } catch {
      throw new TsePhotoError("The TSE candidate photo could not be decompressed.", 502);
    }
  } else {
    throw new TsePhotoError("The TSE candidate photo uses an unsupported compression method.", 502);
  }
  if (bytes.length !== image.uncompressedSize || crc32(bytes) !== image.crc32) {
    throw new TsePhotoError("The TSE candidate photo failed archive integrity checks.", 502);
  }
  return bytes;
}

function crc32(bytes: Buffer): number {
  let checksum = 0xffffffff;
  for (const byte of bytes) {
    checksum ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      checksum = (checksum >>> 1) ^ (checksum & 1 ? 0xedb88320 : 0);
    }
  }
  return (checksum ^ 0xffffffff) >>> 0;
}

function photoArchiveUrl(year: number, state: string): string {
  return `${PHOTO_ARCHIVE_BASE_URL}/eleicoes${year}/fotos/foto_cand${year}_${state}_div.zip`;
}

export async function getTseCandidatePhoto(options: {
  year: number;
  state: string;
  candidateId: string;
}): Promise<{ bytes: Buffer; contentType: string } | null> {
  const { year, state, candidateId } = options;
  if (
    (year !== 2022 && year !== 2024) ||
    !/^[A-Z]{2}$/.test(state) ||
    !/^\d{1,20}$/.test(candidateId) ||
    (year === 2024 && state === "BR")
  ) {
    return null;
  }

  const index = await getArchiveIndex(photoArchiveUrl(year, state));
  const prefix = `f${state.toLowerCase()}${candidateId}_div`;
  const candidates = [".jpg", ".jpeg", ".png"]
    .map((extension) => index.entries.get(`${prefix}${extension}`));
  const image = candidates
    .find((candidate): candidate is ZipImage => candidate !== undefined);
  if (!image) return null;

  const bytes = await readImage(index, image);
  const extension = image.fileName.toLowerCase().split(".").pop();
  return {
    bytes,
    contentType: extension === "png" ? "image/png" : "image/jpeg",
  };
}
