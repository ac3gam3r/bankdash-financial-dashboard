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
