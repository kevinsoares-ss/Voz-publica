import type { ServerResponse } from "node:http";

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
): void {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

export function sendError(
  response: ServerResponse,
  statusCode: number,
  code: string,
  message: string,
  details?: ApiError["error"]["details"],
): void {
  const error: ApiError["error"] = { code, message };
  if (details) error.details = details;
  sendJson(response, statusCode, { error });
}
