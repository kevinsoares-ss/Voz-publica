import { z } from "zod";
import { CamaraApiError } from "./client.js";

const API_BASE_URL = "https://dadosabertos.camara.leg.br/api/v2/";

const querySchema = z.object({
  page: z.number().int().min(1).max(1_000_000),
  limit: z.number().int().min(1).max(100),
  year: z.number().int().min(1900).max(2200).optional(),
  type: z.string().regex(/^[A-Z]{1,10}$/).optional(),
});

const recordSchema = z.record(z.string(), z.unknown());
const linkSchema = z.object({
  rel: z.string(),
  href: z.string().url(),
});
const listEnvelopeSchema = z.object({
  dados: z.array(recordSchema),
  links: z.array(linkSchema).optional().default([]),
});
const detailEnvelopeSchema = z.object({
  dados: recordSchema,
  links: z.array(linkSchema).optional().default([]),
});

export type OfficialRecord = Record<string, unknown>;

export type OfficialListResult = {
  data: OfficialRecord[];
  source: { name: string; url: string; consultedAt: string };
  pagination: { page: number; limit: number; nextUrl: string | null };
};

async function requestJson(url: URL): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new CamaraApiError("The Câmara API request timed out.", "CAMARA_TIMEOUT");
    }
    throw new CamaraApiError(
      "The Câmara API could not be reached.",
      "CAMARA_NETWORK_ERROR",
    );
  }
  if (!response.ok) {
    throw new CamaraApiError(
      `The Câmara API returned HTTP ${response.status}.`,
      "CAMARA_HTTP_ERROR",
      response.status,
    );
  }
  try {
    return await response.json();
  } catch {
    throw new CamaraApiError(
      "The Câmara API response was not valid JSON.",
      "CAMARA_INVALID_RESPONSE",
    );
  }
}

function nextPageUrl(href: string | undefined, requestedUrl: URL): string | null {
  if (!href) return null;
  let nextUrl: URL;
  try {
    nextUrl = new URL(href);
  } catch {
    throw new CamaraApiError(
      "The Câmara API returned an invalid pagination URL.",
      "CAMARA_INVALID_PAGINATION",
    );
  }
  const baseUrl = new URL(API_BASE_URL);
  if (
    nextUrl.origin !== baseUrl.origin ||
    !nextUrl.pathname.startsWith(baseUrl.pathname) ||
    nextUrl.toString() === requestedUrl.toString()
  ) {
    throw new CamaraApiError(
      "The Câmara API returned an unsafe pagination URL.",
      "CAMARA_INVALID_PAGINATION",
    );
  }
  return nextUrl.toString();
}

function parseQuery(input: {
  page: number;
  limit: number;
  year?: number;
  type?: string;
}) {
  const parsed = querySchema.safeParse(input);
  if (!parsed.success) {
    throw new CamaraApiError(
      "Invalid official resource query parameters.",
      "CAMARA_INVALID_PAGINATION",
    );
  }
  return parsed.data;
}

export async function listOfficialProposals(input: {
  page: number;
  limit: number;
  year?: number;
  type?: string;
}): Promise<OfficialListResult> {
  const query = parseQuery(input);
  const url = new URL("proposicoes", API_BASE_URL);
  url.searchParams.set("ordem", "DESC");
  url.searchParams.set("ordenarPor", "id");
  url.searchParams.set("pagina", String(query.page));
  url.searchParams.set("itens", String(query.limit));
  if (query.year !== undefined) url.searchParams.set("ano", String(query.year));
  if (query.type) url.searchParams.set("siglaTipo", query.type);

  const parsed = listEnvelopeSchema.safeParse(await requestJson(url));
  if (!parsed.success) {
    throw new CamaraApiError(
      "The Câmara API proposal list had an unexpected format.",
      "CAMARA_INVALID_RESPONSE",
    );
  }
  const nextUrl = nextPageUrl(
    parsed.data.links.find((link) => link.rel === "next")?.href,
    url,
  );
  return {
    data: parsed.data.dados,
    source: {
      name: "Câmara dos Deputados — Dados Abertos",
      url: url.toString(),
      consultedAt: new Date().toISOString(),
    },
    pagination: { page: query.page, limit: query.limit, nextUrl },
  };
}

