import { XMLParser, XMLValidator } from "fast-xml-parser";
import { z } from "zod";

const SENATE_LIST_URL =
  "https://legis.senado.leg.br/dadosabertos/senador/lista/atual";

const senatorSchema = z.object({
  IdentificacaoParlamentar: z.object({
    CodigoParlamentar: z.string().regex(/^\d+$/),
    NomeParlamentar: z.string().min(1),
    NomeCompletoParlamentar: z.string().optional(),
    SiglaPartidoParlamentar: z.string().optional(),
    UfParlamentar: z.string().length(2).optional(),
    UrlFotoParlamentar: z.string().url().optional(),
    UrlPaginaParlamentar: z.string().url().optional(),
  }).passthrough(),
}).passthrough();

const responseSchema = z.object({
  ListaParlamentarEmExercicio: z.object({
    Parlamentares: z.object({
      Parlamentar: z.array(senatorSchema).min(1),
    }),
  }),
});

export type SenadoSenator = {
  id: string;
  name: string;
  civilName: string | null;
  party: string | null;
  state: string | null;
  photoUrl: string | null;
  sourceUrl: string | null;
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

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  trimValues: true,
  isArray: (tagName) => tagName === "Parlamentar",
});

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
    let response: Response;
    try {
      response = await this.fetchImplementation(this.url, {
        headers: { accept: "application/xml, text/xml" },
        signal: AbortSignal.timeout(this.timeoutMs),
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

    let xml: string;
    try {
      xml = await response.text();
    } catch {
      throw new SenadoApiError(
        "The Senado API response could not be read.",
        "SENADO_INVALID_RESPONSE",
      );
    }
    if (XMLValidator.validate(xml) !== true) {
      throw new SenadoApiError(
        "The Senado API response was not valid XML.",
        "SENADO_INVALID_RESPONSE",
      );
    }

    const parsed = responseSchema.safeParse(xmlParser.parse(xml));
    if (!parsed.success) {
      throw new SenadoApiError(
        "The Senado API response did not match the expected senator-list format.",
        "SENADO_INVALID_RESPONSE",
      );
    }

    const senators = parsed.data.ListaParlamentarEmExercicio.Parlamentares
      .Parlamentar.map(({ IdentificacaoParlamentar: item }) => ({
        id: item.CodigoParlamentar,
        name: item.NomeParlamentar,
        civilName: item.NomeCompletoParlamentar ?? null,
        party: item.SiglaPartidoParlamentar ?? null,
        state: item.UfParlamentar ?? null,
        photoUrl: item.UrlFotoParlamentar ?? null,
        sourceUrl: item.UrlPaginaParlamentar ?? null,
      }));

    return {
      senators,
      requestedUrl: this.url.toString(),
      consultedAt: new Date(),
    };
  }
}
