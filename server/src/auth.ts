import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

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

// bcrypt rounds
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(plain, salt);
}
export function hashPasswordSync(plain: string): string {
  const salt = bcrypt.genSaltSync(BCRYPT_ROUNDS);
  return bcrypt.hashSync(plain, salt);
}
export function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
export function comparePasswordSync(plain: string, hashed: string): boolean {
  return bcrypt.compareSync(plain, hashed);
}

// Aliases to match route imports
export const verifyPassword = comparePassword;
export const verifyPasswordSync = comparePasswordSync;

// Express auth middleware
export interface AuthRequest extends Request { user?: any; }
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
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}