import type { IncomingMessage, ServerResponse } from "node:http";
import { createApiHandler } from "../src/app.js";

const handleApiRequest = createApiHandler();

export default function handler(
  request: IncomingMessage,
  response: ServerResponse,
): void {
  handleApiRequest(request, response);
}
