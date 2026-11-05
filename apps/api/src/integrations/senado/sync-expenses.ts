import { prisma } from "../../database.js";
import {
  senadoCeapsSourceId,
  SenadoExpensesClient,
  type SenadoExpensesResult,
} from "./expenses.js";

type SenateExpenseSaveResult = {
  syncedCount: number;
  unmatchedCount: number;
};

export async function syncSenateExpenses(
  year: number,
  options: {
    client?: SenadoExpensesClient;
    save?: (
      result: SenadoExpensesResult,
    ) => Promise<SenateExpenseSaveResult>;
  } = {},
): Promise<{
  year: number;
  fetchedCount: number;
  syncedCount: number;
  unmatchedCount: number;
  consultedAt: Date;
}> {
  const result = await (options.client ?? new SenadoExpensesClient())
    .listExpenses(year);
  const saved = await (options.save ?? saveExpenses)(result);
  return {
    year,
    fetchedCount: result.expenses.length,
    ...saved,
    consultedAt: result.consultedAt,
  };
}

async function saveExpenses(
  result: SenadoExpensesResult,
): Promise<SenateExpenseSaveResult> {
  const senators = await prisma.representative.findMany({
    where: { sourceNamespace: "senado" },
    select: { id: true, externalId: true },
  });
  if (senators.length === 0) {
    throw new Error(
      "No senators are synchronized; synchronize the Senate roster before CEAPS expenses.",
    );
  }
  const representativeIds = new Map(
    senators.map((senator) => [senator.externalId, senator.id]),
  );
  const sourceId = senadoCeapsSourceId(result.year);
  const expenses = result.expenses.flatMap((expense) => {
    const representativeId = representativeIds.get(expense.codSenador);
    return representativeId
      ? [{
          externalId: expense.id,
          representativeId,
          year: expense.ano,
          month: expense.mes,
          category: expense.tipoDespesa,
          supplier: expense.fornecedor,
          value: expense.valorReembolsado,
          sourceId,
          lastSyncedAt: result.consultedAt,
        }]
      : [];
  });

  await prisma.$transaction(async (transaction) => {
    await transaction.source.upsert({
      where: { id: sourceId },
      create: {
        id: sourceId,
        type: "SENADO_API",
        name: "Senado Federal — Despesas CEAPS",
        url: result.requestedUrl,
        consultedAt: result.consultedAt,
        metadata: {
          recordCount: expenses.length,
          year: result.year,
        },
      },
      update: {
        url: result.requestedUrl,
        consultedAt: result.consultedAt,
        metadata: {
          recordCount: expenses.length,
          year: result.year,
        },
      },
    });

    await transaction.expense.deleteMany({
      where: { sourceId, year: result.year },
    });
    for (let offset = 0; offset < expenses.length; offset += 500) {
      await transaction.expense.createMany({
        data: expenses.slice(offset, offset + 500),
      });
    }
  }, { timeout: 60_000 });

  return {
    syncedCount: expenses.length,
    unmatchedCount: result.expenses.length - expenses.length,
  };
}

async function main(): Promise<void> {
  const yearText = process.argv[2];
  if (!yearText || !/^\d{4}$/.test(yearText)) {
    throw new Error(
      "Provide one four-digit year, for example: npm run senado:sync:expenses -- 2025",
    );
  }

  const result = await syncSenateExpenses(Number(yearText));
  console.log(
    `Senado CEAPS sync complete for ${result.year}: ${result.syncedCount} expense(s) synced, ${result.unmatchedCount} unmatched, ${result.fetchedCount} fetched; consulted at ${result.consultedAt.toISOString()}.`,
  );
}

if (process.argv[1]?.endsWith("sync-expenses.ts") || process.argv[1]?.endsWith("sync-expenses.js")) {
  main()
    .catch((error: unknown) => {
      console.error("Senado CEAPS sync failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
        code:
          error instanceof Error && "code" in error
            ? String(error.code)
            : undefined,
      });
      process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
}
