# Run from the repo root, e.g. F:\BankDash\bankdash-financial-dashboard
# powershell -ExecutionPolicy Bypass -File .\apply-bankdash-v1.ps1

param(
  [string]$Branch = "feature/bankdash-v1"
)

function Write-File($Path, $Content) {
  $dir = Split-Path $Path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $Content | Out-File -FilePath $Path -Encoding UTF8 -Force
  Write-Host "Wrote $Path"
}

# 1) Create/replace server files
$serverSchema = @'
import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().default(() => new Date().toISOString()),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  type: text("type").notNull().default("expense"),
});

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  last4: text("last4"),
  balance: real("balance").notNull().default(0),
  institution: text("institution"),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  date: text("date").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(() => new Date().toISOString()),
});

export const recurringRules = sqliteTable("recurring_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pattern: text("pattern").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  type: text("type").notNull().default("contains"),
});

export const bonuses = sqliteTable("bonuses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bank: text("bank").notNull(),
  title: text("title").notNull(),
  amount: real("amount").notNull().default(0),
  status: text("status").notNull().default("planning"),
  openedAt: text("opened_at"),
  deadline: text("deadline"),
  notes: text("notes"),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));
'@

$serverDbIndex = @'
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbFile = process.env.DATABASE_URL ?? "./dev.db";
const sqlite = new Database(dbFile);
export const db = drizzle(sqlite, { schema });
export { schema };
'@

$serverAuth = @'
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "change_me";

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export const signToken = (payload: object, expiresIn = "7d") =>
  jwt.sign(payload, JWT_SECRET, { expiresIn });

export const authRequired = (req: Request, res: Response, next: NextFunction) => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  const token = h.slice(7);
  try {
    (req as any).user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid/expired token" });
  }
};
'@

$serverRoutesAuth = @'
import { Router } from "express";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signToken } from "../auth";

const r = Router();

r.post("/register", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "email/password required" });
  const exists = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (exists) return res.status(409).json({ error: "Email already registered" });
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(schema.users).values({ email, passwordHash }).returning();
  const token = signToken({ sub: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email } });
});

r.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken({ sub: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email } });
});

export default r;
'@

$serverRoutesAccounts = @'
import { Router } from "express";
import { db, schema } from "../db";
import { eq, desc } from "drizzle-orm";
import { authRequired } from "../auth";

const r = Router();
r.use(authRequired);

r.get("/", async (_req, res) => {
  const rows = await db.select().from(schema.accounts).orderBy(desc(schema.accounts.id));
  res.json(rows);
});

r.post("/", async (req, res) => {
  const { name, type, last4, balance = 0, institution } = req.body ?? {};
  if (!name || !type) return res.status(400).json({ error: "name and type required" });
  const [row] = await db.insert(schema.accounts).values({ name, type, last4, balance, institution }).returning();
  res.json(row);
});

r.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, type, last4, balance, institution } = req.body ?? {};
  const row = await db.update(schema.accounts).set({ name, type, last4, balance, institution }).where(eq(schema.accounts.id, id)).returning();
  if (!row.length) return res.status(404).json({ error: "Not found" });
  res.json(row[0]);
});

r.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(schema.accounts).where(eq(schema.accounts.id, id)).run();
  res.json({ ok: true });
});

export default r;
'@

$serverRoutesTransactions = @'
import { Router } from "express";
import { db, schema } from "../db";
import { and, desc, eq, gte, lte, like, sql } from "drizzle-orm";
import { authRequired } from "../auth";

const r = Router();
r.use(authRequired);

r.get("/", async (req, res) => {
  const { search = "", categoryId, min, max, from, to, page = "1", pageSize = "20" } = req.query as any;
  const where = and(
    search ? like(schema.transactions.description, `%${search}%`) : undefined,
    categoryId ? eq(schema.transactions.categoryId, Number(categoryId)) : undefined,
    min ? gte(schema.transactions.amount, Number(min)) : undefined,
    max ? lte(schema.transactions.amount, Number(max)) : undefined,
    from ? gte(schema.transactions.date, String(from)) : undefined,
    to ? lte(schema.transactions.date, String(to)) : undefined,
  );
  const p = Math.max(1, Number(page));
  const ps = Math.max(1, Math.min(200, Number(pageSize)));
  const offset = (p - 1) * ps;
  const [rows, [{ count }]] = await Promise.all([
    db.select().from(schema.transactions).where(where).orderBy(desc(schema.transactions.date)).limit(ps).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(schema.transactions).where(where),
  ]);
  res.json({ rows, page: p, pageSize: ps, total: count });
});

