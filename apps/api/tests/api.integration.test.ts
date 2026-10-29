import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createApiServer } from "../src/app.js";
import { prisma } from "../src/database.js";

test("representative API validates requests and returns provenance-backed records", async () => {
  const suffix = randomUUID();
  const sourceId = randomUUID();
  const externalId = `test-${suffix}`;
  const senatorExternalId = `senado-${suffix}`;
  const name = `API test fixture ${suffix}`;
  const city = `Test city ${suffix}`;
  const server = createApiServer();

  await prisma.source.create({
    data: {
      id: sourceId,
      type: "CAMARA_API",
      name: `API test fixture source ${suffix}`,
      url: "https://example.invalid/test-fixture",
    },
  });

  try {
    await prisma.representative.create({
      data: {
        externalId,
        name,
        party: "TEST",
        state: "DF",
        city,
        role: "FEDERAL_DEPUTY",
        sphere: "FEDERAL",
        powerBranch: "LEGISLATIVE",
        lastSyncedAt: new Date(),
        sourceId,
      },
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const healthResponse = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthResponse.status, 200);
    assert.equal((await healthResponse.json()).database, "ok");

    const preflightResponse = await fetch(`${baseUrl}/api/health`, {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:8081",
        "access-control-request-method": "GET",
      },
    });
    assert.equal(preflightResponse.status, 204);
    assert.equal(
      preflightResponse.headers.get("access-control-allow-origin"),
      "http://localhost:8081",
    );

    const listResponse = await fetch(
      `${baseUrl}/api/representatives?q=${encodeURIComponent(name)}&state=df&limit=1`,
    );
    assert.equal(listResponse.status, 200);
    const listBody = await listResponse.json();
    assert.equal(listBody.pagination.total, 1);
    assert.equal(listBody.pagination.limit, 1);
    assert.equal(listBody.data[0].id, externalId);
    assert.equal(listBody.data[0].source.url, "https://example.invalid/test-fixture");

    const detailResponse = await fetch(
      `${baseUrl}/api/representatives/${externalId}`,
    );
    assert.equal(detailResponse.status, 200);
    assert.equal((await detailResponse.json()).data.name, name);

    const politicianResponse = await fetch(
      `${baseUrl}/api/politicians?search=${encodeURIComponent(name)}&role=FEDERAL_DEPUTY&sphere=FEDERAL&state=df&city=${encodeURIComponent(city)}`,
    );
    assert.equal(politicianResponse.status, 200);
    const politicianBody = await politicianResponse.json();
    assert.equal(politicianBody.pagination.total, 1);
    assert.equal(politicianBody.data[0].id, externalId);
    assert.equal(politicianBody.data[0].externalId, externalId);
    assert.equal(politicianBody.data[0].role, "FEDERAL_DEPUTY");
    assert.equal(politicianBody.data[0].sphere, "FEDERAL");
    assert.equal(politicianBody.data[0].source.url, "https://example.invalid/test-fixture");

    const politicianDetailResponse = await fetch(
      `${baseUrl}/api/politicians/${externalId}`,
    );
    assert.equal(politicianDetailResponse.status, 200);
    assert.equal((await politicianDetailResponse.json()).data.city, city);

    const invalidPoliticianFilter = await fetch(
      `${baseUrl}/api/politicians?role=UNKNOWN_ROLE`,
    );
    assert.equal(invalidPoliticianFilter.status, 400);
    assert.equal(
      (await invalidPoliticianFilter.json()).error.code,
      "VALIDATION_ERROR",
    );

    await prisma.representative.create({
      data: {
        sourceNamespace: "senado",
        externalId: senatorExternalId,
        name: `Senate API fixture ${suffix}`,
        role: "SENATOR",
        sphere: "FEDERAL",
        powerBranch: "LEGISLATIVE",
        lastSyncedAt: new Date(),
        sourceId,
      },
    });
    const senatorListResponse = await fetch(
      `${baseUrl}/api/politicians?role=SENATOR&search=${encodeURIComponent(`Senate API fixture ${suffix}`)}`,
    );
    assert.equal(senatorListResponse.status, 200);
    const senatorListBody = await senatorListResponse.json();
    assert.equal(senatorListBody.data[0].id, `senado:${senatorExternalId}`);
    const senatorDetailResponse = await fetch(
      `${baseUrl}/api/politicians/${encodeURIComponent(`senado:${senatorExternalId}`)}`,
    );
    assert.equal(senatorDetailResponse.status, 200);
    assert.equal(
      (await senatorDetailResponse.json()).data.role,
      "SENATOR",
    );

    const invalidQueryResponse = await fetch(
      `${baseUrl}/api/representatives?limit=101`,
    );
    assert.equal(invalidQueryResponse.status, 400);
    assert.equal((await invalidQueryResponse.json()).error.code, "VALIDATION_ERROR");

    const invalidIdResponse = await fetch(`${baseUrl}/api/representatives/%20`);
    assert.equal(invalidIdResponse.status, 400);

    const missingResponse = await fetch(
      `${baseUrl}/api/representatives/missing-${suffix}`,
    );
    assert.equal(missingResponse.status, 404);
    assert.equal((await missingResponse.json()).error.code, "NOT_FOUND");

    const wrongMethodResponse = await fetch(`${baseUrl}/api/health`, {
      method: "POST",
    });
    assert.equal(wrongMethodResponse.status, 405);

    const missingRouteResponse = await fetch(`${baseUrl}/api/not-implemented`);
    assert.equal(missingRouteResponse.status, 404);

    const invalidProposalQuery = await fetch(
      `${baseUrl}/api/proposals?year=1800`,
    );
    assert.equal(invalidProposalQuery.status, 400);
    assert.equal(
      (await invalidProposalQuery.json()).error.code,
      "VALIDATION_ERROR",
    );

    const invalidExpenseId = await fetch(
      `${baseUrl}/api/representatives/not-numeric/expenses?year=2025`,
    );
    assert.equal(invalidExpenseId.status, 400);

    const invalidIndividualVoteId = await fetch(
      `${baseUrl}/api/votes/%20/votes`,
    );
    assert.equal(invalidIndividualVoteId.status, 400);
  } finally {
    await prisma.representative.deleteMany({ where: { externalId } });
    await prisma.representative.deleteMany({
      where: { sourceNamespace: "senado", externalId: senatorExternalId },
    });
    await prisma.source.deleteMany({ where: { id: sourceId } });
    if (server.listening) {
      server.close();
      await once(server, "close");
    }
  }
});
