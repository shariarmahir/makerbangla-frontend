import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { adminEmail } from "./admin-account";
import { readDb } from "./db";
import { SESSION_COOKIE, SESSION_TTL, signSession, verifySession, type SessionPayload } from "./session";
import { sections, type Section, type User } from "./types";

/** Access check used by pages (redirect) and server actions (throw). Finance/team/settings-admin are admin-only. */
export const canAccess = (user: User, area: Section | "admin") => user.role === "admin" || (area !== "admin" && user.access.includes(area));

export async function getUser(): Promise<User | null> {
  await connection(); // session expiry depends on the current time: always evaluate per request
  const session = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const db = await readDb();
  if (session.role === "admin") {
    if (session.sub !== "admin" || session.v !== (db.profile.sessionVersion ?? 1)) return null;
    return { id: "admin", role: "admin", name: db.profile.name, title: db.profile.title, email: adminEmail, photo: db.profile.photo, access: Object.keys(sections) as Section[] };
  }
  const e = db.employees.find((x) => x.id === session.sub);
  if (!e || !e.active || e.sessionVersion !== session.v) return null;
  return { id: e.id, role: "staff", name: e.name, title: e.designation, email: e.email, photo: e.photo, access: e.access.filter((a) => a in sections) };
}

/** For pages: signed-out users go to sign in, users without access go to their dashboard home. */
export async function requireUser(area?: Section | "admin") {
  const user = await getUser();
  if (!user) redirect("/account");
  if (area && !canAccess(user, area)) redirect("/dashboard");
  return user;
}

/** For server actions: never trust the client — check the session again on every call. */
export async function assertUser(area?: Section | "admin") {
  const user = await getUser();
  if (!user || (area && !canAccess(user, area))) throw new Error("You don't have access to do that.");
  return user;
}

export async function startSession(p: Omit<SessionPayload, "exp">) {
  (await cookies()).set(SESSION_COOKIE, signSession(p), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
