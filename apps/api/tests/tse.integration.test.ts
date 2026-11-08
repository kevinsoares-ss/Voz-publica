import assert from "node:assert/strict";
import test from "node:test";
import { parseElectedCandidate, TseClient } from "../src/integrations/tse/client.js";

test("TSE records map elected local executive candidates to municipal officials", () => {
  const candidate = parseElectedCandidate({
    NM_TIPO_ELEICAO: "ELEIÇÃO ORDINÁRIA",
    DS_SIT_TOT_TURNO: "ELEITO",
    DS_CARGO: "PREFEITO",
    SQ_CANDIDATO: "123456789",
    NM_URNA_CANDIDATO: "NOME DE URNA",
    NM_CANDIDATO: "Nome civil",
    SG_PARTIDO: "ABC",
    SG_UF: "SP",
    NM_UE: "CIDADE DE TESTE",
  }, 2024);

  assert.deepEqual(candidate, {
    electionYear: 2024,
    externalId: "2024-123456789",
    name: "NOME DE URNA",
    civilName: "Nome civil",
    role: "MAYOR",
    sphere: "MUNICIPAL",
    powerBranch: "EXECUTIVE",
    party: "ABC",
    state: "SP",
    city: "CIDADE DE TESTE",
  });
});

test("TSE records include elected councilors and state executives/legislators", () => {
  const councilor = parseElectedCandidate({
    NM_TIPO_ELEICAO: "ELEIÇÃO ORDINÁRIA",
    DS_SIT_TOT_TURNO: "ELEITO POR QP",
    DS_CARGO: "VEREADOR",
    SQ_CANDIDATO: "456",
    NM_URNA_CANDIDATO: "Vereador",
    SG_UF: "RJ",
    NM_UE: "MUNICÍPIO",
  }, 2024);
  const governor = parseElectedCandidate({
    NM_TIPO_ELEICAO: "ELEICAO ORDINARIA",
    DS_SIT_TOT_TURNO: "ELEITO",
    DS_CARGO: "GOVERNADOR",
    SQ_CANDIDATO: "789",
    NM_URNA_CANDIDATO: "Governador",
    SG_UF: "MG",
  }, 2022);
  const stateDeputy = parseElectedCandidate({
    NM_TIPO_ELEICAO: "ELEICAO ORDINARIA",
    DS_SIT_TOT_TURNO: "ELEITO POR MÉDIA",
    DS_CARGO: "DEPUTADO ESTADUAL",
    SQ_CANDIDATO: "987",
    NM_URNA_CANDIDATO: "Deputado",
    SG_UF: "BA",
  }, 2022);

  assert.equal(councilor?.role, "CITY_COUNCILLOR");
  assert.equal(councilor?.city, "MUNICÍPIO");
  assert.equal(governor?.role, "GOVERNOR");
  assert.equal(governor?.sphere, "STATE");
  assert.equal(stateDeputy?.role, "STATE_DEPUTY");
  assert.equal(stateDeputy?.powerBranch, "LEGISLATIVE");
});

test("TSE records exclude unelected candidates, supplementary elections, and unrequested offices", () => {
  const base = {
    NM_TIPO_ELEICAO: "ELEIÇÃO ORDINÁRIA",
    DS_SIT_TOT_TURNO: "NÃO ELEITO",
    DS_CARGO: "VEREADOR",
    SQ_CANDIDATO: "123",
    NM_URNA_CANDIDATO: "Candidato",
  };
  assert.equal(parseElectedCandidate(base, 2024), null);
  assert.equal(
    parseElectedCandidate({
      ...base,
      NM_TIPO_ELEICAO: "ELEIÇÃO SUPLEMENTAR",
      DS_SIT_TOT_TURNO: "ELEITO",
    }, 2024),
    null,
  );
  assert.equal(
    parseElectedCandidate({
      ...base,
      DS_SIT_TOT_TURNO: "ELEITO",
      DS_CARGO: "SENADOR",
    }, 2024),
    null,
  );
});

test("TSE client rejects unsupported years and reports upstream failures", async () => {
  const client = new TseClient({
    fetchImplementation: async () => new Response("", { status: 503 }),
  });
  await assert.rejects(client.listElectedRepresentatives(2020), /not configured/);
  await assert.rejects(client.listElectedRepresentatives(2024), /HTTP 503/);
});
