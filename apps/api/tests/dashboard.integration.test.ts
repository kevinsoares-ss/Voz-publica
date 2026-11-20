import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createApiServer } from "../src/app.js";
import { prisma } from "../src/database.js";
import { CguClient } from "../src/integrations/cgu/client.js";
import { parseOfficialAmount } from "../src/lib/money.js";

test("parseOfficialAmount accepts official decimal and Brazilian formats", () => {
  assert.equal(parseOfficialAmount("12.34"), 12.34);
  assert.equal(parseOfficialAmount("763.994.844,68"), 763994844.68);
  assert.equal(parseOfficialAmount("nao-numerico"), null);
});

test("dashboard summarizes agents, CEAPS ranking and CGU highlights with provenance", async () => {
  const suffix = randomUUID();
  const sourceId = randomUUID();
  const year = new Date().getFullYear();
  const senatorExternalId = `${Date.now()}`;
  const cguClient = new CguClient({
    apiKey: "test-secret",
    fetchImplementation: async (input) => {
      const url = new URL(String(input));
      const agencyCode = url.searchParams.get("orgao");
      return Response.json([
        {
          ano: year,
          orgao: `Órgão dashboard ${agencyCode}`,
          codigoOrgao: agencyCode,
          empenhado: agencyCode === "26000" ? "2000.00" : "1000.00",
          pago: agencyCode === "26000" ? "1800.00" : "900.00",
        },
      ]);
    },
  });
  const server = createApiServer({ cguClient });

  await prisma.source.create({
    data: {
      id: sourceId,
      type: "SENADO_API",
      name: `Dashboard fixture source ${suffix}`,
      url: "https://example.invalid/dashboard",
    },
  });
  const senator = await prisma.representative.create({
    data: {
      sourceNamespace: "senado",
      externalId: senatorExternalId,
      name: `Dashboard senator ${suffix}`,
      role: "SENATOR",
      sphere: "FEDERAL",
      powerBranch: "LEGISLATIVE",
      party: "TEST",
      state: "DF",
      lastSyncedAt: new Date(),
      sourceId,
    },
  });
  await prisma.expense.createMany({
    data: [
      {
        externalId: `dash-${suffix}-1`,
        representativeId: senator.id,
        year,
        month: 1,
        category: "Teste",
        value: "900000000.50",
        sourceId,
        lastSyncedAt: new Date(),
      },
      {
        externalId: `dash-${suffix}-2`,
        representativeId: senator.id,
        year,
        month: 2,
        category: "Teste",
        value: "100000000.25",
        sourceId,
        lastSyncedAt: new Date(),
      },
    ],
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/api/dashboard`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.agents.total >= 1);
    assert.ok(Array.isArray(body.agents.byRole));
    assert.equal(body.senateCeaps.year, year);
    assert.equal(body.senateCeaps.spenders[0].id, `senado:${senatorExternalId}`);
    assert.equal(body.senateCeaps.spenders[0].total, "1000000000.75");
    assert.equal(body.executive.agencies[0].code, "26000");
    assert.equal(body.executive.agencies[0].pago, "1800.00");
    assert.equal(body.executive.source.type, "CGU_API");
  } finally {
    await prisma.expense.deleteMany({
      where: { representativeId: senator.id },
    });
    await prisma.representative.deleteMany({ where: { id: senator.id } });
    await prisma.source.deleteMany({ where: { id: sourceId } });
    if (server.listening) {
      server.close();
      await once(server, "close");
    }
  }
});
