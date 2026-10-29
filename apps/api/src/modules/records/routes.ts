import type { ServerResponse } from "node:http";
import { z } from "zod";
import { prisma } from "../../database.js";
import { sendError, sendJson } from "../../lib/http.js";

const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      "A_VERIFICAR",
      "EM_ANDAMENTO",
      "CUMPRIDO",
      "PARCIALMENTE_CUMPRIDO",
      "NAO_CUMPRIDO",
      "SEM_INFORMACAO_SUFICIENTE",
    ])
    .optional(),
});
const publicPoliticianIdSchema = z
  .string()
  .regex(/^(?:[a-z0-9_-]{1,30}:)?[A-Za-z0-9_-]{1,50}$/);
const uuidSchema = z.string().uuid();

function parsePageQuery(url: URL) {
  return pageQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });
}

function sendValidationError(
  response: ServerResponse,
  issues: Array<{ path: PropertyKey[]; message: string }>,
) {
  sendError(
    response,
    400,
    "VALIDATION_ERROR",
    "One or more request parameters are invalid.",
    issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  );
}

async function findPolitician(id: string) {
  const parsed = publicPoliticianIdSchema.safeParse(id);
  if (!parsed.success) return { invalid: true as const };
  const [namespace, externalId] = parsed.data.includes(":")
    ? parsed.data.split(":", 2)
    : ["camara", parsed.data];
  const politician = await prisma.representative.findUnique({
    where: {
      sourceNamespace_externalId: { sourceNamespace: namespace, externalId },
    },
    select: { id: true },
  });
  return politician
    ? { invalid: false as const, id: politician.id }
    : { invalid: false as const, id: null };
}

export async function listCommitments(
  url: URL,
  response: ServerResponse,
  politicianPublicId?: string,
): Promise<void> {
  const parsed = parsePageQuery(url);
  if (!parsed.success) {
    sendValidationError(response, parsed.error.issues);
    return;
  }

  let representativeId: string | undefined;
  if (politicianPublicId !== undefined) {
    const politician = await findPolitician(politicianPublicId);
    if (politician.invalid) {
      sendError(response, 400, "VALIDATION_ERROR", "Politician ID is invalid.");
      return;
    }
    if (!politician.id) {
      sendError(response, 404, "NOT_FOUND", "Politician was not found.");
      return;
    }
    representativeId = politician.id;
  }

  const { page, limit, status } = parsed.data;
  const where = {
    ...(representativeId ? { representativeId } : {}),
    ...(status ? { status } : {}),
  };
  const [total, commitments] = await prisma.$transaction([
    prisma.commitment.count({ where }),
    prisma.commitment.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        registeredAt: true,
        deadline: true,
        status: true,
        evaluationMethod: true,
        createdAt: true,
        updatedAt: true,
        source: {
          select: { type: true, name: true, url: true, consultedAt: true },
        },
        representative: {
          select: {
            sourceNamespace: true,
            externalId: true,
            name: true,
            role: true,
            state: true,
          },
        },
        evidences: {
          select: { id: true, description: true, factAt: true, sourceId: true },
          orderBy: { consultedAt: "desc" },
        },
        history: {
          select: {
            id: true,
            previousStatus: true,
            newStatus: true,
            rationale: true,
            changedAt: true,
            evidences: {
              select: {
                evidence: { select: { id: true, description: true } },
              },
            },
          },
          orderBy: { changedAt: "desc" },
        },
      },
    }),
  ]);

  sendJson(response, 200, {
    data: commitments.map((commitment) => ({
      ...commitment,
      politician: commitment.representative
        ? {
            ...commitment.representative,
            id:
              commitment.representative.sourceNamespace === "camara"
                ? commitment.representative.externalId
                : `${commitment.representative.sourceNamespace}:${commitment.representative.externalId}`,
          }
        : null,
      representative: undefined,
      evidenceCount: commitment.evidences.length,
      evidences: commitment.evidences.map(({ sourceId: _sourceId, ...evidence }) => evidence),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function listGovernmentActions(
  politicianPublicId: string,
  url: URL,
  response: ServerResponse,
): Promise<void> {
  const parsedId = publicPoliticianIdSchema.safeParse(politicianPublicId);
  if (!parsedId.success) {
    sendError(response, 400, "VALIDATION_ERROR", "Politician ID is invalid.");
    return;
  }
  const parsed = z
    .object({
      page: z.coerce.number().int().min(1).max(1_000_000).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .safeParse({
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
  if (!parsed.success) {
    sendValidationError(response, parsed.error.issues);
    return;
  }

  const politician = await findPolitician(parsedId.data);
  if (politician.invalid) {
    sendError(response, 400, "VALIDATION_ERROR", "Politician ID is invalid.");
    return;
  }
  if (!politician.id) {
    sendError(response, 404, "NOT_FOUND", "Politician was not found.");
    return;
  }

  const { page, limit } = parsed.data;
  const where = { representativeId: politician.id };
  const [total, actions] = await prisma.$transaction([
    prisma.governmentAction.count({ where }),
    prisma.governmentAction.findMany({
      where,
      orderBy: [{ eventDate: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        category: true,
        evidenceUrl: true,
        sourceName: true,
        eventDate: true,
        createdAt: true,
        source: {
          select: { type: true, name: true, url: true, consultedAt: true },
        },
      },
    }),
  ]);

  sendJson(response, 200, {
    data: actions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function listCommitmentEvidences(
  commitmentId: string,
  response: ServerResponse,
): Promise<void> {
  const parsedId = uuidSchema.safeParse(commitmentId);
  if (!parsedId.success) {
    sendError(response, 400, "VALIDATION_ERROR", "Commitment ID is invalid.");
    return;
  }

  const commitment = await prisma.commitment.findUnique({
    where: { id: parsedId.data },
    select: { id: true },
  });
  if (!commitment) {
    sendError(response, 404, "NOT_FOUND", "Commitment was not found.");
    return;
  }

  const evidences = await prisma.evidence.findMany({
    where: { commitmentId: commitment.id },
    orderBy: [{ consultedAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      type: true,
      description: true,
      factAt: true,
      observation: true,
      consultedAt: true,
      source: {
        select: { type: true, name: true, url: true, consultedAt: true },
      },
    },
  });
  sendJson(response, 200, { data: evidences });
}
