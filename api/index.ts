import type { IncomingMessage, ServerResponse } from "node:http";
import { createApiHandler } from "../apps/api/src/app.js";

const handleApiRequest = createApiHandler();

export default function handler(
  request: IncomingMessage,
  response: ServerResponse,
): void {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const apiPath = requestUrl.searchParams.get("__api_path");

  if (apiPath !== null) {
    requestUrl.searchParams.delete("__api_path");
    request.url = `/api/${apiPath}${requestUrl.search}`;
  }

  handleApiRequest(request, response);
}
