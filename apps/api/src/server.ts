import { createApiServer } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const server = createApiServer();

server.listen(port, host, () => {
  console.log(`API listening on port ${port} (bind address ${host}).`);
});
