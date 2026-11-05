import assert from "node:assert/strict";
import test from "node:test";
import {
  SenadoApiError,
  SenadoClient,
} from "../src/integrations/senado/client.js";
import { SenadoExpensesClient } from "../src/integrations/senado/expenses.js";
import { syncCurrentSenators } from "../src/integrations/senado/sync-senators.js";
import { syncSenateExpenses } from "../src/integrations/senado/sync-expenses.js";

const senateList = {
  statusCode: 200,
  msg: "Dados gerados com sucesso",
  data: [{
    codigoParlamentar: 5672,
    nomeParlamentar: "SENADOR DE TESTE",
    titularSuplente: "Titular",
    uf: "DF",
    partido: "TESTE",
    email: "private-field-is-not-mapped@example.invalid",
  }],
};

const senateExpenses = [{
  id: 2271201,
  tipoDocumento: "Fatura",
  ano: 2025,
  mes: 9,
  codSenador: 5672,
  nomeSenador: "SENADOR DE TESTE",
  tipoDespesa: "Passagens aéreas",
  cpfCnpj: "not-persisted",
  fornecedor: "Fornecedor de teste",
  documento: "not-persisted",
  data: "2025-09-16",
  detalhamento: "not-persisted",
  valorReembolsado: 1261.77,
}];

test("Senado client validates and maps current senator records", async () => {
  const client = new SenadoClient({
    fetchImplementation: async () => Response.json(senateList),
  });
  const result = await client.listCurrentSenators();

  assert.deepEqual(result.senators, [{
    id: "5672",
    name: "SENADOR DE TESTE",
    civilName: null,
    party: "TESTE",
    state: "DF",
    photoUrl: null,
    sourceUrl: null,
  }]);
  assert.equal(
    result.requestedUrl,
    "https://adm.senado.gov.br/adm-dadosabertos/api/v1/senadores",
  );
});

test("Senado client surfaces HTTP and invalid JSON/shape errors", async () => {
  const httpClient = new SenadoClient({
    fetchImplementation: async () => new Response("", { status: 503 }),
  });
  await assert.rejects(
    httpClient.listCurrentSenators(),
    (error: unknown) =>
      error instanceof SenadoApiError &&
      error.code === "SENADO_HTTP_ERROR" &&
      error.statusCode === 503,
  );

  const invalidJsonClient = new SenadoClient({
    fetchImplementation: async () => new Response("{"),
  });
  await assert.rejects(
    invalidJsonClient.listCurrentSenators(),
    (error: unknown) =>
      error instanceof SenadoApiError &&
      error.code === "SENADO_INVALID_RESPONSE",
  );

  const invalidShapeClient = new SenadoClient({
    fetchImplementation: async () => Response.json({ data: [] }),
  });
  await assert.rejects(
    invalidShapeClient.listCurrentSenators(),
    (error: unknown) =>
      error instanceof SenadoApiError &&
      error.code === "SENADO_INVALID_RESPONSE",
  );
});

test("Senado CEAPS client validates and maps year-specific expense records", async () => {
  const client = new SenadoExpensesClient({
    fetchImplementation: async (input) => {
      assert.equal(
        String(input),
        "https://adm.senado.gov.br/adm-dadosabertos/api/v1/senadores/despesas_ceaps/2025",
      );
      return Response.json(senateExpenses);
    },
  });
  const result = await client.listExpenses(2025);

  assert.equal(result.year, 2025);
  assert.equal(result.expenses.length, 1);
  assert.equal(result.expenses[0].id, "2271201");
  assert.equal(result.expenses[0].codSenador, "5672");
  assert.equal(result.expenses[0].valorReembolsado, "1261.77");
});

test("Senado CEAPS client rejects HTTP errors, mismatched years, and duplicate IDs", async () => {
  const httpClient = new SenadoExpensesClient({
    fetchImplementation: async () => new Response("", { status: 503 }),
  });
  await assert.rejects(
    httpClient.listExpenses(2025),
    (error: unknown) =>
      error instanceof SenadoApiError &&
      error.code === "SENADO_HTTP_ERROR" &&
      error.statusCode === 503,
  );

  const wrongYearClient = new SenadoExpensesClient({
    fetchImplementation: async () =>
      Response.json([{ ...senateExpenses[0], ano: 2024 }]),
  });
  await assert.rejects(
    wrongYearClient.listExpenses(2025),
    (error: unknown) =>
      error instanceof SenadoApiError &&
      error.code === "SENADO_INVALID_RESPONSE",
  );

  const duplicateClient = new SenadoExpensesClient({
    fetchImplementation: async () =>
      Response.json([...senateExpenses, ...senateExpenses]),
  });
  await assert.rejects(
    duplicateClient.listExpenses(2025),
    (error: unknown) =>
      error instanceof SenadoApiError &&
      error.code === "SENADO_INVALID_RESPONSE",
  );
});

test("Senado sync persists only the current roster returned by its client", async () => {
  let savedCount = 0;
  const result = await syncCurrentSenators({
    client: new SenadoClient({
      fetchImplementation: async () => Response.json(senateList),
    }),
    save: async (payload) => {
      savedCount = payload.senators.length;
    },
  });

  assert.equal(savedCount, 1);
  assert.equal(result.senatorsSynced, 1);
});

test("Senado CEAPS sync reports fetched and saved record counts", async () => {
  let savedExpenseCount = 0;
  const result = await syncSenateExpenses(2025, {
    client: new SenadoExpensesClient({
      fetchImplementation: async () => Response.json(senateExpenses),
    }),
    save: async (payload) => {
      savedExpenseCount = payload.expenses.length;
      return { syncedCount: 1, unmatchedCount: 0 };
    },
  });

  assert.equal(savedExpenseCount, 1);
  assert.equal(result.fetchedCount, 1);
  assert.equal(result.syncedCount, 1);
  assert.equal(result.unmatchedCount, 0);
});
