import assert from "node:assert/strict";
import test from "node:test";
import {
  CamaraApiError,
  CamaraClient,
  type FetchImplementation,
} from "../src/integrations/camara/client.js";
import { syncRepresentatives } from "../src/integrations/camara/sync-representatives.js";

const baseUrl = "https://dadosabertos.camara.leg.br/api/v2/";

function deputyPayload(
  id: number,
  links: Array<{ rel: string; href: string }> = [],
) {
  return {
    dados: [
      {
        id,
        uri: `${baseUrl}deputados/${id}`,
        nome: `Test fixture ${id}`,
        siglaPartido: null,
        siglaUf: null,
        urlFoto: null,
      },
    ],
    links,
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("Câmara client validates official deputy list and follows its next link", async () => {
  const requestedUrls: string[] = [];
  const nextUrl =
    `${baseUrl}deputados?ordem=ASC&ordenarPor=nome&pagina=2&itens=10`;
  const fetchImplementation: FetchImplementation = async (input) => {
    const url = String(input);
    requestedUrls.push(url);
    return jsonResponse(
      url.includes("pagina=2")
        ? deputyPayload(200)
        : deputyPayload(100, [{ rel: "next", href: nextUrl }]),
    );
  };
  const client = new CamaraClient({ fetchImplementation, baseUrl });

  const firstPage = await client.listDeputiesPage(1, 10);
  assert.equal(firstPage.payload.dados[0].id, 100);
  assert.equal(firstPage.nextUrl, nextUrl);

  const secondPage = await client.listDeputiesFromNextUrl(firstPage.nextUrl!);
  assert.equal(secondPage.payload.dados[0].id, 200);
  assert.equal(requestedUrls.length, 2);
  assert.equal(new URL(requestedUrls[0]).searchParams.get("itens"), "10");
});

test("Câmara client rejects invalid pagination and off-origin next links", async () => {
  let requests = 0;
  const fetchImplementation: FetchImplementation = async () => {
    requests += 1;
    return jsonResponse(
      deputyPayload(100, [{ rel: "next", href: "https://attacker.invalid/collect" }]),
    );
  };
  const client = new CamaraClient({ fetchImplementation, baseUrl });

  await assert.rejects(client.listDeputiesPage(1, 101), {
    code: "CAMARA_INVALID_PAGINATION",
  });
  assert.equal(requests, 0);

  await assert.rejects(client.listDeputiesPage(1, 10), {
    code: "CAMARA_INVALID_PAGINATION",
  });
});

test("Câmara client surfaces upstream HTTP, response-format, and timeout errors", async () => {
  const httpErrorClient = new CamaraClient({
    baseUrl,
    fetchImplementation: async () => jsonResponse({ error: "unavailable" }, 503),
  });
  await assert.rejects(httpErrorClient.listDeputiesPage(1), (error: unknown) => {
    assert.ok(error instanceof CamaraApiError);
    assert.equal(error.code, "CAMARA_HTTP_ERROR");
    assert.equal(error.statusCode, 503);
    return true;
  });

  const invalidResponseClient = new CamaraClient({
    baseUrl,
    fetchImplementation: async () => jsonResponse({ dados: [{ id: "fake" }] }),
  });
  await assert.rejects(invalidResponseClient.listDeputiesPage(1), {
    code: "CAMARA_INVALID_RESPONSE",
  });

  const timeoutClient = new CamaraClient({
    baseUrl,
    timeoutMs: 1,
    fetchImplementation: async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        if (signal?.aborted) {
          reject(new DOMException("Timed out", "TimeoutError"));
          return;
        }
        signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Timed out", "TimeoutError")),
          { once: true },
        );
      }),
  });
  await assert.rejects(timeoutClient.listDeputiesPage(1), {
    code: "CAMARA_TIMEOUT",
  });
});

test("representative synchronization follows source pagination and respects its page cap", async () => {
  const nextUrl =
    `${baseUrl}deputados?ordem=ASC&ordenarPor=nome&pagina=2&itens=10`;
  const fetchImplementation: FetchImplementation = async (input) =>
    jsonResponse(
      String(input).includes("pagina=2")
        ? deputyPayload(200)
        : deputyPayload(100, [{ rel: "next", href: nextUrl }]),
    );
  const savedPages: number[] = [];

  const result = await syncRepresentatives({
    maxPages: 1,
    pageSize: 10,
    client: new CamaraClient({ fetchImplementation, baseUrl }),
    savePage: async (page) => {
      savedPages.push(page.pageNumber);
    },
  });

  assert.deepEqual(savedPages, [1]);
  assert.deepEqual(result, {
    pagesRead: 1,
    representativesRead: 1,
    hasMore: true,
  });
});
