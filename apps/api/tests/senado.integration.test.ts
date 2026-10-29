import assert from "node:assert/strict";
import test from "node:test";
import {
  SenadoApiError,
  SenadoClient,
} from "../src/integrations/senado/client.js";
import { syncCurrentSenators } from "../src/integrations/senado/sync-senators.js";

const senateListXml = `<?xml version="1.0" encoding="UTF-8"?>
<ListaParlamentarEmExercicio>
  <Metadados><Versao>2026-10-28</Versao></Metadados>
  <Parlamentares>
    <Parlamentar>
      <IdentificacaoParlamentar>
        <CodigoParlamentar>5672</CodigoParlamentar>
        <NomeParlamentar>Senadora de Teste</NomeParlamentar>
        <NomeCompletoParlamentar>Nome Civil de Teste</NomeCompletoParlamentar>
        <SiglaPartidoParlamentar>TESTE</SiglaPartidoParlamentar>
        <UfParlamentar>DF</UfParlamentar>
        <UrlFotoParlamentar>https://example.invalid/photo.jpg</UrlFotoParlamentar>
        <UrlPaginaParlamentar>https://example.invalid/senator</UrlPaginaParlamentar>
      </IdentificacaoParlamentar>
    </Parlamentar>
  </Parlamentares>
</ListaParlamentarEmExercicio>`;

test("Senado client validates and maps current parliamentarian records", async () => {
  const client = new SenadoClient({
    fetchImplementation: async () => new Response(senateListXml),
  });
  const result = await client.listCurrentSenators();

  assert.equal(result.senators.length, 1);
  assert.deepEqual(result.senators[0], {
    id: "5672",
    name: "Senadora de Teste",
    civilName: "Nome Civil de Teste",
    party: "TESTE",
    state: "DF",
    photoUrl: "https://example.invalid/photo.jpg",
    sourceUrl: "https://example.invalid/senator",
  });
  assert.equal(result.requestedUrl, "https://legis.senado.leg.br/dadosabertos/senador/lista/atual");
});

test("Senado client surfaces HTTP and invalid XML/shape errors", async () => {
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

  const invalidXmlClient = new SenadoClient({
    fetchImplementation: async () => new Response("<broken>"),
  });
  await assert.rejects(
    invalidXmlClient.listCurrentSenators(),
    (error: unknown) =>
      error instanceof SenadoApiError &&
      error.code === "SENADO_INVALID_RESPONSE",
  );

  const invalidShapeClient = new SenadoClient({
    fetchImplementation: async () =>
      new Response("<Resposta><Dados>sem parlamentares</Dados></Resposta>"),
  });
  await assert.rejects(
    invalidShapeClient.listCurrentSenators(),
    (error: unknown) =>
      error instanceof SenadoApiError &&
      error.code === "SENADO_INVALID_RESPONSE",
  );
});

test("Senado sync persists only the real list returned by its client", async () => {
  let savedCount = 0;
  const result = await syncCurrentSenators({
    client: new SenadoClient({
      fetchImplementation: async () => new Response(senateListXml),
    }),
    save: async (payload) => {
      savedCount = payload.senators.length;
    },
  });

  assert.equal(savedCount, 1);
  assert.equal(result.senatorsSynced, 1);
});
