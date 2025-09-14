import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbFile = process.env.DATABASE_URL ?? "./dev.db";
const sqlite = new Database(dbFile);
export const db = drizzle(sqlite, { schema });
export { schema };
