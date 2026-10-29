import { z } from "zod";
import {
  camaraDeputyListSchema,
  type CamaraDeputyList,
} from "./schemas.js";

const API_BASE_URL = "https://dadosabertos.camara.leg.br/api/v2/";
const deputyListQuerySchema = z.object({
  page: z.number().int().min(1).max(1_000_000),
  items: z.number().int().min(1).max(100),
});

export type FetchImplementation = typeof fetch;
export type DeputyListPageResult = {
  payload: CamaraDeputyList;
  requestedUrl: string;
  nextUrl: string | null;
};

export class CamaraApiError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "CAMARA_TIMEOUT"
      | "CAMARA_NETWORK_ERROR"
      | "CAMARA_HTTP_ERROR"
      | "CAMARA_INVALID_RESPONSE"
      | "CAMARA_INVALID_PAGINATION",
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "CamaraApiError";
  }
}

export class CamaraClient {
  private readonly baseUrl: URL;
  private readonly timeoutMs: number;
  private readonly fetchImplementation: FetchImplementation;

  constructor(options: {
    baseUrl?: string;
    timeoutMs?: number;
    fetchImplementation?: FetchImplementation;
  } = {}) {
    this.baseUrl = new URL(options.baseUrl ?? API_BASE_URL);
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  async listDeputiesPage(
    page: number,
    items = 100,
  ): Promise<DeputyListPageResult> {
    const query = deputyListQuerySchema.safeParse({ page, items });
    if (!query.success) {
      throw new CamaraApiError(
        "Invalid deputy pagination parameters.",
        "CAMARA_INVALID_PAGINATION",
      );
    }

    const url = new URL("deputados", this.baseUrl);
    url.searchParams.set("ordem", "ASC");
    url.searchParams.set("ordenarPor", "nome");
    url.searchParams.set("pagina", String(query.data.page));
    url.searchParams.set("itens", String(query.data.items));
    return this.readDeputyPage(url);
  }

  async listDeputiesFromNextUrl(
    href: string,
  ): Promise<DeputyListPageResult> {
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      throw new CamaraApiError(
        "The Câmara API returned an invalid pagination URL.",
        "CAMARA_INVALID_PAGINATION",
      );
    }

    if (
      url.origin !== this.baseUrl.origin ||
      !url.pathname.startsWith(this.baseUrl.pathname)
    ) {
      throw new CamaraApiError(
        "The Câmara API returned a pagination URL outside its API base.",
        "CAMARA_INVALID_PAGINATION",
      );
    }
    return this.readDeputyPage(url);
  }

  private async readDeputyPage(
    url: URL,
  ): Promise<DeputyListPageResult> {
    const response = await this.request(url);
    const parsed = camaraDeputyListSchema.safeParse(response.payload);

    if (!parsed.success) {
      throw new CamaraApiError(
        "The Câmara API response did not match the expected deputy-list format.",
        "CAMARA_INVALID_RESPONSE",
      );
    }

    const nextHref = parsed.data.links.find((link) => link.rel === "next")?.href;
    const nextUrl = nextHref ? this.validateNextUrl(nextHref, url) : null;

    return {
      payload: parsed.data,
      requestedUrl: url.toString(),
      nextUrl,
    };
  }

  private validateNextUrl(href: string, requestedUrl: URL): string {
    let nextUrl: URL;
    try {
      nextUrl = new URL(href);
    } catch {
      throw new CamaraApiError(
        "The Câmara API returned an invalid pagination URL.",
        "CAMARA_INVALID_PAGINATION",
      );
    }

    if (
      nextUrl.origin !== this.baseUrl.origin ||
      !nextUrl.pathname.startsWith(this.baseUrl.pathname)
    ) {
      throw new CamaraApiError(
        "The Câmara API returned a pagination URL outside its API base.",
        "CAMARA_INVALID_PAGINATION",
      );
    }
    if (nextUrl.toString() === requestedUrl.toString()) {
      throw new CamaraApiError(
        "The Câmara API pagination link points to the current page.",
        "CAMARA_INVALID_PAGINATION",
      );
    }
    return nextUrl.toString();
  }

  private async request(url: URL): Promise<{ payload: unknown }> {
    let response: Response;
    try {
      response = await this.fetchImplementation(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new CamaraApiError(
          "The Câmara API request timed out.",
          "CAMARA_TIMEOUT",
        );
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

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new CamaraApiError(
        "The Câmara API response was not valid JSON.",
        "CAMARA_INVALID_RESPONSE",
      );
    }
    return { payload };
  }
}
