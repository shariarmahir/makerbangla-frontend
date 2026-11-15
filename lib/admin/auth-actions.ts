"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { endSession, startSession } from "./auth";
import { log, mutate, readDb } from "./db";
import { verifyPassword } from "./session";

/** `id` is echoed back so the form keeps what was typed (React resets forms after an action). */
export type SignInState = { error?: string; id?: string } | null;

// Brakes on password guessing (per server instance): 8 tries / 10 min per IP, and 10 / 15 min per account —
// the account limit still holds when an attacker rotates IPs or spoofs x-forwarded-for.
const attempts = new Map<string, { n: number; until: number }>();
const blocked = (key: string, max: number, now: number) => {
  const a = attempts.get(key);
  return !!a && a.until > now && a.n >= max;
};
const fail = (key: string, windowMs: number, now: number) => {
  const a = attempts.get(key);
  attempts.set(key, a && a.until > now ? { n: a.n + 1, until: a.until } : { n: 1, until: now + windowMs });
  if (attempts.size > 10_000) attempts.clear();
};
const DUMMY = "scrypt:00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000";

export async function signIn(_: SignInState, form: FormData): Promise<SignInState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const id = String(form.get("id") ?? "").trim().toLowerCase().slice(0, 254);
  if (blocked(`ip:${ip}`, 8, now) || blocked(`id:${id}`, 10, now)) return { id, error: "Too many attempts. Please wait a few minutes and try again." };

  const password = String(form.get("password") ?? "").slice(0, 200);
  if (!id || !password) return { id, error: "Enter your email or username and password." };

  if ((process.env.SESSION_SECRET?.length ?? 0) < 32) return { id, error: "Sign-in isn't configured on this server yet." };

  const db = await readDb();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const employee = db.employees.find((e) => e.active && (e.username === id || e.email.toLowerCase() === id));

  let ok = false;
  if (adminEmail && id === adminEmail) {
    ok = await verifyPassword(password, db.profile.passwordHash ?? process.env.ADMIN_PASSWORD_HASH ?? DUMMY);
    if (ok) await startSession({ sub: "admin", role: "admin", v: db.profile.sessionVersion ?? 1 });
  } else if (employee) {
    ok = await verifyPassword(password, employee.passwordHash);
    if (ok) {
      await startSession({ sub: employee.id, role: "staff", v: employee.sessionVersion });
      await mutate((d) => {
        const e = d.employees.find((x) => x.id === employee.id);
        if (e) e.lastLogin = new Date().toISOString();
        log(d, employee.name, "signed in");
      });
    }
  } else {
    await verifyPassword(password, DUMMY); // same work for unknown users, so timing doesn't reveal accounts
  }

  if (!ok) {
    fail(`ip:${ip}`, 10 * 60_000, now);
    fail(`id:${id}`, 15 * 60_000, now);
    return { id, error: "That email/username and password don't match." };
  }
  attempts.delete(`ip:${ip}`);
  attempts.delete(`id:${id}`);
  redirect("/dashboard");
}

export async function signOut() {
  await endSession();
  redirect("/account");
}
