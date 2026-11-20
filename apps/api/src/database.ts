import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

// Load environment variables from local and root configs
dotenv.config();
for (const envPath of [".env.local", ".env", "../../.env.local", "../../.env", "apps/api/.env"]) {
  const fullPath = resolve(process.cwd(), envPath);
  if (existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: false });
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be configured before using the database.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

export const prisma = new PrismaClient({ adapter });
