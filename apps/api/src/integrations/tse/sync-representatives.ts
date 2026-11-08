import { z } from "zod";
import { prisma } from "../../database.js";
import { TseClient, type TseElectedRepresentative } from "./client.js";

const syncOptionsSchema = z.object({
  years: z.array(z.union([z.literal(2022), z.literal(2024)])).min(1).max(2),
});
const sourceIds: Record<number, string> = {
  2022: "tse-election-2022",
  2024: "tse-election-2024",
};
const sourceNames: Record<number, string> = {
  2022: "TSE — Eleições gerais 2022 (candidaturas com resultado eleito)",
  2024: "TSE — Eleições municipais 2024 (candidaturas com resultado eleito)",
};

export async function syncElectedRepresentatives(options: {
  years: number[];
  client?: TseClient;
  save?: (year: number, result: {
    data: TseElectedRepresentative[];
    requestedUrl: string;
    consultedAt: Date;
  }) => Promise<number>;
}): Promise<Array<{ year: number; candidatesRead: number; recordsCreated: number }>> {
  const parsed = syncOptionsSchema.safeParse(options);
  if (!parsed.success) {
    throw new Error("TSE synchronization supports election years 2022 and 2024.");
  }

  const client = options.client ?? new TseClient();
  const results: Array<{
    year: number;
    candidatesRead: number;
    recordsCreated: number;
  }> = [];
  for (const year of [...new Set(parsed.data.years)]) {
    const result = await client.listElectedRepresentatives(year);
    const recordsCreated = await (options.save ?? saveElectedCandidates)(year, result);
    results.push({
      year,
      candidatesRead: result.data.length,
      recordsCreated,
    });
  }
  return results;
}

async function saveElectedCandidates(
  year: number,
  result: {
    data: TseElectedRepresentative[];
    requestedUrl: string;
    consultedAt: Date;
  },
): Promise<number> {
  let created = 0;
  await prisma.$transaction(async (transaction) => {
    await transaction.source.upsert({
      where: { id: sourceIds[year] },
      create: {
        id: sourceIds[year],
        type: "TSE_API",
        name: sourceNames[year],
        url: result.requestedUrl,
        consultedAt: result.consultedAt,
        metadata: { electionYear: year, itemCount: result.data.length },
      },
      update: {
        name: sourceNames[year],
        url: result.requestedUrl,
        consultedAt: result.consultedAt,
        metadata: { electionYear: year, itemCount: result.data.length },
      },
    });

    const batchSize = 1_000;
    for (let offset = 0; offset < result.data.length; offset += batchSize) {
      const batch = result.data.slice(offset, offset + batchSize);
      const inserted = await transaction.representative.createMany({
        data: batch.map((candidate) => ({
          sourceNamespace: "tse",
          externalId: candidate.externalId,
          name: candidate.name,
          civilName: candidate.civilName,
          role: candidate.role,
          sphere: candidate.sphere,
          powerBranch: candidate.powerBranch,
          party: candidate.party,
          state: candidate.state,
          city: candidate.city,
          sourceUrl: result.requestedUrl,
          lastSyncedAt: result.consultedAt,
          sourceId: sourceIds[year],
        })),
        skipDuplicates: true,
      });
      created += inserted.count;
    }
  }, { timeout: 120_000 });
  return created;
}

async function main(): Promise<void> {
  const yearsArg = process.argv.find((argument) => argument.startsWith("--years="));
  const years = yearsArg
    ? yearsArg.slice("--years=".length).split(",").map(Number)
    : [2022, 2024];
  const result = await syncElectedRepresentatives({ years });
  for (const item of result) {
    console.log(
      `TSE ${item.year} sync complete: ${item.recordsCreated} new elected candidate(s) from ${item.candidatesRead} record(s).`,
    );
  }
}

if (
  process.argv[1]?.endsWith("sync-representatives.ts") ||
  process.argv[1]?.endsWith("sync-representatives.js")
) {
  main()
    .catch((error: unknown) => {
      console.error("TSE sync failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : "Unexpected error.",
      });
      process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
}
