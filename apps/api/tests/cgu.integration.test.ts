import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createApiServer } from "../src/app.js";
import {
  CguApiError,
  CguClient,
} from "../src/integrations/cgu/client.js";

const expenseFixture = [
  {
    ano: 2025,
    orgao: "Órgão Federal de Teste",
    codigoOrgao: "12345",
    orgaoSuperior: "Ministério de Teste",
    codigoOrgaoSuperior: "123",
    empenhado: "123456.78",
    liquidado: "100000.00",
    pago: "98765.43",
  },
];

test("CGU client sends its API key only in the official header and validates expenses", async () => {
  const requests: Array<{ url: URL; headers: Headers }> = [];
  const client = new CguClient({
    apiKey: "test-secret",
    fetchImplementation: async (input, init) => {
      requests.push({
        url: new URL(String(input)),
        headers: new Headers(init?.headers),
      });
      return Response.json(expenseFixture);
    },
  });

  const result = await client.listAnnualExpenses({
    year: 2025,
    page: 2,
    superiorAgencyCode: "123",
    agencyCode: "12345",
  });

  assert.equal(result.data[0].pago, "98765.43");
  assert.equal(result.page, 2);
  assert.equal(
    requests[0].url.origin,
    "https://api.portaldatransparencia.gov.br",
  );
  assert.equal(
    requests[0].url.pathname,
    "/api-de-dados/despesas/por-orgao",
  );
  assert.equal(requests[0].url.searchParams.get("ano"), "2025");
  assert.equal(requests[0].url.searchParams.get("pagina"), "2");
  assert.equal(requests[0].url.searchParams.get("orgaoSuperior"), "123");
  assert.equal(requests[0].url.searchParams.get("orgao"), "12345");
  assert.equal(requests[0].headers.get("chave-api-dados"), "test-secret");
  assert.equal(requests[0].url.href.includes("test-secret"), false);
  assert.equal(result.requestedUrl.includes("test-secret"), false);
});

test("CGU client searches agencies using the official SIAFI catalogue", async () => {
  let requestedUrl: URL | undefined;
  const client = new CguClient({
    apiKey: "test-secret",
    fetchImplementation: async (input) => {
      requestedUrl = new URL(String(input));
      return Response.json([{ codigo: "26000", descricao: "Ministério de Teste" }]);
    },
  });

  const result = await client.searchAgencies({
    description: "Ministério",
    page: 1,
  });

  assert.equal(result.data[0].codigo, "26000");
  assert.equal(requestedUrl?.pathname, "/api-de-dados/orgaos-siafi");
  assert.equal(requestedUrl?.searchParams.get("descricao"), "Ministério");
  assert.equal(requestedUrl?.searchParams.get("pagina"), "1");
});

test("CGU client reports missing keys, upstream failures, and invalid responses", async () => {
  const missingKeyClient = new CguClient({
    apiKey: "",
    fetchImplementation: async () => {
      throw new Error("Must not make a request without a key.");
    },
  });
  await assert.rejects(missingKeyClient.listAnnualExpenses({ year: 2025, page: 1 }), {
    code: "CGU_API_KEY_MISSING",
  });

  const unauthorizedClient = new CguClient({
    apiKey: "test-secret",
    fetchImplementation: async () => new Response("", { status: 401 }),
  });
  await assert.rejects(
    unauthorizedClient.listAnnualExpenses({ year: 2025, page: 1 }),
    (error: unknown) =>
      error instanceof CguApiError &&
      error.code === "CGU_HTTP_ERROR" &&
      error.statusCode === 401 &&
      !error.message.includes("test-secret"),
  );

  const invalidResponseClient = new CguClient({
    apiKey: "test-secret",
    fetchImplementation: async () => Response.json({ data: expenseFixture }),
  });
  await assert.rejects(
    invalidResponseClient.listAnnualExpenses({ year: 2025, page: 1 }),
    { code: "CGU_INVALID_RESPONSE" },
  );
});

test("CGU expenses route validates filters and returns source provenance", async () => {
  const cguClient = new CguClient({
    apiKey: "test-secret",
    fetchImplementation: async (input) =>
      new URL(String(input)).pathname.endsWith("/orgaos-siafi")
        ? Response.json([{ codigo: "12345", descricao: "Ministério de Teste" }])
        : Response.json(expenseFixture),
  });
  const server = createApiServer({ cguClient });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const response = await fetch(
      `${baseUrl}/api/cgu/expenses?year=2025&page=1&orgaoSuperior=123`,
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data[0].orgao, "Órgão Federal de Teste");
    assert.equal(body.source.name, "Portal da Transparência — Controladoria-Geral da União");
    assert.equal(body.source.url.includes("test-secret"), false);
    assert.equal(body.pagination.page, 1);

    const invalidYear = await fetch(
      `${baseUrl}/api/cgu/expenses?year=9999`,
    );
    assert.equal(invalidYear.status, 400);
    assert.equal((await invalidYear.json()).error.code, "VALIDATION_ERROR");

    const missingAgency = await fetch(
      `${baseUrl}/api/cgu/expenses?year=2025`,
    );
    assert.equal(missingAgency.status, 400);
    assert.equal((await missingAgency.json()).error.code, "VALIDATION_ERROR");

    const agencies = await fetch(
      `${baseUrl}/api/cgu/agencies?search=Ministério`,
    );
    assert.equal(agencies.status, 200);
    const agencyBody = await agencies.json();
    assert.equal(agencyBody.data[0].codigo, "12345");
    assert.equal(agencyBody.source.url.includes("test-secret"), false);
  } finally {
    server.close();
    await once(server, "close");
  }
});