r.post("/", async (req, res) => {
  const { accountId, date, description, amount, categoryId, notes } = req.body ?? {};
  if (!accountId || !date || !description || amount === undefined) return res.status(400).json({ error: "Missing fields" });
  const [row] = await db.insert(schema.transactions).values({ accountId, date, description, amount, categoryId, notes }).returning();
  res.json(row);
});

r.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { accountId, date, description, amount, categoryId, notes } = req.body ?? {};
  const row = await db.update(schema.transactions).set({ accountId, date, description, amount, categoryId, notes }).where(eq(schema.transactions.id, id)).returning();
  if (!row.length) return res.status(404).json({ error: "Not found" });
  res.json(row[0]);
});

r.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(schema.transactions).where(eq(schema.transactions.id, id)).run();
  res.json({ ok: true });
});

r.get("/export.csv", async (_req, res) => {
  const rows = await db.select().from(schema.transactions).orderBy(desc(schema.transactions.date));
  const header = "id,accountId,date,description,amount,categoryId,notes\n";
  const csv = header + rows.map(r =>
    [r.id, r.accountId, r.date, `"${(r.description ?? "").replace(/"/g, '""')}"`, r.amount, r.categoryId ?? "", `"${(r.notes ?? "").replace(/"/g, '""')}"`].join(",")
  ).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
  res.send(csv);
});

r.post("/import.csv", async (req, res) => {
  const text = String(req.body?.csv ?? "");
  if (!text) return res.status(400).json({ error: "csv missing in body" });
  const lines = text.split(/\r?\n/).filter(Boolean);
  const [header, ...data] = lines;
  const idx = (name: string) => header.split(",").findIndex(h => h.trim() === name);
  const aI = idx("accountId"), dI = idx("date"), descI = idx("description"), amtI = idx("amount"), catI = idx("categoryId"), notesI = idx("notes");
  if (aI < 0 || dI < 0 || descI < 0 || amtI < 0) return res.status(400).json({ error: "required columns: accountId,date,description,amount" });
  const toInsert = data.map(line => {
    const cols = line.match(/("([^"]|"")*"|[^,]+)/g)?.map(s => s.replace(/^"|"$/g, "").replace(/""/g, '"')) ?? [];
    return {
      accountId: Number(cols[aI]),
      date: cols[dI],
      description: cols[descI],
      amount: Number(cols[amtI]),
      categoryId: catI >= 0 && cols[catI] ? Number(cols[catI]) : null,
      notes: notesI >= 0 ? cols[notesI] : null,
    };
  });
  if (!toInsert.length) return res.json({ inserted: 0 });
  await db.insert(schema.transactions).values(toInsert).run();
  res.json({ inserted: toInsert.length });
});

export default r;
'@

$serverRoutesBonuses = @'
import { Router } from "express";
import { db, schema } from "../db";
import { eq, desc } from "drizzle-orm";
import { authRequired } from "../auth";

const r = Router();
r.use(authRequired);

r.get("/", async (_req, res) => {
  const rows = await db.select().from(schema.bonuses).orderBy(desc(schema.bonuses.id));
  res.json(rows);
});

r.post("/", async (req, res) => {
  const { bank, title, amount = 0, status = "planning", openedAt, deadline, notes } = req.body ?? {};
  if (!bank || !title) return res.status(400).json({ error: "bank and title required" });
  const [row] = await db.insert(schema.bonuses).values({ bank, title, amount, status, openedAt, deadline, notes }).returning();
  res.json(row);
});

r.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { bank, title, amount, status, openedAt, deadline, notes } = req.body ?? {};
  const row = await db.update(schema.bonuses).set({ bank, title, amount, status, openedAt, deadline, notes }).where(eq(schema.bonuses.id, id)).returning();
  if (!row.length) return res.status(404).json({ error: "Not found" });
  res.json(row[0]);
});

