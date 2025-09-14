// server/drizzle.config.ts
import "dotenv/config";
import type { Config } from "drizzle-kit";
import path from "path";
import fs from "fs";

// Resolve an absolute path to the DB file that works on Windows too
const urlFromEnv = process.env.DATABASE_URL; // e.g., file:./data/bankdash.sqlite
const absFileUrl = (() => {
  if (urlFromEnv && urlFromEnv.startsWith("file:")) {
    const p = urlFromEnv.slice(5);
    const abs = path.resolve(__dirname, p);
    return `file:${abs}`;
  }
  // default to ./data/bankdash.sqlite next to this file
  const abs = path.resolve(__dirname, "./data/bankdash.sqlite");
  return `file:${abs}`;
})();

// Ensure parent folder exists BEFORE drizzle-kit opens the DB
const absFsPath = absFileUrl.replace(/^file:/, "");
fs.mkdirSync(path.dirname(absFsPath), { recursive: true });

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: absFileUrl,
  },
  strict: true,
} satisfies Config;
