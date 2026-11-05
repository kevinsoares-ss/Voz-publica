import type { ApiResponse } from "../../lib/http.js";
import { z } from "zod";
import { sendError, sendJson } from "../../lib/http.js";
import { prisma } from "../../database.js";
import { CamaraApiError } from "../../integrations/camara/client.js";
import { senadoCeapsSourceId } from "../../integrations/senado/expenses.js";
import {
  getOfficialProposal,
  listOfficialExpenses,
  listOfficialIndividualVotes,
  listOfficialProposalEvents,
  listOfficialProposals,
} from "../../integrations/camara/resources.js";

const proposalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  year: z.coerce.number().int().min(1900).max(2200).default(2025),
  type: z.string().regex(/^[A-Z]{1,10}$/).default("PL"),
  number: z.coerce.number().int().min(1).max(1_000_000_000).optional(),
  authorId: z.string().regex(/^\d{1,20}$/).optional(),
});
const expensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  year: z.coerce.number().int().min(1900).max(2200),
});
const officialNumericIdSchema = z.string().regex(/^\d{1,20}$/);
const publicRepresentativeIdSchema = z.string().regex(
  /^(?:(?:camara|senado):)?\d{1,20}$/,
);
const officialVoteIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,50}$/);

function validationError(
  response: ApiResponse,
  issues: Array<{ path: PropertyKey[]; message: string }>,
) {
  sendError(
    response,
    400,
    "VALIDATION_ERROR",
    "One or more query parameters are invalid.",
    issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  );
}

function upstreamError(response: ApiResponse, error: unknown) {
  if (error instanceof CamaraApiError) {
    const statusCode =
      error.code === "CAMARA_TIMEOUT"
        ? 504
        : error.code === "CAMARA_HTTP_ERROR" && error.statusCode === 429
          ? 503
          : 502;
    sendError(response, statusCode, error.code, error.message);
    return;
  }
  throw error;
}

export async function listProposals(url: URL, response: ApiResponse) {
  const parsed = proposalsQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    year: url.searchParams.get("year") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    number: url.searchParams.get("number") ?? undefined,
    authorId: url.searchParams.get("authorId") ?? undefined,
  });
  if (!parsed.success) {
    validationError(response, parsed.error.issues);
    return;
  }
  try {
    sendJson(response, 200, await listOfficialProposals(parsed.data));
  } catch (error) {
    upstreamError(response, error);
  }
}

export async function proposalDetail(id: string, response: ApiResponse) {
  if (!officialNumericIdSchema.safeParse(id).success) {
    sendError(response, 400, "VALIDATION_ERROR", "Proposal ID must be numeric.");
    return;
  }
  try {
    sendJson(response, 200, await getOfficialProposal(id));
  } catch (error) {
    upstreamError(response, error);
  }
}

export async function proposalEvents(
  id: string,
  kind: "tramitacoes" | "votacoes",
  response: ApiResponse,
) {
  if (!officialNumericIdSchema.safeParse(id).success) {
    sendError(response, 400, "VALIDATION_ERROR", "Proposal ID must be numeric.");
    return;
  }
  try {
    sendJson(response, 200, await listOfficialProposalEvents(id, kind));
  } catch (error) {
    upstreamError(response, error);
  }
}

export async function individualVotes(id: string, response: ApiResponse) {
  if (!officialVoteIdSchema.safeParse(id).success) {
    sendError(response, 400, "VALIDATION_ERROR", "Vote ID is invalid.");
    return;
  }
  try {
    sendJson(response, 200, await listOfficialIndividualVotes(id));
  } catch (error) {
    upstreamError(response, error);
  }
}

export async function representativeExpenses(
  id: string,
  url: URL,
  response: ApiResponse,
) {
  if (!publicRepresentativeIdSchema.safeParse(id).success) {
    sendError(response, 400, "VALIDATION_ERROR", "Representative ID is invalid.");
    return;
  }
  const [namespace, externalId] = id.includes(":")
    ? id.split(":", 2)
    : ["camara", id];
  const parsed = expensesQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    year: url.searchParams.get("year") ?? undefined,
  });
  if (!parsed.success) {
    validationError(response, parsed.error.issues);
    return;
  }

  if (namespace === "senado") {
    const representative = await prisma.representative.findUnique({
      where: {
        sourceNamespace_externalId: { sourceNamespace: "senado", externalId },
      },
      select: { id: true },
    });
    if (!representative) {
      sendError(response, 404, "NOT_FOUND", "Senator was not found.");
      return;
    }

    const sourceId = senadoCeapsSourceId(parsed.data.year);
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      select: { name: true, url: true, consultedAt: true },
    });
    if (!source) {
      sendError(
        response,
        503,
        "SENADO_EXPENSES_NOT_SYNCED",
        "Senate expense data has not been synchronized yet.",
      );
      return;
    }

    const where = {
      representativeId: representative.id,
      sourceId,
      year: parsed.data.year,
    };
    const [total, expenses] = await prisma.$transaction([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        orderBy: [{ month: "asc" }, { externalId: "asc" }],
        skip: (parsed.data.page - 1) * parsed.data.limit,
        take: parsed.data.limit,
        select: {
          externalId: true,
          year: true,
          month: true,
          category: true,
          supplier: true,
          value: true,
        },
      }),
    ]);

    const nextUrl = new URL(url.toString());
    if (parsed.data.page * parsed.data.limit < total) {
      nextUrl.searchParams.set("page", String(parsed.data.page + 1));
    } else {
      nextUrl.searchParams.delete("page");
    }
    sendJson(response, 200, {
      data: expenses.map((expense) => ({
        id: expense.externalId,
        ano: expense.year,
        mes: expense.month,
        tipoDespesa: expense.category,
        fornecedor: expense.supplier,
        valorReembolsado: expense.value,
      })),
      source,
      pagination: {
        page: parsed.data.page,
        limit: parsed.data.limit,
        nextUrl: parsed.data.page * parsed.data.limit < total
          ? nextUrl.toString()
          : null,
      },
    });
    return;
  }

  if (!officialNumericIdSchema.safeParse(externalId).success) {
    sendError(response, 400, "VALIDATION_ERROR", "Representative ID must be numeric.");
    return;
  }
  try {
    sendJson(
      response,
      200,
      await listOfficialExpenses(
        externalId,
        parsed.data.year,
        parsed.data.page,
        parsed.data.limit,
      ),
    );
  } catch (error) {
    upstreamError(response, error);
  }
}
