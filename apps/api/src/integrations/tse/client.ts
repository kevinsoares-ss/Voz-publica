import { parse } from "csv-parse";
import { pipeline } from "node:stream/promises";
import { Transform, Writable } from "node:stream";
import * as yauzl from "yauzl";

const DATASET_URLS: Record<number, string> = {
  2022: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2022.zip",
  2024: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2024.zip",
};
const MAX_ARCHIVE_BYTES = 100_000_000;

export type TseElectedRepresentative = {
  electionYear: number;
  externalId: string;
  name: string;
  civilName: string | null;
  role:
    | "PRESIDENT"
    | "GOVERNOR"
    | "MAYOR"
    | "STATE_DEPUTY"
    | "CITY_COUNCILLOR";
  sphere: "FEDERAL" | "STATE" | "MUNICIPAL";
  powerBranch: "EXECUTIVE" | "LEGISLATIVE";
  party: string | null;
  state: string | null;
  city: string | null;
};

export type TSElectionRow = Record<string, string | undefined>;

const roleByOffice: Record<
  string,
  Pick<TseElectedRepresentative, "role" | "sphere" | "powerBranch">
> = {
  PRESIDENTE: { role: "PRESIDENT", sphere: "FEDERAL", powerBranch: "EXECUTIVE" },
  GOVERNADOR: { role: "GOVERNOR", sphere: "STATE", powerBranch: "EXECUTIVE" },
  PREFEITO: { role: "MAYOR", sphere: "MUNICIPAL", powerBranch: "EXECUTIVE" },
  "DEPUTADO ESTADUAL": {
    role: "STATE_DEPUTY",
    sphere: "STATE",
    powerBranch: "LEGISLATIVE",
  },
  VEREADOR: {
    role: "CITY_COUNCILLOR",
    sphere: "MUNICIPAL",
    powerBranch: "LEGISLATIVE",
  },
};

function normalize(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toUpperCase();
}

export function parseElectedCandidate(
  row: TSElectionRow,
  electionYear: number,
): TseElectedRepresentative | null {
  if (!normalize(row.NM_TIPO_ELEICAO).startsWith("ELEICAO ORDINARIA")) {
    return null;
  }
  if (!/^ELEITO(?:\s|$)/.test(normalize(row.DS_SIT_TOT_TURNO))) {
    return null;
  }

  const office = roleByOffice[normalize(row.DS_CARGO)];
  const externalId = row.SQ_CANDIDATO?.trim();
  const name = row.NM_URNA_CANDIDATO?.trim();
  if (!office || !externalId || !/^\d+$/.test(externalId) || !name) {
    return null;
  }

  const city = office.sphere === "MUNICIPAL" ? row.NM_UE?.trim() : undefined;
  const state = office.role === "PRESIDENT" ? undefined : row.SG_UF?.trim();

  return {
    electionYear,
    externalId: `${electionYear}-${externalId}`,
    name,
    civilName: row.NM_CANDIDATO?.trim() || null,
    ...office,
    party: row.SG_PARTIDO?.trim() || null,
    state: state || null,
    city: city || null,
  };
}

function parseArchive(buffer: Buffer, electionYear: number): Promise<TseElectedRepresentative[]> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (openError, zipFile) => {
      if (openError || !zipFile) {
        reject(openError ?? new Error("Unable to open the TSE candidate archive."));
        return;
      }

      const candidates = new Map<string, TseElectedRepresentative>();
      let settled = false;
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        zipFile.close();
        reject(error);
      };

      zipFile.on("error", fail);
      zipFile.on("end", () => {
        if (settled) return;
        settled = true;
        resolve([...candidates.values()]);
      });

      const readNextCsv = () => {
        zipFile.readEntry();
      };

      zipFile.on("entry", (entry) => {
        if (!entry.fileName.toLowerCase().endsWith(".csv")) {
          readNextCsv();
          return;
        }

        zipFile.openReadStream(entry, (streamError, input) => {
          if (streamError || !input) {
            fail(streamError ?? new Error("Unable to read a TSE CSV entry."));
            return;
          }

          const decoder = new TextDecoder("windows-1252");
          const decodeText = new Transform({
            transform(chunk: Buffer, _encoding, callback) {
              try {
                callback(null, decoder.decode(chunk, { stream: true }));
              } catch (error) {
                callback(error instanceof Error ? error : new Error(String(error)));
              }
            },
            flush(callback) {
              callback(null, decoder.decode());
            },
          });
          const csv = parse({
            bom: true,
            columns: true,
            delimiter: ";",
            skip_empty_lines: true,
            trim: true,
          });
          const collect = new Writable({
            objectMode: true,
            write(row: TSElectionRow, _encoding, callback) {
              try {
                const candidate = parseElectedCandidate(row, electionYear);
                if (candidate) candidates.set(candidate.externalId, candidate);
                callback();
              } catch (error) {
                callback(error instanceof Error ? error : new Error(String(error)));
              }
            },
          });

          void pipeline(input, decodeText, csv, collect)
            .then(readNextCsv)
            .catch(fail);
        });
      });

      zipFile.readEntry();
    });
  });
}

export class TseClient {
  private readonly fetchImplementation: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: {
    fetchImplementation?: typeof fetch;
    timeoutMs?: number;
  } = {}) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 120_000;
  }

  async listElectedRepresentatives(
    electionYear: number,
  ): Promise<{
    data: TseElectedRepresentative[];
    requestedUrl: string;
    consultedAt: Date;
  }> {
    const url = DATASET_URLS[electionYear];
    if (!url) {
      throw new Error(`TSE candidate data is not configured for election year ${electionYear}.`);
    }

    let response: Response;
    try {
      response = await this.fetchImplementation(url, {
        headers: { accept: "application/zip, application/octet-stream" },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new Error(
        `Could not download the official TSE ${electionYear} candidate dataset.`,
        { cause: error },
      );
    }
    if (!response.ok) {
      throw new Error(`The TSE dataset returned HTTP ${response.status}.`);
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_ARCHIVE_BYTES) {
      throw new Error(`The TSE ${electionYear} dataset exceeds the download size limit.`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_ARCHIVE_BYTES) {
      throw new Error(`The TSE ${electionYear} dataset exceeds the download size limit.`);
    }

    return {
      data: await parseArchive(buffer, electionYear),
      requestedUrl: url,
      consultedAt: new Date(),
    };
  }
}
