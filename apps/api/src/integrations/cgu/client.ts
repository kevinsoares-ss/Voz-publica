import { z } from "zod";

const CGU_EXPENSES_URL =
  "https://api.portaldatransparencia.gov.br/api-de-dados/despesas/por-orgao";

const expensesResponseSchema = z.array(
  z
    .object({
      ano: z.number().int().nullable().optional(),
      orgao: z.string().nullable().optional(),
      codigoOrgao: z.string().nullable().optional(),
      orgaoSuperior: z.string().nullable().optional(),
      codigoOrgaoSuperior: z.string().nullable().optional(),
      empenhado: z.string().nullable().optional(),
      liquidado: z.string().nullable().optional(),
      pago: z.string().nullable().optional(),
    })
    .passthrough(),
);
const agencyResponseSchema = z.array(
  z.object({
    codigo: z.string().nullable().optional(),
    descricao: z.string().nullable().optional(),
  }).passthrough(),
);

export type CguExpense = z.infer<typeof expensesResponseSchema>[number];
export type CguAgency = z.infer<typeof agencyResponseSchema>[number];

export class CguApiError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "CGU_API_KEY_MISSING"
      | "CGU_TIMEOUT"
      | "CGU_NETWORK_ERROR"
      | "CGU_HTTP_ERROR"
      | "CGU_INVALID_RESPONSE",
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "CguApiError";
  }
}

export class CguClient {
  private readonly url: URL;
  private readonly apiKey: string | undefined;
  private readonly timeoutMs: number;
  private readonly fetchImplementation: typeof fetch;

  constructor(options: {
    apiKey?: string;
    timeoutMs?: number;
    fetchImplementation?: typeof fetch;
  } = {}) {
    this.url = new URL(CGU_EXPENSES_URL);
    this.apiKey = options.apiKey ?? process.env.CGU_API_KEY;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  async listAnnualExpenses(options: {
    year: number;
    page: number;
    superiorAgencyCode?: string;
    agencyCode?: string;
  }): Promise<{
    data: CguExpense[];
    requestedUrl: string;
    consultedAt: Date;
    page: number;
  }> {
    const url = new URL(this.url);
    url.searchParams.set("ano", String(options.year));
    url.searchParams.set("pagina", String(options.page));
    if (options.superiorAgencyCode) {
      url.searchParams.set("orgaoSuperior", options.superiorAgencyCode);
    }
    if (options.agencyCode) {
      url.searchParams.set("orgao", options.agencyCode);
    }

    const payload = await this.request(url);
    const parsed = expensesResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new CguApiError(
        "The CGU API response did not match the documented expenses format.",
        "CGU_INVALID_RESPONSE",
      );
    }

    return {
      data: parsed.data,
      requestedUrl: url.toString(),
      consultedAt: new Date(),
      page: options.page,
    };
  }

  async searchAgencies(options: {
    description: string;
    page: number;
  }): Promise<{
    data: CguAgency[];
    requestedUrl: string;
    consultedAt: Date;
    page: number;
  }> {
    const url = new URL("/api-de-dados/orgaos-siafi", this.url);
    url.searchParams.set("descricao", options.description);
    url.searchParams.set("pagina", String(options.page));
    const response = await this.request(url);
    const parsed = agencyResponseSchema.safeParse(response);
    if (!parsed.success) {
      throw new CguApiError(
        "The CGU API response did not match the documented agency format.",
        "CGU_INVALID_RESPONSE",
      );
    }
    return {
      data: parsed.data,
      requestedUrl: url.toString(),
      consultedAt: new Date(),
      page: options.page,
    };
  }

  private async request(url: URL): Promise<unknown> {
    const apiKey = this.apiKey?.trim();
    if (!apiKey) {
      throw new CguApiError(
        "CGU API access is not configured on the server.",
        "CGU_API_KEY_MISSING",
      );
    }

    let response: Response;
    try {
      response = await this.fetchImplementation(url, {
        headers: {
          accept: "application/json",
          "chave-api-dados": apiKey,
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new CguApiError(
          "The CGU API request timed out.",
          "CGU_TIMEOUT",
        );
      }
      throw new CguApiError(
        "The CGU API could not be reached.",
        "CGU_NETWORK_ERROR",
      );
    }

    if (!response.ok) {
      throw new CguApiError(
        `The CGU API returned HTTP ${response.status}.`,
        "CGU_HTTP_ERROR",
        response.status,
      );
    }

    try {
      return await response.json();
    } catch {
      throw new CguApiError(
        "The CGU API response was not valid JSON.",
        "CGU_INVALID_RESPONSE",
      );
    }
  }
}
