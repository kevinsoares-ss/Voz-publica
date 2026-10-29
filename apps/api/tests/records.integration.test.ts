import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createApiServer } from "../src/app.js";
import { prisma } from "../src/database.js";

test("commitments, evidence, and government actions expose source-backed records", async () => {
  const suffix = randomUUID();
  const sourceId = randomUUID();
  const representativeId = randomUUID();
  const externalId = `records-${suffix}`;
  const commitmentId = randomUUID();
  const evidenceId = randomUUID();
  const historyId = randomUUID();
  const server = createApiServer();

  await prisma.source.create({
    data: {
      id: sourceId,
      type: "OFFICIAL_DOCUMENT",
      name: `Records test source ${suffix}`,
      url: "https://example.invalid/records",
    },
  });

  try {
    await prisma.representative.create({
      data: {
        id: representativeId,
        externalId,
        name: `Records test representative ${suffix}`,
        role: "FEDERAL_DEPUTY",
        sphere: "FEDERAL",
        powerBranch: "LEGISLATIVE",
        lastSyncedAt: new Date(),
        sourceId,
      },
    });
    await prisma.commitment.create({
      data: {
        id: commitmentId,
        title: `Documented commitment ${suffix}`,
        description: "Test-only commitment with traceable source.",
        representativeId,
        status: "EM_ANDAMENTO",
        evaluationMethod: "Compare source documents and linked evidence.",
        sourceId,
      },
    });
    await prisma.evidence.create({
      data: {
        id: evidenceId,
        commitmentId,
        description: "Official evidence document.",
        sourceId,
      },
    });
    await prisma.commitmentHistory.create({
      data: {
        id: historyId,
        commitmentId,
        previousStatus: "A_VERIFICAR",
        newStatus: "EM_ANDAMENTO",
        rationale: "Evidence confirms documented progress.",
        evidences: {
          create: { evidenceId },
        },
      },
    });
    await prisma.governmentAction.create({
      data: {
        representativeId,
        title: `Documented action ${suffix}`,
        description: "A source-backed official record.",
        type: "NEUTRAL_METRIC",
        category: "Public data",
        evidenceUrl: "https://example.invalid/evidence",
        sourceName: "Official document",
        eventDate: new Date("2026-01-15T00:00:00.000Z"),
        sourceId,
      },
    });

    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const commitmentsResponse = await fetch(
      `${baseUrl}/api/politicians/${externalId}/commitments?status=EM_ANDAMENTO`,
    );
    assert.equal(commitmentsResponse.status, 200);
    const commitmentsBody = await commitmentsResponse.json();
    assert.equal(commitmentsBody.pagination.total, 1);
    assert.equal(commitmentsBody.data[0].id, commitmentId);
    assert.equal(commitmentsBody.data[0].evidenceCount, 1);
    assert.equal(commitmentsBody.data[0].history[0].newStatus, "EM_ANDAMENTO");
    assert.equal(
      commitmentsBody.data[0].source.url,
      "https://example.invalid/records",
    );

    const actionsResponse = await fetch(
      `${baseUrl}/api/politicians/${externalId}/actions`,
    );
    assert.equal(actionsResponse.status, 200);
    const actionsBody = await actionsResponse.json();
    assert.equal(actionsBody.pagination.total, 1);
    assert.equal(actionsBody.data[0].evidenceUrl, "https://example.invalid/evidence");
    assert.equal(actionsBody.data[0].source.url, "https://example.invalid/records");

    const evidenceResponse = await fetch(
      `${baseUrl}/api/commitments/${commitmentId}/evidences`,
    );
    assert.equal(evidenceResponse.status, 200);
    const evidenceBody = await evidenceResponse.json();
    assert.equal(evidenceBody.data[0].id, evidenceId);
    assert.equal(evidenceBody.data[0].source.url, "https://example.invalid/records");

    const invalidStatusResponse = await fetch(
      `${baseUrl}/api/commitments?status=UNKNOWN`,
    );
    assert.equal(invalidStatusResponse.status, 400);

    const missingPoliticianResponse = await fetch(
      `${baseUrl}/api/politicians/missing-${suffix}/commitments`,
    );
    assert.equal(missingPoliticianResponse.status, 404);
  } finally {
    await prisma.commitmentHistoryEvidence.deleteMany({
      where: { historyId },
    });
    await prisma.commitmentHistory.deleteMany({ where: { id: historyId } });
    await prisma.evidence.deleteMany({ where: { id: evidenceId } });
    await prisma.governmentAction.deleteMany({
      where: { representativeId },
    });
    await prisma.commitment.deleteMany({ where: { id: commitmentId } });
    await prisma.representative.deleteMany({ where: { id: representativeId } });
    await prisma.source.deleteMany({ where: { id: sourceId } });
    if (server.listening) {
      server.close();
      await once(server, "close");
    }
  }
});
