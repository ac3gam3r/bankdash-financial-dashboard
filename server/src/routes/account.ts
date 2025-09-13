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
