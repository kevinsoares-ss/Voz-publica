import type { ServerResponse } from "node:http";
import { z } from "zod";
import { sendError, sendJson } from "../../lib/http.js";
import { CamaraApiError } from "../../integrations/camara/client.js";
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
});
const expensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  year: z.coerce.number().int().min(1900).max(2200),
});
const officialNumericIdSchema = z.string().regex(/^\d{1,20}$/);
const officialVoteIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,50}$/);

function validationError(
  response: ServerResponse,
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

function upstreamError(response: ServerResponse, error: unknown) {
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

export async function listProposals(url: URL, response: ServerResponse) {
  const parsed = proposalsQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    year: url.searchParams.get("year") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
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

export async function proposalDetail(id: string, response: ServerResponse) {
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
  response: ServerResponse,
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

export async function individualVotes(id: string, response: ServerResponse) {
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
  response: ServerResponse,
) {
  if (!officialNumericIdSchema.safeParse(id).success) {
    sendError(response, 400, "VALIDATION_ERROR", "Representative ID must be numeric.");
    return;
  }
  const parsed = expensesQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    year: url.searchParams.get("year") ?? undefined,
  });
  if (!parsed.success) {
    validationError(response, parsed.error.issues);
    return;
  }
  try {
    sendJson(
      response,
      200,
      await listOfficialExpenses(
        id,
        parsed.data.year,
        parsed.data.page,
        parsed.data.limit,
      ),
    );
  } catch (error) {
    upstreamError(response, error);
  }
}
