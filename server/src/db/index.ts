// /server/src/db/index.ts
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

/** Support SQLITE_DB_PATH, DATABASE_URL like file:./data/app.sqlite, or default */
function toFsPath(input: string): string {
  return input.startsWith("file:") ? input.slice(5) : input;
}

const raw =
  process.env.SQLITE_DB_PATH ??
  process.env.DATABASE_URL ??
  "file:./data/bankdash.sqlite";

const dbFile = path.resolve(process.cwd(), toFsPath(raw));
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

if (process.env.NODE_ENV !== "test") {
  console.log(`[db] Opening SQLite at: ${dbFile}`);
}

const sqlite = new Database(dbFile);

/** drizzle-orm DB instance (what your app should use) */
export const db = drizzle(sqlite, { schema });

/** re-export schema as a named member so callers can `import { schema }` */
export { schema };
