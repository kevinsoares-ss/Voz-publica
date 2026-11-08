import { createServer, type IncomingMessage } from "node:http";
import { prisma } from "./database.js";
import { sendError, sendJson } from "./lib/http.js";
import {
  getRepresentative,
  listRepresentatives,
} from "./modules/representatives/routes.js";
import {
  getPolitician,
  listPoliticians,
} from "./modules/politicians/routes.js";
import {
  individualVotes,
  listProposals,
  proposalDetail,
  proposalEvents,
  representativeExpenses,
} from "./modules/official/routes.js";
import {
  listCommitmentEvidences,
  listCommitments,
  listGovernmentActions,
} from "./modules/records/routes.js";
import { CguClient } from "./integrations/cgu/client.js";
import type { ApiRequest, ApiResponse } from "./lib/http.js";
import {
  listCguAgencies,
  listCguExpenses,
} from "./integrations/cgu/routes.js";
import { getTseCandidatePhoto, TsePhotoError } from "./integrations/tse/photos.js";

const MAX_URL_LENGTH = 8_192;
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ??
    "http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

async function handleRequest(
  request: ApiRequest,
  response: ApiResponse,
  cguClient: CguClient,
): Promise<void> {
  const originHeader = request.headers.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("access-control-allow-methods", "GET, OPTIONS");
    response.setHeader("access-control-allow-headers", "Accept");
    response.setHeader("access-control-max-age", "600");
    response.setHeader("vary", "Origin");
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (!request.url || request.url.length > MAX_URL_LENGTH) {
    sendError(response, 414, "URI_TOO_LONG", "Request URL is too long.");
    return;
  }

  let url: URL;
  try {
    url = new URL(request.url, "http://localhost");
  } catch {
    sendError(response, 400, "BAD_REQUEST", "Request URL is invalid.");
    return;
  }

  if (request.method !== "GET") {
    response.setHeader("allow", "GET");
    sendError(response, 405, "METHOD_NOT_ALLOWED", "Only GET is supported.");
    return;
  }

  if (url.pathname === "/api/health") {
    try {
      await prisma.$queryRaw`SELECT 1`;
      sendJson(response, 200, {
        status: "ok",
        database: "ok",
        checkedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("API health check failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      sendError(response, 503, "SERVICE_UNAVAILABLE", "Database is unavailable.");
    }
    return;
  }

  if (url.pathname === "/api/cgu/expenses") {
    await listCguExpenses(url, response, cguClient);
    return;
  }

  if (url.pathname === "/api/cgu/agencies") {
    await listCguAgencies(url, response, cguClient);
    return;
  }

  const tsePhotoMatch = url.pathname.match(
    /^\/api\/tse\/photos\/(2022|2024)\/([A-Z]{2})\/(\d{1,20})$/,
  );
  if (tsePhotoMatch) {
    try {
      const photo = await getTseCandidatePhoto({
        year: Number(tsePhotoMatch[1]),
        state: tsePhotoMatch[2],
        candidateId: tsePhotoMatch[3],
      });
      if (!photo) {
        sendError(response, 404, "NOT_FOUND", "The TSE did not provide this candidate photo.");
        return;
      }
      response.writeHead(200, {
        "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
        "content-length": String(photo.bytes.length),
        "content-type": photo.contentType,
        "x-content-type-options": "nosniff",
      });
      response.end(photo.bytes);
    } catch (error) {
      if (error instanceof TsePhotoError) {
        sendError(
          response,
          error.statusCode,
          error.statusCode === 404 ? "NOT_FOUND" : "TSE_PHOTO_UNAVAILABLE",
          error.message,
        );
        return;
      }
      throw error;
    }
    return;
  }

  if (url.pathname === "/api/politicians") {
    await listPoliticians(url, response);
    return;
  }

  if (url.pathname === "/api/commitments") {
    await listCommitments(url, response);
    return;
  }

  const commitmentEvidenceMatch = url.pathname.match(
    /^\/api\/commitments\/([^/]+)\/evidences$/,
  );
  if (commitmentEvidenceMatch) {
    await listCommitmentEvidences(
      decodeURIComponent(commitmentEvidenceMatch[1]),
      response,
    );
    return;
  }

  const politicianRecordsMatch = url.pathname.match(
    /^\/api\/politicians\/([^/]+)\/(commitments|actions)$/,
  );
  if (politicianRecordsMatch) {
    const politicianId = decodeURIComponent(politicianRecordsMatch[1]);
    if (politicianRecordsMatch[2] === "commitments") {
      await listCommitments(url, response, politicianId);
    } else {
      await listGovernmentActions(politicianId, url, response);
    }
    return;
  }

  const politicianMatch = url.pathname.match(/^\/api\/politicians\/([^/]+)$/);
  if (politicianMatch) {
    await getPolitician(decodeURIComponent(politicianMatch[1]), response);
    return;
  }

  if (url.pathname === "/api/representatives") {
    await listRepresentatives(url, response);
    return;
  }

  const expensesMatch = url.pathname.match(
    /^\/api\/representatives\/([^/]+)\/expenses$/,
  );
  if (expensesMatch) {
    await representativeExpenses(
      decodeURIComponent(expensesMatch[1]),
      url,
      response,
    );
    return;
  }

  if (url.pathname === "/api/proposals") {
    await listProposals(url, response);
    return;
  }

  const proposalEventMatch = url.pathname.match(
    /^\/api\/proposals\/(\d+)\/(progress|votes)$/,
  );
  if (proposalEventMatch) {
    await proposalEvents(
      proposalEventMatch[1],
      proposalEventMatch[2] === "progress" ? "tramitacoes" : "votacoes",
      response,
    );
    return;
  }

  const proposalMatch = url.pathname.match(/^\/api\/proposals\/(\d+)$/);
  if (proposalMatch) {
    await proposalDetail(proposalMatch[1], response);
    return;
  }

  const individualVotesMatch = url.pathname.match(
    /^\/api\/votes\/([^/]+)\/votes$/,
  );
  if (individualVotesMatch) {
    await individualVotes(decodeURIComponent(individualVotesMatch[1]), response);
    return;
  }

  const representativeMatch = url.pathname.match(
    /^\/api\/representatives\/([^/]+)$/,
  );
  if (representativeMatch) {
    await getRepresentative(representativeMatch[1], response);
    return;
  }

  sendError(response, 404, "NOT_FOUND", "Route was not found.");
}

export function createApiHandler(options: { cguClient?: CguClient } = {}) {
  const cguClient = options.cguClient ?? new CguClient();
  return (
    request: ApiRequest,
    response: ApiResponse,
  ) => {
    void handleRequest(request, response, cguClient).catch((error: unknown) => {
      console.error("API request failed", {
        method: request.method,
        path: request.url?.split("?")[0],
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      if (!response.headersSent) {
        sendError(response, 500, "INTERNAL_ERROR", "An unexpected error occurred.");
      } else {
        response.destroy();
      }
    });
  };
}

export function createApiFetchHandler(options: { cguClient?: CguClient } = {}) {
  const handleApiRequest = createApiHandler(options);

  return async (request: Request): Promise<Response> =>
    new Promise<Response>((resolve, reject) => {
      const headers = new Headers();
      let statusCode = 200;
      let settled = false;

      const response: ApiResponse = {
        headersSent: false,
        setHeader(name, value) {
          headers.set(name, value);
        },
        writeHead(status, responseHeaders) {
          statusCode = status;
          for (const [name, value] of Object.entries(responseHeaders ?? {})) {
            headers.set(name, value);
          }
        },
        end(body) {
          if (settled) return;
          settled = true;
          response.headersSent = true;
          const responseBody =
            statusCode === 204 || statusCode === 304
              ? null
              : body instanceof Uint8Array
                ? copyArrayBuffer(body)
                : body ?? null;
          resolve(
            new Response(responseBody, {
              status: statusCode,
              headers,
            }),
          );
        },
        destroy(error) {
          if (settled) return;
          settled = true;
          reject(error ?? new Error("API response was destroyed."));
        },
      };

      const url = new URL(request.url);
      handleApiRequest(
        {
          method: request.method,
          url: `${url.pathname}${url.search}`,
          headers: { origin: request.headers.get("origin") ?? undefined },
        },
        response,
      );
    });
}

function copyArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export function createApiServer(options: { cguClient?: CguClient } = {}) {
  return createServer(createApiHandler(options));
}
