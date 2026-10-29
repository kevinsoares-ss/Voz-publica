import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
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
import {
  listCguAgencies,
  listCguExpenses,
} from "./integrations/cgu/routes.js";

const MAX_URL_LENGTH = 8_192;
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ??
    "http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  cguClient: CguClient,
): Promise<void> {
  const origin = request.headers.origin;
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
  return (request: IncomingMessage, response: ServerResponse) => {
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

export function createApiServer(options: { cguClient?: CguClient } = {}) {
  return createServer(createApiHandler(options));
}
