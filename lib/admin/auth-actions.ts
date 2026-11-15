"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { endSession, startSession } from "./auth";
import { log, mutate, readDb } from "./db";
import { adminEmail, adminPasswordHash } from "./admin-account";
import { sessionReady, verifyPassword } from "./session";
import { clientIp, limiter } from "@/lib/rate-limit";
import { demoEmployee } from "./demo";

/** `id` is echoed back so the form keeps what was typed (React resets forms after an action). */
export type SignInState = { error?: string; id?: string } | null;

// Brakes on password guessing (per server instance): 8 tries / 10 min per IP, and 10 / 15 min per account —
// the account limit still holds when an attacker rotates IPs.
const byIp = limiter("signin-ip", 8, 10 * 60_000);
const byId = limiter("signin-id", 10, 15 * 60_000);
const DUMMY = "scrypt:00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000";

export async function signIn(_: SignInState, form: FormData): Promise<SignInState> {
  const ip = clientIp(await headers());
  const now = Date.now();
  const id = String(form.get("id") ?? "").trim().toLowerCase().slice(0, 254);
  if (byIp.blocked(ip, now) || byId.blocked(id, now)) return { id, error: "Too many attempts. Please wait a few minutes and try again." };

  const password = String(form.get("password") ?? "").slice(0, 200);
  if (!id || !password) return { id, error: "Enter your email or username and password." };

  if (!sessionReady()) return { id, error: "Sign-in isn't configured on this server yet." };

  const db = await readDb();
  const employee = db.employees.find((e) => e.active && (e.username === id || e.email.toLowerCase() === id));

  let ok = false;
  if (id === adminEmail) {
    ok = await verifyPassword(password, db.profile.passwordHash ?? adminPasswordHash);
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
    byIp.take(ip, now);
    byId.take(id, now);
    return { id, error: "That email/username and password don't match." };
  }
  byIp.reset(ip);
  byId.reset(id);
  redirect("/dashboard");
}

export async function signOut() {
  await endSession();
  redirect("/account");
}

/** One click into the employee dashboard as the sample dispatch employee — only while the store holds no real customer data. */
export async function demoSignIn() {
  const db = await readDb();
  const e = demoEmployee(db);
  if (!e || !sessionReady()) redirect("/account");
  await startSession({ sub: e.id, role: "staff", v: e.sessionVersion });
  await mutate((d) => log(d, e.name, "opened the employee demo"));
  redirect("/dashboard");
}
