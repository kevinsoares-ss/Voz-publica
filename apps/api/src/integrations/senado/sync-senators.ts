import { prisma } from "../../database.js";
import { SenadoClient, type SenadoListResult } from "./client.js";

export async function syncCurrentSenators(options: {
  client?: SenadoClient;
  save?: (result: SenadoListResult) => Promise<void>;
} = {}): Promise<{ senatorsSynced: number; consultedAt: Date }> {
  const result = await (options.client ?? new SenadoClient()).listCurrentSenators();
  await (options.save ?? saveSenators)(result);
  return {
    senatorsSynced: result.senators.length,
    consultedAt: result.consultedAt,
  };
}

async function saveSenators(result: SenadoListResult): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const source = await transaction.source.create({
      data: {
        type: "SENADO_API",
        name: "Senado Federal — Dados Abertos",
        url: result.requestedUrl,
        consultedAt: result.consultedAt,
        metadata: { itemCount: result.senators.length },
      },
    });

    for (const senator of result.senators) {
      await transaction.representative.upsert({
        where: {
          sourceNamespace_externalId: {
            sourceNamespace: "senado",
            externalId: senator.id,
          },
        },
        create: {
          sourceNamespace: "senado",
          externalId: senator.id,
          name: senator.name,
          civilName: senator.civilName,
          role: "SENATOR",
          sphere: "FEDERAL",
          powerBranch: "LEGISLATIVE",
          party: senator.party,
          state: senator.state,
          photoUrl: senator.photoUrl,
          sourceUrl: senator.sourceUrl,
          lastSyncedAt: result.consultedAt,
          sourceId: source.id,
        },
        update: {
          name: senator.name,
          civilName: senator.civilName,
          role: "SENATOR",
          sphere: "FEDERAL",
          powerBranch: "LEGISLATIVE",
          party: senator.party,
          state: senator.state,
          photoUrl: senator.photoUrl,
          sourceUrl: senator.sourceUrl,
          lastSyncedAt: result.consultedAt,
          sourceId: source.id,
        },
      });
    }
  });
}

async function main(): Promise<void> {
  const result = await syncCurrentSenators();
  console.log(
    `Senado sync complete: ${result.senatorsSynced} senator(s), consulted at ${result.consultedAt.toISOString()}.`,
  );
}

if (process.argv[1]?.endsWith("sync-senators.ts") || process.argv[1]?.endsWith("sync-senators.js")) {
  main()
    .catch((error: unknown) => {
      console.error("Senado sync failed", {
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
