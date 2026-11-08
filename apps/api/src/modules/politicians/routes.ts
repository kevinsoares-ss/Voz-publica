import type { ApiResponse } from "../../lib/http.js";
import { z } from "zod";
import { prisma } from "../../database.js";
import { sendError, sendJson } from "../../lib/http.js";

const roleSchema = z.enum([
  "PRESIDENT",
  "GOVERNOR",
  "MAYOR",
  "SENATOR",
  "FEDERAL_DEPUTY",
  "STATE_DEPUTY",
  "CITY_COUNCILLOR",
]);
const sphereSchema = z.enum(["FEDERAL", "STATE", "MUNICIPAL"]);
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(100).optional(),
  role: roleSchema.optional(),
  sphere: sphereSchema.optional(),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  party: z.string().trim().min(1).max(30).transform((value) => value.toUpperCase()).optional(),
});
const politicianIdSchema = z
  .string()
  .regex(/^(?:[a-z0-9_-]{1,30}:)?[A-Za-z0-9_-]{1,50}$/);

function parsePoliticianId(
  id: string,
): { sourceNamespace: string; externalId: string } | null {
  const parsed = politicianIdSchema.safeParse(id);
  if (!parsed.success) return null;
  const [sourceNamespace, externalId] = parsed.data.includes(":")
    ? parsed.data.split(":", 2)
    : ["camara", parsed.data];
  return { sourceNamespace, externalId };
}

function publicId(sourceNamespace: string, externalId: string): string {
  return sourceNamespace === "camara"
    ? externalId
    : `${sourceNamespace}:${externalId}`;
}

function photoUrl(
  sourceNamespace: string,
  externalId: string,
  state: string | null,
  existingUrl: string | null,
): string | null {
  if (existingUrl || sourceNamespace !== "tse") return existingUrl;
  const match = externalId.match(/^(2022|2024)-(\d{1,20})$/);
  if (!match) return null;
  const photoState = state ?? (match[1] === "2022" ? "BR" : null);
  return photoState
    ? `/api/tse/photos/${match[1]}/${photoState}/${match[2]}`
    : null;
}

export async function listPoliticians(
  url: URL,
  response: ApiResponse,
): Promise<void> {
  const parsed = listQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    role: url.searchParams.get("role") ?? undefined,
    sphere: url.searchParams.get("sphere") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
    city: url.searchParams.get("city") ?? undefined,
    party: url.searchParams.get("party") ?? undefined,
  });

  if (!parsed.success) {
    sendError(
      response,
      400,
      "VALIDATION_ERROR",
      "One or more query parameters are invalid.",
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
    return;
  }

  const { page, limit, search, role, sphere, state, city, party } = parsed.data;
  const where = {
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(role ? { role } : {}),
    ...(sphere ? { sphere } : {}),
    ...(state ? { state } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
    ...(party ? { party } : {}),
  };
  const [total, politicians] = await prisma.$transaction([
    prisma.representative.count({ where }),
    prisma.representative.findMany({
      where,
      orderBy: [{ name: "asc" }, { sourceNamespace: "asc" }, { externalId: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        sourceNamespace: true,
        externalId: true,
        name: true,
        civilName: true,
        role: true,
        sphere: true,
        powerBranch: true,
        party: true,
        state: true,
        city: true,
        photoUrl: true,
        sourceUrl: true,
        lastSyncedAt: true,
        source: {
          select: { type: true, name: true, url: true, consultedAt: true },
        },
      },
    }),
  ]);

  sendJson(response, 200, {
    data: politicians.map((politician) => ({
      ...politician,
      photoUrl: photoUrl(
        politician.sourceNamespace,
        politician.externalId,
        politician.state,
        politician.photoUrl,
      ),
      id: publicId(politician.sourceNamespace, politician.externalId),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function getPolitician(
  id: string,
  response: ApiResponse,
): Promise<void> {
  const parsedId = parsePoliticianId(id);
  if (!parsedId) {
    sendError(response, 400, "VALIDATION_ERROR", "Politician ID is invalid.");
    return;
  }

  const politician = await prisma.representative.findUnique({
    where: { sourceNamespace_externalId: parsedId },
    select: {
      sourceNamespace: true,
      externalId: true,
      name: true,
      civilName: true,
      role: true,
      sphere: true,
      powerBranch: true,
      party: true,
      state: true,
      city: true,
      photoUrl: true,
      sourceUrl: true,
      lastSyncedAt: true,
      source: {
        select: { type: true, name: true, url: true, consultedAt: true },
      },
    },
  });

  if (!politician) {
    sendError(response, 404, "NOT_FOUND", "Politician was not found.");
    return;
  }

  sendJson(response, 200, {
    data: {
      ...politician,
      photoUrl: photoUrl(
        politician.sourceNamespace,
        politician.externalId,
        politician.state,
        politician.photoUrl,
      ),
      id: publicId(politician.sourceNamespace, politician.externalId),
    },
  });
}
