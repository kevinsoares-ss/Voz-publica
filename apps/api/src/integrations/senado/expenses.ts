import { z } from "zod";
import { SenadoApiError } from "./client.js";

export const SENADO_CEAPS_BASE_URL =
  "https://adm.senado.gov.br/adm-dadosabertos/api/v1/senadores/despesas_ceaps";

export function senadoCeapsSourceId(year: number): string {
  return `senado-ceaps-${year}`;
}

const numericIdSchema = z
  .union([z.string().regex(/^\d+$/), z.number().int().positive()])
  .transform(String);
const amountSchema = z
  .union([
    z.number().finite(),
    z.string().regex(/^-?\d+(?:\.\d+)?$/),
  ])
  .transform(String);
const expenseSchema = z.object({
  id: numericIdSchema,
  ano: z.number().int(),
  mes: z.number().int().min(1).max(12),
  codSenador: numericIdSchema,
  tipoDespesa: z.string().trim().min(1).nullable(),
  fornecedor: z.string().trim().nullable(),
  valorReembolsado: amountSchema.nullable(),
}).passthrough();

export type SenadoExpense = z.infer<typeof expenseSchema>;

export type SenadoExpensesResult = {
  expenses: SenadoExpense[];
  year: number;
  requestedUrl: string;
  consultedAt: Date;
};

export class SenadoExpensesClient {
  private readonly timeoutMs: number;
  private readonly fetchImplementation: typeof fetch;

  constructor(options: {
    timeoutMs?: number;
    fetchImplementation?: typeof fetch;
  } = {}) {
    this.timeoutMs = options.timeoutMs ?? 45_000;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  async listExpenses(year: number): Promise<SenadoExpensesResult> {
    if (!Number.isInteger(year) || year < 1900 || year > 2200) {
      throw new SenadoApiError(
        "The requested Senate expense year is invalid.",
        "SENADO_INVALID_RESPONSE",
      );
    }

    const url = new URL(`${SENADO_CEAPS_BASE_URL}/${year}`);
    let response: Response;
    try {
      response = await this.fetchImplementation(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new SenadoApiError(
          "The Senado expense request timed out.",
          "SENADO_TIMEOUT",
        );
      }
      throw new SenadoApiError(
        "The Senado expense API could not be reached.",
        "SENADO_NETWORK_ERROR",
      );
    }

    if (!response.ok) {
      throw new SenadoApiError(
        `The Senado expense API returned HTTP ${response.status}.`,
        "SENADO_HTTP_ERROR",
        response.status,
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new SenadoApiError(
        "The Senado expense response was not valid JSON.",
        "SENADO_INVALID_RESPONSE",
      );
    }

    const parsed = z.array(expenseSchema).safeParse(body);
    if (
      !parsed.success ||
      parsed.data.some((expense) => expense.ano !== year) ||
      new Set(parsed.data.map((expense) => expense.id)).size !== parsed.data.length
    ) {
      throw new SenadoApiError(
        "The Senado expense response did not match the expected CEAPS format.",
        "SENADO_INVALID_RESPONSE",
      );
    }

    return {
      expenses: parsed.data,
      year,
      requestedUrl: url.toString(),
      consultedAt: new Date(),
    };
  }
}
