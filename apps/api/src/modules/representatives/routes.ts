import type { ServerResponse } from "node:http";
import { z } from "zod";
import { prisma } from "../../database.js";
import { sendError, sendJson } from "../../lib/http.js";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  party: z.string().trim().min(1).max(30).optional(),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
});

const externalIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,50}$/);

type SourceDetails = {
  type: string;
  name: string;
  url: string;
  consultedAt: Date;
};

function representativeDto(
  representative: {
    externalId: string;
    name: string;
    party: string | null;
    state: string | null;
    photoUrl: string | null;
    lastSyncedAt: Date;
    source: SourceDetails;
  },
) {
  return {
    id: representative.externalId,
    name: representative.name,
    party: representative.party,
    state: representative.state,
    photoUrl: representative.photoUrl,
    lastSyncedAt: representative.lastSyncedAt,
    source: representative.source,
  };
}

export async function listRepresentatives(
  url: URL,
  response: ServerResponse,
): Promise<void> {
  const parsed = listQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    party: url.searchParams.get("party") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
  });

  if (!parsed.success) {
    sendError(
      response,
      400,
      "VALIDATION_ERROR",
      "One or more query parameters are invalid.",
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
    return;
  }

  const { page, limit, q, party, state } = parsed.data;
  const where = {
    sourceNamespace: "camara",
    ...(q ? { name: { contains: q } } : {}),
    ...(party ? { party } : {}),
    ...(state ? { state } : {}),
  };
  const [total, representatives] = await prisma.$transaction([
    prisma.representative.count({ where }),
    prisma.representative.findMany({
      where,
      orderBy: [{ name: "asc" }, { externalId: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        externalId: true,
        name: true,
        party: true,
        state: true,
        photoUrl: true,
        lastSyncedAt: true,
        source: {
          select: { type: true, name: true, url: true, consultedAt: true },
        },
      },
    }),
  ]);

  sendJson(response, 200, {
    data: representatives.map(representativeDto),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function getRepresentative(
  externalId: string,
  response: ServerResponse,
): Promise<void> {
  const parsedId = externalIdSchema.safeParse(externalId);
  if (!parsedId.success) {
    sendError(response, 400, "VALIDATION_ERROR", "Representative ID is invalid.", [
      { field: "id", message: parsedId.error.issues[0]?.message ?? "Invalid ID." },
    ]);
    return;
  }

  const representative = await prisma.representative.findUnique({
    where: {
      sourceNamespace_externalId: {
        sourceNamespace: "camara",
        externalId: parsedId.data,
      },
    },
    select: {
      externalId: true,
      name: true,
      party: true,
      state: true,
      photoUrl: true,
      lastSyncedAt: true,
      source: {
        select: { type: true, name: true, url: true, consultedAt: true },
      },
    },
  });

  if (!representative) {
    sendError(response, 404, "NOT_FOUND", "Representative was not found.");
    return;
  }

  sendJson(response, 200, { data: representativeDto(representative) });
}
