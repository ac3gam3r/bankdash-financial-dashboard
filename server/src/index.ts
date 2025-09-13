import "dotenv/config";
import express from "express";
import cors from "cors";
import { db, schema } from "./db";
import { sql, desc } from "drizzle-orm";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/dashboard", async (_req, res) => {
  const accounts = await db.select().from(schema.accounts);
  const transactions = await db.select().from(schema.transactions).orderBy(desc(schema.transactions.date)).limit(5);

  const totalAssets = accounts.filter(a => a.type !== "credit").reduce((s, a) => s + a.balance, 0);
  const ccDebt = accounts.filter(a => a.type === "credit").reduce((s, a) => s + Math.abs(Math.min(a.balance, 0)), 0);
  const netWorth = totalAssets - ccDebt;

  res.json({
    stats: {
      netWorth,
      totalAssets,
      creditCardDebt: ccDebt,
      accountsCount: accounts.length
    },
    accounts: accounts.slice(0, 3), // for “Account Status”
    transactions
  });
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
