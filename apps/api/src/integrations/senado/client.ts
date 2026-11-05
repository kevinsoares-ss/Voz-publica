import { z } from "zod";

const SENATE_LIST_URL =
  "https://adm.senado.gov.br/adm-dadosabertos/api/v1/senadores";

const officialIdSchema = z
  .union([z.string().regex(/^\d+$/), z.number().int().positive()])
  .transform(String);

const senatorSchema = z.object({
  codigoParlamentar: officialIdSchema,
  nomeParlamentar: z.string().trim().min(1),
  partido: z.string().trim().nullable().optional(),
  uf: z.string().trim().length(2).nullable().optional(),
}).passthrough();

const responseSchema = z.object({
  statusCode: z.literal(200),
  data: z.array(senatorSchema).min(1),
});

export type SenadoSenator = {
  id: string;
  name: string;
  civilName: null;
  party: string | null;
  state: string | null;
  photoUrl: null;
  sourceUrl: null;
};

export type SenadoListResult = {
  senators: SenadoSenator[];
  requestedUrl: string;
  consultedAt: Date;
};

export class SenadoApiError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "SENADO_TIMEOUT"
      | "SENADO_NETWORK_ERROR"
      | "SENADO_HTTP_ERROR"
      | "SENADO_INVALID_RESPONSE",
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "SenadoApiError";
  }
}

async function requestJson(
  url: URL,
  timeoutMs: number,
  fetchImplementation: typeof fetch,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchImplementation(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new SenadoApiError(
        "The Senado API request timed out.",
        "SENADO_TIMEOUT",
      );
    }
    throw new SenadoApiError(
      "The Senado API could not be reached.",
      "SENADO_NETWORK_ERROR",
    );
  }

  if (!response.ok) {
    throw new SenadoApiError(
      `The Senado API returned HTTP ${response.status}.`,
      "SENADO_HTTP_ERROR",
      response.status,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new SenadoApiError(
      "The Senado API response was not valid JSON.",
      "SENADO_INVALID_RESPONSE",
    );
  }
}

export class SenadoClient {
  private readonly url: URL;
  private readonly timeoutMs: number;
  private readonly fetchImplementation: typeof fetch;

  constructor(options: {
    url?: string;
    timeoutMs?: number;
    fetchImplementation?: typeof fetch;
  } = {}) {
    this.url = new URL(options.url ?? SENATE_LIST_URL);
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  async listCurrentSenators(): Promise<SenadoListResult> {
    const body = await requestJson(
      this.url,
      this.timeoutMs,
      this.fetchImplementation,
    );
    const parsed = responseSchema.safeParse(body);
    if (!parsed.success) {
      throw new SenadoApiError(
        "The Senado API response did not match the expected senator-list format.",
        "SENADO_INVALID_RESPONSE",
      );
    }

    return {
      senators: parsed.data.data.map((item) => ({
        id: item.codigoParlamentar,
        name: item.nomeParlamentar,
        civilName: null,
        party: item.partido ?? null,
        state: item.uf ?? null,
        photoUrl: null,
        sourceUrl: null,
      })),
      requestedUrl: this.url.toString(),
      consultedAt: new Date(),
    };
  }
}
