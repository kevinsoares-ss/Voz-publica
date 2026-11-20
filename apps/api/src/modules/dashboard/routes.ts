import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../database.js";
import { sendJson } from "../../lib/http.js";
import { formatAmount, parseOfficialAmount } from "../../lib/money.js";
import { CguApiError, CguClient } from "../../integrations/cgu/client.js";
import { senadoCeapsSourceId } from "../../integrations/senado/expenses.js";
import type { ApiResponse } from "../../lib/http.js";

const currentYear = new Date().getFullYear();

export const DASHBOARD_CGU_AGENCIES = [
  { code: "26000", label: "Ministério da Educação" },
  { code: "52000", label: "Ministério da Defesa" },
  { code: "25000", label: "Ministério da Fazenda" },
  { code: "30000", label: "Ministério da Justiça e Segurança Pública" },
  { code: "33000", label: "Ministério da Previdência Social" },
] as const;

type SpenderRow = {
  sourceNamespace: string;
  externalId: string;
  name: string;
  party: string | null;
  state: string | null;
  photoUrl: string | null;
  total: Prisma.Decimal | string | number | null;
};

function publicId(sourceNamespace: string, externalId: string): string {
  return sourceNamespace === "camara"
    ? externalId
    : `${sourceNamespace}:${externalId}`;
}

function decimalToNumber(value: SpenderRow["total"]): number {
  if (value == null) return 0;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

async function loadAgentSummary() {
  const [total, byRole, byParty, lastSynced] = await Promise.all([
    prisma.representative.count(),
    prisma.representative.groupBy({
      by: ["role"],
      _count: { _all: true },
      orderBy: { role: "asc" },
    }),
    prisma.representative.groupBy({
      by: ["party"],
      where: { party: { not: null } },
      _count: { _all: true },
    }),
    prisma.representative.aggregate({
      _max: { lastSyncedAt: true },
    }),
  ]);

  const parties = byParty
    .filter((row): row is typeof row & { party: string } => Boolean(row.party))
    .sort((left, right) => right._count._all - left._count._all)
    .slice(0, 5)
    .map((row) => ({ party: row.party, count: row._count._all }));

  return {
    total,
    lastSyncedAt: lastSynced._max.lastSyncedAt?.toISOString() ?? null,
    byRole: byRole.map((row) => ({
      role: row.role,
      count: row._count._all,
    })),
    topParties: parties,
  };
}

async function loadSenateCeapsRanking() {
  const latestYearRows = await prisma.$queryRaw<Array<{ year: number | null }>>(
    Prisma.sql`
      SELECT MAX(e.year) AS year
      FROM "Expense" e
      INNER JOIN "Representative" r ON r.id = e."representativeId"
      WHERE r."sourceNamespace" = 'senado'
        AND e.year BETWEEN 2000 AND ${currentYear}
    `,
  );
  const year = latestYearRows[0]?.year ?? null;
  if (!year) {
    return {
      year: null,
      spenders: [],
      source: null,
    };
  }

  const spenders = await prisma.$queryRaw<SpenderRow[]>(
    Prisma.sql`
      SELECT
        r."sourceNamespace",
        r."externalId",
        r.name,
        r.party,
        r.state,
        r."photoUrl",
        SUM(
          CASE
            WHEN e.value ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN e.value::numeric
            ELSE 0
          END
        ) AS total
      FROM "Expense" e
      INNER JOIN "Representative" r ON r.id = e."representativeId"
      WHERE r."sourceNamespace" = 'senado'
        AND e.year = ${year}
      GROUP BY
        r."sourceNamespace",
        r."externalId",
        r.name,
        r.party,
        r.state,
        r."photoUrl"
      ORDER BY total DESC, r.name ASC
      LIMIT 5
    `,
  );

  const sourceId = senadoCeapsSourceId(year);
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    select: { name: true, url: true, consultedAt: true, type: true },
  });

  return {
    year,
    spenders: spenders.map((row) => ({
      id: publicId(row.sourceNamespace, row.externalId),
      name: row.name,
      party: row.party,
      state: row.state,
      photoUrl: row.photoUrl,
      total: formatAmount(decimalToNumber(row.total)),
    })),
    source: source
      ? {
          type: source.type,
          name: source.name,
          url: source.url,
          consultedAt: source.consultedAt.toISOString(),
        }
      : null,
  };
}

async function loadCguHighlights(client: CguClient) {
  const year = currentYear;
  const results = await Promise.all(
    DASHBOARD_CGU_AGENCIES.map(async (agency) => {
      try {
        const result = await client.listAnnualExpenses({
          year,
          page: 1,
          agencyCode: agency.code,
        });
        const first = result.data[0];
        const paid = parseOfficialAmount(first?.pago ?? null);
        const committed = parseOfficialAmount(first?.empenhado ?? null);
        const amount = paid ?? committed;
        return {
          code: first?.codigoOrgao ?? agency.code,
          name: first?.orgao ?? agency.label,
          year: first?.ano ?? year,
          empenhado: first?.empenhado ?? null,
          pago: first?.pago ?? null,
          sortValue: amount ?? -1,
          sourceUrl: result.requestedUrl,
          consultedAt: result.consultedAt.toISOString(),
        };
      } catch (error) {
        if (error instanceof CguApiError) {
          return {
            code: agency.code,
            error: error.code,
          };
        }
        throw error;
      }
    }),
  );

  const agencies = results
    .filter((item): item is Extract<typeof item, { sortValue: number }> =>
      "sortValue" in item && typeof item.sortValue === "number" && item.sortValue >= 0,
    )
    .sort((left, right) => right.sortValue - left.sortValue)
    .map(({ sortValue: _sortValue, ...agency }) => agency);

  const firstError = results.find((item) => "error" in item);
  const source = agencies[0]
    ? {
        type: "CGU_API" as const,
        name: "Portal da Transparência — Controladoria-Geral da União",
        url: agencies[0].sourceUrl,
        consultedAt: agencies[0].consultedAt,
      }
    : null;

  return {
    year,
    agencies: agencies.map(({ sourceUrl: _url, consultedAt: _consulted, ...agency }) => agency),
    source,
    unavailable:
      agencies.length === 0
        ? firstError && "error" in firstError
          ? firstError.error
          : "CGU_UNAVAILABLE"
        : null,
  };
}

export async function getDashboard(
  response: ApiResponse,
  cguClient: CguClient,
): Promise<void> {
  const [agents, senateCeaps, executive] = await Promise.all([
    loadAgentSummary(),
    loadSenateCeapsRanking(),
    loadCguHighlights(cguClient).catch((error: unknown) => {
      if (error instanceof CguApiError) {
        return {
          year: currentYear,
          agencies: [],
          source: null,
          unavailable: error.code,
        };
      }
      throw error;
    }),
  ]);

  sendJson(response, 200, {
    generatedAt: new Date().toISOString(),
    agents,
    senateCeaps,
    executive,
  });
}
