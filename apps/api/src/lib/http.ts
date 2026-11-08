export interface ApiRequest {
  method?: string;
  url?: string;
  headers: {
    origin?: string;
  };
}

export interface ApiResponse {
  headersSent: boolean;
  setHeader(name: string, value: string): void;
  writeHead(statusCode: number, headers?: Record<string, string>): void;
  end(body?: string | Uint8Array): void;
  destroy(error?: Error): void;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export function sendJson(
  response: ApiResponse,
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
  response: ApiResponse,
  statusCode: number,
  code: string,
  message: string,
  details?: ApiError["error"]["details"],
): void {
  const error: ApiError["error"] = { code, message };
  if (details) error.details = details;
  sendJson(response, statusCode, { error });
}
