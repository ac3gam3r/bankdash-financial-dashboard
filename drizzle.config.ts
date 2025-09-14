import type { Config } from "drizzle-kit";

export default {
  schema: "./server/src/db/schema.ts",
  out: "./server/drizzle",
  dialect: "sqlite",
  dbCredentials: { url: "./server/dev.db" }
} satisfies Config;