export async function getOfficialProposal(
  externalId: string,
): Promise<{ data: OfficialRecord; source: OfficialListResult["source"] }> {
  if (!/^\d{1,20}$/.test(externalId)) {
    throw new CamaraApiError("Invalid official proposal ID.", "CAMARA_INVALID_RESPONSE");
  }
  const url = new URL(`proposicoes/${externalId}`, API_BASE_URL);
  const parsed = detailEnvelopeSchema.safeParse(await requestJson(url));
  if (!parsed.success) {
    throw new CamaraApiError(
      "The Câmara API proposal detail had an unexpected format.",
      "CAMARA_INVALID_RESPONSE",
    );
  }
  return {
    data: parsed.data.dados,
    source: {
      name: "Câmara dos Deputados — Dados Abertos",
      url: url.toString(),
      consultedAt: new Date().toISOString(),
    },
  };
}

export async function listOfficialProposalEvents(
  externalId: string,
  kind: "tramitacoes" | "votacoes",
): Promise<OfficialListResult> {
  if (!/^\d{1,20}$/.test(externalId)) {
    throw new CamaraApiError("Invalid official proposal ID.", "CAMARA_INVALID_RESPONSE");
  }
  const url = new URL(`proposicoes/${externalId}/${kind}`, API_BASE_URL);
  const parsed = listEnvelopeSchema.safeParse(await requestJson(url));
  if (!parsed.success) {
    throw new CamaraApiError(
      `The Câmara API ${kind} response had an unexpected format.`,
      "CAMARA_INVALID_RESPONSE",
    );
  }
  return {
    data: parsed.data.dados,
    source: {
      name: "Câmara dos Deputados — Dados Abertos",
      url: url.toString(),
      consultedAt: new Date().toISOString(),
    },
    pagination: { page: 1, limit: parsed.data.dados.length, nextUrl: null },
  };
}

export async function listOfficialExpenses(
  representativeId: string,
  year: number,
  page: number,
  limit: number,
): Promise<OfficialListResult> {
  if (!/^\d{1,20}$/.test(representativeId)) {
    throw new CamaraApiError(
      "Invalid official representative ID.",
      "CAMARA_INVALID_RESPONSE",
    );
  }
  const query = parseQuery({ page, limit, year });
  const url = new URL(
    `deputados/${representativeId}/despesas`,
    API_BASE_URL,
  );
  url.searchParams.set("ano", String(query.year));
  url.searchParams.set("pagina", String(query.page));
  url.searchParams.set("itens", String(query.limit));
  const parsed = listEnvelopeSchema.safeParse(await requestJson(url));
  if (!parsed.success) {
    throw new CamaraApiError(
      "The Câmara API expense response had an unexpected format.",
      "CAMARA_INVALID_RESPONSE",
    );
  }
  return {
    data: parsed.data.dados,
    source: {
      name: "Câmara dos Deputados — Dados Abertos",
      url: url.toString(),
      consultedAt: new Date().toISOString(),
    },
    pagination: {
      page: query.page,
      limit: query.limit,
      nextUrl: nextPageUrl(
        parsed.data.links.find((link) => link.rel === "next")?.href,
        url,
      ),
    },
  };
}

export async function listOfficialIndividualVotes(
  voteId: string,
): Promise<OfficialListResult> {
  if (!/^[A-Za-z0-9_-]{1,50}$/.test(voteId)) {
    throw new CamaraApiError("Invalid official vote ID.", "CAMARA_INVALID_RESPONSE");
  }
  const url = new URL(`votacoes/${encodeURIComponent(voteId)}/votos`, API_BASE_URL);
  const parsed = listEnvelopeSchema.safeParse(await requestJson(url));
  if (!parsed.success) {
    throw new CamaraApiError(
      "The Câmara API individual votes response had an unexpected format.",
      "CAMARA_INVALID_RESPONSE",
    );
  }
  return {
    data: parsed.data.dados,
    source: {
      name: "Câmara dos Deputados — Dados Abertos",
      url: url.toString(),
      consultedAt: new Date().toISOString(),
    },
    pagination: { page: 1, limit: parsed.data.dados.length, nextUrl: null },
  };
}
