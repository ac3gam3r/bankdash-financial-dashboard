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