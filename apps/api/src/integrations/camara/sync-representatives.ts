import { z } from "zod";
import { prisma } from "../../database.js";
import {
  CamaraClient,
  type DeputyListPageResult,
} from "./client.js";
import type { CamaraDeputy } from "./schemas.js";

const syncOptionsSchema = z.object({
  maxPages: z.number().int().min(1).max(52),
  pageSize: z.number().int().min(1).max(100).default(100),
});

export type DeputyPage = {
  deputies: CamaraDeputy[];
  requestedUrl: string;
  pageNumber: number;
  consultedAt: Date;
};

export async function syncRepresentatives(options: {
  maxPages: number;
  pageSize?: number;
  client?: CamaraClient;
  savePage: (page: DeputyPage) => Promise<void>;
}): Promise<{ pagesRead: number; representativesRead: number; hasMore: boolean }> {
  const parsed = syncOptionsSchema.safeParse(options);
  if (!parsed.success) {
    throw new Error("Sync requires maxPages from 1 to 52 and pageSize from 1 to 100.");
  }

  const client = options.client ?? new CamaraClient();
  let nextUrl: string | null = null;
  let representativesRead = 0;
  let pagesRead = 0;

  while (pagesRead < parsed.data.maxPages) {
    const pageNumber = pagesRead + 1;
    const result: DeputyListPageResult = nextUrl
      ? await client.listDeputiesFromNextUrl(nextUrl)
      : await client.listDeputiesPage(pageNumber, parsed.data.pageSize);

    const consultedAt = new Date();
    await options.savePage({
      deputies: result.payload.dados,
      requestedUrl: result.requestedUrl,
      pageNumber,
      consultedAt,
    });

    representativesRead += result.payload.dados.length;
    pagesRead += 1;
    nextUrl = result.nextUrl;
    if (!nextUrl) break;
  }

  return {
    pagesRead,
    representativesRead,
    hasMore: nextUrl !== null,
  };
}

async function saveDeputyPage(page: DeputyPage): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const source = await transaction.source.create({
      data: {
        type: "CAMARA_API",
        name: "Câmara dos Deputados — Dados Abertos",
        url: page.requestedUrl,
        consultedAt: page.consultedAt,
        metadata: { page: page.pageNumber, itemCount: page.deputies.length },
      },
    });

    for (const deputy of page.deputies) {
      await transaction.representative.upsert({
        where: {
          sourceNamespace_externalId: {
            sourceNamespace: "camara",
            externalId: String(deputy.id),
          },
        },
        create: {
          sourceNamespace: "camara",
          externalId: String(deputy.id),
          name: deputy.nome,
          role: "FEDERAL_DEPUTY",
          sphere: "FEDERAL",
          powerBranch: "LEGISLATIVE",
          party: deputy.siglaPartido ?? null,
          state: deputy.siglaUf ?? null,
          photoUrl: deputy.urlFoto ?? null,
          sourceUrl: `https://dadosabertos.camara.leg.br/api/v2/deputados/${deputy.id}`,
          lastSyncedAt: page.consultedAt,
          sourceId: source.id,
        },
        update: {
          name: deputy.nome,
          role: "FEDERAL_DEPUTY",
          sphere: "FEDERAL",
          powerBranch: "LEGISLATIVE",
          party: deputy.siglaPartido ?? null,
          state: deputy.siglaUf ?? null,
          photoUrl: deputy.urlFoto ?? null,
          sourceUrl: `https://dadosabertos.camara.leg.br/api/v2/deputados/${deputy.id}`,
          lastSyncedAt: page.consultedAt,
          sourceId: source.id,
        },
      });
    }
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const maxPagesArg = args.find((argument) => argument.startsWith("--max-pages="));
  if (!maxPagesArg) {
    throw new Error("Specify a bounded page count, e.g. --max-pages=1 (maximum 52).");
  }
  const maxPages = Number(maxPagesArg.split("=")[1]);
  const result = await syncRepresentatives({ maxPages, savePage: saveDeputyPage });
  console.log(
    `Câmara sync complete: ${result.pagesRead} page(s), ${result.representativesRead} representative(s), more pages: ${result.hasMore}.`,
  );
}

if (process.argv[1]?.endsWith("sync-representatives.ts") || process.argv[1]?.endsWith("sync-representatives.js")) {
  main()
    .catch((error: unknown) => {
      console.error("Câmara representative sync failed", {
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
