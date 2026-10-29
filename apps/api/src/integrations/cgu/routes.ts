import type { ServerResponse } from "node:http";
import { z } from "zod";
import { sendError, sendJson } from "../../lib/http.js";
import { CguApiError, CguClient } from "./client.js";

const currentYear = new Date().getFullYear();
const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(currentYear),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  superiorAgencyCode: z.string().trim().min(1).max(20).optional(),
  agencyCode: z.string().trim().min(1).max(20).optional(),
}).refine(
  (value) => Boolean(value.superiorAgencyCode || value.agencyCode),
  {
    path: ["orgaoSuperior"],
    message: "Informe o código de um órgão superior ou vinculado.",
  },
);
const agencyQuerySchema = z.object({
  search: z.string().trim().min(2).max(100),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

function sendCguError(response: ServerResponse, error: unknown): boolean {
  if (!(error instanceof CguApiError)) return false;
  const statusCode =
    error.code === "CGU_API_KEY_MISSING"
      ? 503
      : error.code === "CGU_TIMEOUT"
        ? 504
        : error.code === "CGU_HTTP_ERROR" && error.statusCode === 429
          ? 503
          : 502;
  sendError(response, statusCode, error.code, error.message);
  return true;
}

export async function listCguExpenses(
  url: URL,
  response: ServerResponse,
  client = new CguClient(),
): Promise<void> {
  const parsed = querySchema.safeParse({
    year: url.searchParams.get("year") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    superiorAgencyCode: url.searchParams.get("orgaoSuperior") ?? undefined,
    agencyCode: url.searchParams.get("orgao") ?? undefined,
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

  try {
    const result = await client.listAnnualExpenses({
      year: parsed.data.year,
      page: parsed.data.page,
      superiorAgencyCode: parsed.data.superiorAgencyCode,
      agencyCode: parsed.data.agencyCode,
    });
    sendJson(response, 200, {
      data: result.data,
      source: {
        name: "Portal da Transparência — Controladoria-Geral da União",
        url: result.requestedUrl,
        consultedAt: result.consultedAt.toISOString(),
      },
      pagination: { page: result.page },
    });
  } catch (error) {
    if (!sendCguError(response, error)) throw error;
  }
}

export async function listCguAgencies(
  url: URL,
  response: ServerResponse,
  client = new CguClient(),
): Promise<void> {
  const parsed = agencyQuerySchema.safeParse({
    search: url.searchParams.get("search") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
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

  try {
    const result = await client.searchAgencies({
      description: parsed.data.search,
      page: parsed.data.page,
    });
    sendJson(response, 200, {
      data: result.data,
      source: {
        name: "Portal da Transparência — Controladoria-Geral da União",
        url: result.requestedUrl,
        consultedAt: result.consultedAt.toISOString(),
      },
      pagination: { page: result.page },
    });
  } catch (error) {
    if (!sendCguError(response, error)) throw error;
  }
}