r.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(schema.bonuses).where(eq(schema.bonuses.id, id)).run();
  res.json({ ok: true });
});

export default r;
'@

$serverIndex = @'
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
'@

$serverSeed = @'
import "dotenv/config";
import { db, schema } from "./db";
import { hashPassword } from "./auth";

async function main() {
  await db.delete(schema.transactions).run();
  await db.delete(schema.accounts).run();
  await db.delete(schema.bonuses).run();
  await db.delete(schema.categories).run();
  await db.delete(schema.users).run();

  const passwordHash = await hashPassword("secret123");
  const [user] = await db.insert(schema.users).values({ email: "demo@bankdash.app", passwordHash }).returning();

  const cats = await db.insert(schema.categories).values([
    { name: "Groceries", type: "expense" },
    { name: "Dining", type: "expense" },
    { name: "Utilities", type: "expense" },
    { name: "Income", type: "income" },
    { name: "Transfer", type: "transfer" },
  ]).returning();

  const [accChecking] = await db.insert(schema.accounts).values([
    { name: "Checking 1232", type: "checking", last4: "1232", balance: 2000, institution: "Your Bank" },
    { name: "BSB Savings", type: "savings", last4: "1100", balance: 15100, institution: "Buckeye State Bank" },
    { name: "Freedom Unlimited", type: "credit", last4: "9429", balance: -300, institution: "Chase" },
  ]).returning();

  const cat = (name: string) => cats.find(c => c.name === name)!.id;

  await db.insert(schema.transactions).values([
    { accountId: accChecking.id, date: "2025-09-05", description: "Kroger", amount: -43.04, categoryId: cat("Groceries") },
    { accountId: accChecking.id, date: "2025-09-04", description: "Subway (Google Pay)", amount: -10.71, categoryId: cat("Dining") },
    { accountId: accChecking.id, date: "2025-09-03", description: "Utility Bill", amount: -120.25, categoryId: cat("Utilities") },
    { accountId: accChecking.id, date: "2025-09-02", description: "Amex Send: Add Money", amount: 500.00, categoryId: cat("Transfer") },
    { accountId: accChecking.id, date: "2025-09-01", description: "Paycheck", amount: 2500.00, categoryId: cat("Income") },
  ]);

  await db.insert(schema.bonuses).values([
    { bank: "Capital One", title: "Checking $300", amount: 300, status: "active", openedAt: "2025-08-14" },
    { bank: "Buckeye State Bank", title: "14% APY promo", amount: 0, status: "active", notes: "90-day promo, lock-in 180d" },
    { bank: "Connexus", title: "$300 Checking", amount: 300, status: "planning" },
  ]);

  console.log("Seed complete. demo@bankdash.app / secret123");
}
main();
'@

Write-File "server/src/db/schema.ts" $serverSchema
Write-File "server/src/db/index.ts" $serverDbIndex
Write-File "server/src/auth.ts" $serverAuth
Write-File "server/src/routes/auth.ts" $serverRoutesAuth
Write-File "server/src/routes/accounts.ts" $serverRoutesAccounts
Write-File "server/src/routes/transactions.ts" $serverRoutesTransactions
Write-File "server/src/routes/bonuses.ts" $serverRoutesBonuses
Write-File "server/src/index.ts" $serverIndex
Write-File "server/src/seed.ts" $serverSeed
Write-File "server/.env.example" @'
DATABASE_URL=./dev.db
PORT=4000
JWT_SECRET=change_me
'@

