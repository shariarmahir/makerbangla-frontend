import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Role } from "./types";

/** Session token + password hashing. No Next.js imports, so `proxy.ts` can use it too. */

/** `__Host-` in production: Secure, path=/ and no Domain, so a subdomain can never set or overwrite it. */
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-mb_session" : "mb_session";
export const SESSION_TTL = 60 * 60 * 12; // 12 hours

export type SessionPayload = { sub: string; role: Role; v: number; exp: number };

const secret = () => {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
};

const mac = (body: string, key: string) => createHmac("sha256", key).update(body).digest("base64url");

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function signSession(p: Omit<SessionPayload, "exp">) {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET is missing or shorter than 32 characters.");
  const body = Buffer.from(JSON.stringify({ ...p, exp: Math.floor(Date.now() / 1000) + SESSION_TTL })).toString("base64url");
  return `${body}.${mac(body, key)}`;
}

export function verifySession(token: string | undefined): SessionPayload | null {
  const key = secret();
  if (!key || !token || token.length > 512) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(sig, mac(body, key))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    return typeof p.sub === "string" && (p.role === "admin" || p.role === "staff") && Number.isInteger(p.v) && p.exp > Date.now() / 1000 ? p : null;
  } catch {
    return null;
  }
}

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

/** `scrypt:<salt hex>:<hash hex>` (no "$", which .env files would expand) */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `scrypt:${salt.toString("hex")}:${(await scrypt(password, salt, 32)).toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [kind, salt, hash] = stored.split(":");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const got = await scrypt(password, Buffer.from(salt, "hex"), 32);
  const want = Buffer.from(hash, "hex");
  return got.length === want.length && timingSafeEqual(got, want);
}

/** Readable one-time password for new or reset employee accounts, e.g. "mb-7KQ4-x9tR". */
export function generatePassword() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const b = randomBytes(8);
  const s = Array.from(b, (n) => abc[n % abc.length]).join("");
  return `mb-${s.slice(0, 4)}-${s.slice(4)}`;
}
