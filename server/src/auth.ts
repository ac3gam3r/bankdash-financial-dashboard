// /server/src/auth.ts
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import bcrypt from "bcryptjs";

// ===== JWT bits =====
const JWT_SECRET: Secret =
  process.env.JWT_SECRET ??
  (() => {
    throw new Error("JWT_SECRET is required (set it in your .env)");
  })();

const DEFAULT_EXPIRES_IN: StringValue = "1h";

export function signToken(
  payload: string | object | Buffer,
  options: SignOptions = {}
): string {
  const envExpires = process.env.JWT_EXPIRES_IN as unknown as StringValue | undefined;
  const expiresIn: number | StringValue | undefined =
    options.expiresIn ?? envExpires ?? DEFAULT_EXPIRES_IN;

  return jwt.sign(payload, JWT_SECRET, { ...options, expiresIn });
}

export function verifyToken<T = unknown>(token: string): T {
  return jwt.verify(token, JWT_SECRET) as T;
}

// ===== Password helpers =====
// rounds: bcryptjs cost factor; keep modest for seeding/dev
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

/** Async hash (preferred) */
export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(plain, salt);
}

/** Sync hash (handy if your seeder isn't async) */
export function hashPasswordSync(plain: string): string {
  const salt = bcrypt.genSaltSync(BCRYPT_ROUNDS);
  return bcrypt.hashSync(plain, salt);
}

/** Async compare */
export function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

/** Sync compare */
export function comparePasswordSync(plain: string, hashed: string): boolean {
  return bcrypt.compareSync(plain, hashed);
}
// ✅ keep route API stable by exporting an alias:
export const verifyPassword = comparePassword;           // async version
export const verifyPasswordSync = comparePasswordSync;   // (optional) sync alias

import type { Request, Response, NextFunction } from "express";

// … existing exports (signToken, verifyToken, hashPassword, etc.)

export interface AuthRequest extends Request {
  user?: any;
}

export function authRequired(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