# 2) Client files
$clientApi = @'
import axios from "axios";
const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
export const api = axios.create({ baseURL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
'@

$clientSidebar = @'
import { Link, useLocation } from "react-router-dom";
const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/accounts", label: "Accounts" },
  { to: "/bonuses", label: "Bonuses" },
];
export default function Sidebar() {
  const loc = useLocation();
  return (
    <aside className="hidden md:flex w-64 flex-col gap-1 border-r bg-white p-3">
      <div className="px-2 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">BankDash</div>
      {nav.map(n => {
        const active = loc.pathname === n.to;
        return (
          <Link key={n.to} to={n.to}
            className={`rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 ${active ? "bg-zinc-100 font-medium" : ""}`}>
            {n.label}
          </Link>
        );
      })}
      <button onClick={()=>{ localStorage.removeItem("token"); window.location.href="/login";}}
        className="mt-auto rounded-lg border px-3 py-2 text-sm">Logout</button>
    </aside>
  );
}
'@

$clientCard = @'
export function Card(props: React.PropsWithChildren<{title?: string; className?: string;}>) {
  return (
    <div className={`rounded-2xl border bg-white shadow-sm ${props.className ?? ""}`}>
      {props.title && <div className="border-b px-4 py-3 text-sm font-semibold">{props.title}</div>}
      <div className="p-4">{props.children}</div>
    </div>
  );
}
'@

$clientLogin = @'
import { useState } from "react";
import { api } from "@/lib/api";
export default function Login() {
  const [email, setEmail] = useState("demo@bankdash.app");
  const [password, setPassword] = useState("secret123");
  const [err, setErr] = useState<string | null>(null);
  const submit = async (path: "login" | "register") => {
    setErr(null);
    try {
      const { data } = await api.post(`/api/auth/${path}`, { email, password });
      localStorage.setItem("token", data.token);
      window.location.href = "/";
    } catch (e: any) { setErr(e?.response?.data?.error ?? "Failed"); }
  };
  return (
    <div className="min-h-screen grid place-items-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">BankDash — Sign in</h1>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded-lg border px-3 py-2 text-sm" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
          <input className="w-full rounded-lg border px-3 py-2 text-sm" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <div className="flex gap-2">
            <button onClick={()=>submit("login")} className="rounded-lg bg-black px-3 py-2 text-sm text-white">Login</button>
            <button onClick={()=>submit("register")} className="rounded-lg border px-3 py-2 text-sm">Register</button>
          </div>
        </div>
      </div>
    </div>
  );
}
'@

$clientDashboard = @'
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";
export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api.get("/api/dashboard").then(r=>setData(r.data)); }, []);
  if (!data) return <div className="p-6 text-sm text-zinc-600">Loading…</div>;
  const fmt = (n:number) => n.toLocaleString(undefined, {style:"currency",currency:"USD"});
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-zinc-50">
        <header className="sticky top-0 z-10 border-b bg-white px-6 py-3">
          <h1 className="text-lg font-semibold">Welcome Back!</h1>
          <p className="text-xs text-zinc-500">Overview of your finances</p>
        </header>
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><p className="text-xs uppercase text-zinc-500">Net Worth</p><p className="mt-1 text-2xl font-semibold">{fmt(data.stats.netWorth)}</p></Card>
            <Card><p className="text-xs uppercase text-zinc-500">Total Assets</p><p className="mt-1 text-2xl font-semibold text-emerald-600">{fmt(data.stats.totalAssets)}</p></Card>
            <Card><p className="text-xs uppercase text-zinc-500">Credit Card Debt</p><p className="mt-1 text-2xl font-semibold text-rose-600">{fmt(data.stats.creditCardDebt)}</p></Card>
            <Card><p className="text-xs uppercase text-zinc-500">Accounts</p><p className="mt-1 text-2xl font-semibold">{data.stats.accountsCount}</p></Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Recent Transactions" className="lg:col-span-2">
              <table className="w-full text-sm">
                <thead className="text-left text-zinc-500"><tr><th className="py-2">Date</th><th>Description</th><th className="text-right">Amount</th></tr></thead>
                <tbody>
                  {data.transactions.map((t:any) => (
                    <tr key={t.id} className="border-t">
                      <td className="py-2">{t.date}</td>
                      <td>{t.description}</td>
                      <td className={`text-right ${t.amount<0?"text-rose-600":"text-emerald-600"}`}>{t.amount<0?"-":""}{fmt(Math.abs(t.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card title="Quick Actions">
              <div className="grid grid-cols-2 gap-3">
                {["Transactions","Accounts","Bonuses"].map((a) => (
                  <a key={a} href={`/${a.toLowerCase()}`} className="rounded-xl border px-3 py-2 text-sm hover:bg-zinc-50">{a}</a>
                ))}
                <a href="/api/transactions/export.csv" className="rounded-xl border px-3 py-2 text-sm hover:bg-zinc-50">Export CSV</a>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
'@

$clientTransactions = @'
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";

type Tx = { id:number; accountId:number; date:string; description:string; amount:number; categoryId?:number; notes?:string };

export default function TransactionsPage() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [min, setMin] = useState<string>("");
  const [max, setMax] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const qs = useMemo(() => ({ search, categoryId, min, max, from, to, page, pageSize }), [search,categoryId,min,max,from,to,page,pageSize]);

  useEffect(() => {
    const p = new URLSearchParams(Object.entries(qs).filter(([,_v])=>String(_v)));
    api.get(`/api/transactions?${p.toString()}`).then(r => { setRows(r.data.rows); setTotal(r.data.total); });
  }, [qs]);

  const fmt = (n:number) => n.toLocaleString(undefined, { style:"currency", currency:"USD" });

  const importCsv = async (file: File) => {
    const text = await file.text();
    await api.post("/api/transactions/import.csv", { csv: text });
    setPage(1);
    const p = new URLSearchParams(Object.entries(qs).filter(([,_v])=>String(_v)));
    api.get(`/api/transactions?${p.toString()}`).then(r => { setRows(r.data.rows); setTotal(r.data.total); });
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-zinc-50">
        <header className="border-b bg-white px-6 py-3">
          <h1 className="text-lg font-semibold">Transactions</h1>
        </header>
        <main className="mx-auto max-w-7xl space-y-4 px-4 py-6">
          <Card title="Filters">
            <div className="grid gap-3 md:grid-cols-6">
              <input className="rounded-lg border px-3 py-2 text-sm md:col-span-2" placeholder="Search description…" value={search} onChange={e=>{setSearch(e.target.value); setPage(1);}} />
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Category ID" value={categoryId} onChange={e=>{setCategoryId(e.target.value); setPage(1);}} />
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Min $" value={min} onChange={e=>{setMin(e.target.value); setPage(1);}} />
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Max $" value={max} onChange={e=>{setMax(e.target.value); setPage(1);}} />
              <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={from} onChange={e=>{setFrom(e.target.value); setPage(1);}} />
              <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={to} onChange={e=>{setTo(e.target.value); setPage(1);}} />
            </div>
          </Card>

          <Card title="Actions">
            <div className="flex flex-wrap gap-3">
              <a className="rounded-lg border px-3 py-2 text-sm" href="/api/transactions/export.csv">Export CSV</a>
              <label className="rounded-lg border px-3 py-2 text-sm cursor-pointer">
                Import CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importCsv(f); }} />
              </label>
            </div>
          </Card>

          <Card title="Results">
            <table className="w-full text-sm">
              <thead className="text-left text-zinc-500">
                <tr><th className="py-2">Date</th><th>Description</th><th>Account</th><th className="text-right">Amount</th></tr>
              </thead>
              <tbody>
                {rows.map(t => (
                  <tr key={t.id} className="border-t">
                    <td className="py-2">{t.date}</td>
                    <td>{t.description}</td>
                    <td>{t.accountId}</td>
                    <td className={`text-right ${t.amount<0?"text-rose-600":"text-emerald-600"}`}>{t.amount<0?"-":""}{fmt(Math.abs(t.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span>Total: {total.toLocaleString()}</span>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border px-2 py-1" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
                <span>Page {page}</span>
                <button className="rounded-lg border px-2 py-1" disabled={rows.length<pageSize} onClick={()=>setPage(p=>p+1)}>Next</button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
'@

$clientAccounts = @'
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";

type Account = { id:number; name:string; type:string; last4?:string; balance:number; institution?:string };

export default function AccountsPage() {
  const [rows, setRows] = useState<Account[]>([]);
  const [form, setForm] = useState<Partial<Account>>({ type:"checking", balance:0 });

  const load = async () => { const { data } = await api.get("/api/accounts"); setRows(data); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (form.id) await api.put(`/api/accounts/${form.id}`, form);
    else await api.post("/api/accounts", form);
    setForm({ type:"checking", balance:0 });
    load();
  };
  const edit = (a: Account) => setForm(a);
  const del = async (id:number) => { await api.delete(`/api/accounts/${id}`); load(); };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-zinc-50">
        <header className="border-b bg-white px-6 py-3"><h1 className="text-lg font-semibold">Accounts</h1></header>
        <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
          <Card title="New / Edit Account">
            <div className="grid gap-3 md:grid-cols-5">
              <input className="rounded-lg border px-3 py-2 text-sm md:col-span-2" placeholder="Name" value={form.name ?? ""} onChange={e=>setForm({...form, name:e.target.value})}/>
              <select className="rounded-lg border px-3 py-2 text-sm" value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
                {["checking","savings","credit","investment"].map(t => <option key={t}>{t}</option>)}
              </select>
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Last4" value={form.last4 ?? ""} onChange={e=>setForm({...form, last4:e.target.value})}/>
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Institution" value={form.institution ?? ""} onChange={e=>setForm({...form, institution:e.target.value})}/>
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Balance" value={form.balance ?? 0} onChange={e=>setForm({...form, balance:Number(e.target.value)})}/>
            </div>
            <div className="mt-3">
              <button onClick={save} className="rounded-lg bg-black px-3 py-2 text-sm text-white">{form.id ? "Update" : "Create"}</button>
              {form.id && <button onClick={()=>setForm({ type:"checking", balance:0 })} className="ml-2 rounded-lg border px-3 py-2 text-sm">Cancel</button>}
            </div>
          </Card>

          <Card title="Accounts">
            <table className="w-full text-sm">
              <thead className="text-left text-zinc-500"><tr><th>Name</th><th>Type</th><th>Last4</th><th>Institution</th><th className="text-right">Balance</th><th></th></tr></thead>
              <tbody>
                {rows.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="py-2">{a.name}</td><td>{a.type}</td><td>{a.last4}</td><td>{a.institution}</td>
                    <td className={`text-right ${a.type==="credit"?"text-rose-600":"text-emerald-600"}`}>{a.balance.toLocaleString(undefined,{style:"currency",currency:"USD"})}</td>
                    <td className="text-right">
                      <button className="rounded-lg border px-2 py-1 mr-2" onClick={()=>edit(a)}>Edit</button>
                      <button className="rounded-lg border px-2 py-1" onClick={()=>del(a.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </main>
      </div>
    </div>
  );
}
'@

$clientBonuses = @'
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";

type Bonus = { id:number; bank:string; title:string; amount:number; status:"planning"|"active"|"earned"; openedAt?:string; deadline?:string; notes?:string };

export default function BonusesPage() {
  const [rows, setRows] = useState<Bonus[]>([]);
  const [form, setForm] = useState<Partial<Bonus>>({ status:"planning", amount:0 });

  const load = async () => { const { data } = await api.get("/api/bonuses"); setRows(data); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (form.id) await api.put(`/api/bonuses/${form.id}`, form);
    else await api.post("/api/bonuses", form);
    setForm({ status:"planning", amount:0 });
    load();
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-zinc-50">
        <header className="border-b bg-white px-6 py-3"><h1 className="text-lg font-semibold">Bank Bonuses</h1></header>
        <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
          <Card title="Add / Edit">
            <div className="grid gap-3 md:grid-cols-6">
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Bank" value={form.bank ?? ""} onChange={e=>setForm({...form, bank:e.target.value})}/>
              <input className="rounded-lg border px-3 py-2 text-sm md:col-span-2" placeholder="Title" value={form.title ?? ""} onChange={e=>setForm({...form, title:e.target.value})}/>
              <select className="rounded-lg border px-3 py-2 text-sm" value={form.status} onChange={e=>setForm({...form, status: e.target.value as any})}>
                {["planning","active","earned"].map(s => <option key={s}>{s}</option>)}
              </select>
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Amount" value={form.amount ?? 0} onChange={e=>setForm({...form, amount:Number(e.target.value)})}/>
              <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={form.openedAt ?? ""} onChange={e=>setForm({...form, openedAt:e.target.value})}/>
              <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={form.deadline ?? ""} onChange={e=>setForm({...form, deadline:e.target.value})}/>
              <input className="rounded-lg border px-3 py-2 text-sm md:col-span-6" placeholder="Notes" value={form.notes ?? ""} onChange={e=>setForm({...form, notes:e.target.value})}/>
            </div>
            <div className="mt-3"><button onClick={save} className="rounded-lg bg-black px-3 py-2 text-sm text-white">{form.id?"Update":"Save"}</button></div>
          </Card>

          {(["planning","active","earned"] as const).map(status => (
            <Card key={status} title={status.toUpperCase()}>
              <div className="grid gap-3 md:grid-cols-3">
                {rows.filter(b => b.status===status).map(b => (
                  <div key={b.id} className="rounded-xl border p-3 text-sm">
                    <div className="font-medium">{b.bank} — {b.title}</div>
                    <div className="text-zinc-500">Amount: ${b.amount}</div>
                    {b.openedAt && <div className="text-zinc-500">Opened: {b.openedAt}</div>}
                    {b.deadline && <div className="text-zinc-500">Deadline: {b.deadline}</div>}
                    {b.notes && <div className="text-zinc-500">{b.notes}</div>}
                    <div className="mt-2 flex gap-2">
                      <button className="rounded-lg border px-2 py-1" onClick={()=>setForm(b)}>Edit</button>
                      <button className="rounded-lg border px-2 py-1" onClick={async()=>{ await api.put(`/api/bonuses/${b.id}`, { ...b, status: b.status==="active"?"earned":"active" }); load(); }}>
                        {b.status==="active" ? "Mark Earned" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </main>
      </div>
    </div>
  );
}
'@

$clientMain = @'
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import TransactionsPage from "@/pages/Transactions";
import AccountsPage from "@/pages/Accounts";
import BonusesPage from "@/pages/Bonuses";
import Sidebar from "@/components/Sidebar";

function Protected({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/transactions" element={<Protected><TransactionsPage /></Protected>} />
        <Route path="/accounts" element={<Protected><AccountsPage /></Protected>} />
        <Route path="/bonuses" element={<Protected><BonusesPage /></Protected>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
'@

Write-File "client/src/lib/api.ts" $clientApi
Write-File "client/src/components/Sidebar.tsx" $clientSidebar
Write-File "client/src/components/Card.tsx" $clientCard
Write-File "client/src/pages/Login.tsx" $clientLogin
Write-File "client/src/pages/Dashboard.tsx" $clientDashboard
Write-File "client/src/pages/Transactions.tsx" $clientTransactions
Write-File "client/src/pages/Accounts.tsx" $clientAccounts
Write-File "client/src/pages/Bonuses.tsx" $clientBonuses
Write-File "client/.env.example" @'
VITE_API_URL=http://localhost:4000
'@

# 3) Ensure basic server package.json scripts (non-destructive append guidance)
# (You already have most; just ensure dev uses nodemon)
Write-Host "`n> Ensure server/package.json scripts have:"
Write-Host '  "dev": "nodemon --watch src --ext ts --exec \"ts-node ./src/index.ts\""'

# 4) Git: new branch, commit
git checkout -b $Branch
git add server client
git commit -m "BankDash v1: transactions (filters, CSV import/export), accounts CRUD, bonuses tracker, auth (JWT)"

Write-Host "`n✅ Files written & committed on $Branch."
Write-Host "Next steps:"
Write-Host "1) Install deps:"
Write-Host "   cd server"
Write-Host "   npm i express cors drizzle-orm better-sqlite3 dotenv bcryptjs jsonwebtoken"
Write-Host "   npm i -D @types/node @types/express @types/cors @types/better-sqlite3 ts-node nodemon typescript drizzle-kit"
Write-Host "   cd ..\\client"
Write-Host "   npm i axios"
Write-Host "2) DB & run:"
Write-Host "   cd ..\\server"
Write-Host "   npm run db:push && npm run seed && npm run dev"
Write-Host "   # new terminal -> client: npm run dev"
Write-Host "3) Push branch & open PR:"
Write-Host "   git push -u origin $Branch"
Write-Host "   # then open a PR on GitHub comparing $Branch -> main"
