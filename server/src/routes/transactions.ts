import { Router } from "express";
import { db, schema } from "../db";
import { and, desc, eq, gte, lte, like, sql } from "drizzle-orm";
import { authRequired } from "../auth";

const r = Router();
r.use(authRequired);

// GET /api/transactions?search=&categoryId=&min=&max=&from=&to=&page=1&pageSize=20
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
  const row = await db.update(schema.transactions)
    .set({ accountId, date, description, amount, categoryId, notes })
    .where(eq(schema.transactions.id, id))
    .returning();
  if (!row.length) return res.status(404).json({ error: "Not found" });
  res.json(row[0]);
});

r.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(schema.transactions).where(eq(schema.transactions.id, id)).run();
  res.json({ ok: true });
});

// CSV Export
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

// CSV Import (text/csv in JSON body as { csv: "..." })
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