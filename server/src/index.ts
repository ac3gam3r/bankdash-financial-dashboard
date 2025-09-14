import "dotenv/config";
import express from "express";
import cors from "cors";
import { db, schema } from "./db";
import { desc } from "drizzle-orm";
import authRoutes from "./routes/auth";
import accountsRoutes from "./routes/accounts";
import txRoutes from "./routes/transactions";
import bonusRoutes from "./routes/bonuses";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Public dashboard summary (adjust to require auth if desired)
app.get("/api/dashboard", async (_req, res) => {
  const accounts = await db.select().from(schema.accounts);
  const transactions = await db.select().from(schema.transactions).orderBy(desc(schema.transactions.date)).limit(5);
  const totalAssets = accounts.filter(a => a.type !== "credit").reduce((s, a) => s + a.balance, 0);
  const ccDebt = accounts.filter(a => a.type === "credit").reduce((s, a) => s + Math.abs(Math.min(a.balance, 0)), 0);
  const netWorth = totalAssets - ccDebt;
  res.json({ stats: { netWorth, totalAssets, creditCardDebt: ccDebt, accountsCount: accounts.length }, accounts: accounts.slice(0, 3), transactions });
});

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/transactions", txRoutes);
app.use("/api/bonuses", bonusRoutes);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));