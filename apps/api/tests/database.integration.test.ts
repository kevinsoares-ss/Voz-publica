import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import { prisma } from "../src/database.js";

test("PostgreSQL persists exact decimal text and enforces unique and foreign keys", async () => {
  const suffix = randomUUID();
  const sourceId = randomUUID();
  const representativeId = randomUUID();

  await prisma.source.create({
    data: {
      id: sourceId,
      type: "CAMARA_API",
      name: `Database test fixture ${suffix}`,
      url: "https://example.invalid/test-fixture",
    },
  });

  try {
    await prisma.representative.create({
      data: {
        id: representativeId,
        externalId: suffix,
        name: `Database test fixture ${suffix}`,
        lastSyncedAt: new Date(),
        sourceId,
      },
    });

    await prisma.expense.create({
      data: {
        externalId: suffix,
        representativeId,
        sourceId,
        value: "1234567890.12",
        lastSyncedAt: new Date(),
      },
    });

    const storedExpense = await prisma.expense.findFirstOrThrow({
      where: { externalId: suffix },
    });
    assert.equal(storedExpense.value, "1234567890.12");

    await assert.rejects(
      prisma.representative.create({
        data: {
          externalId: suffix,
          name: `Duplicate test fixture ${suffix}`,
          lastSyncedAt: new Date(),
          sourceId,
        },
      }),
    );

    await assert.rejects(prisma.source.delete({ where: { id: sourceId } }));
  } finally {
    await prisma.expense.deleteMany({ where: { representativeId } });
    await prisma.representative.deleteMany({ where: { id: representativeId } });
    await prisma.source.deleteMany({ where: { id: sourceId } });
  }
});

after(async () => {
  await prisma.$disconnect();
});
