"use server";

import { z } from "zod";
import { mediaOrPath, run, str, UserError } from "../action";
import { endSession, startSession } from "../auth";
import { adminPasswordHash } from "../admin-account";
import { log, mutate, readDb } from "../db";
import { hashPassword, verifyPassword } from "../session";

export async function updateProfile(input: unknown) {
  return run(null, z.object({ name: str(80, 2, "Name"), title: str(80, 2, "Title"), photo: z.union([z.literal(""), mediaOrPath]) }), input, (d, user) =>
    mutate((db) => {
      if (user.role === "admin") db.profile = { ...db.profile, name: d.name, title: d.title, photo: d.photo || undefined };
      else {
        const e = db.employees.find((x) => x.id === user.id);
        if (!e) throw new UserError("Your account no longer exists.");
        e.photo = d.photo || undefined; // name and designation are set by the super admin
      }
      return null;
    }),
  );
}

const passwordSchema = z
  .object({ current: z.string().min(1, "Enter your current password.").max(200), next: z.string().min(10, "Use at least 10 characters.").max(200), confirm: z.string().max(200) })
  .refine((d) => d.next === d.confirm, { message: "The new passwords don't match.", path: ["confirm"] })
  .refine((d) => d.next !== d.current, { message: "Choose a password you haven't used here.", path: ["next"] });

/** Changing the password signs out every other device (session version bump) and keeps this one signed in. */
export async function changePassword(input: unknown) {
  return run(null, passwordSchema, input, async (d, user) => {
    const db = await readDb();
    const stored = user.role === "admin" ? db.profile.passwordHash ?? adminPasswordHash : db.employees.find((e) => e.id === user.id)?.passwordHash ?? "";
    if (!(await verifyPassword(d.current, stored))) throw new UserError("Your current password isn't right.");
    const hash = await hashPassword(d.next);
    const v = await mutate((db2) => {
      if (user.role === "admin") {
        db2.profile.passwordHash = hash;
        db2.profile.sessionVersion = (db2.profile.sessionVersion ?? 1) + 1;
        return db2.profile.sessionVersion;
      }
      const e = db2.employees.find((x) => x.id === user.id)!;
      e.passwordHash = hash;
      return ++e.sessionVersion;
    });
    await startSession({ sub: user.id, role: user.role, v });
    return null;
  });
}

export async function signOutEverywhere() {
  return run(null, z.null(), null, async (_, user) => {
    await mutate((db) => {
      if (user.role === "admin") db.profile.sessionVersion = (db.profile.sessionVersion ?? 1) + 1;
      else db.employees.find((x) => x.id === user.id)!.sessionVersion++;
    });
    await endSession();
    return null;
  });
}

/** Removes every record marked as sample (orders, expenses, leads, sample team, tasks, notes, traffic). */
export async function clearSampleData() {
  return run("admin", z.null(), null, (_, user) =>
    mutate((db) => {
      const sampleTeam = new Set(db.employees.filter((e) => e.sample).map((e) => e.id));
      db.orders = db.orders.filter((x) => !x.sample);
      db.quotes = db.quotes.filter((x) => !x.sample);
      db.expenses = db.expenses.filter((x) => !x.sample);
      db.leads = db.leads.filter((x) => !x.sample);
      db.tasks = db.tasks.filter((x) => !x.sample && !sampleTeam.has(x.assignee));
      db.notes = db.notes.filter((x) => !x.sample && !sampleTeam.has(x.owner));
      db.leaves = db.leaves.filter((x) => !x.sample);
      db.employees = db.employees.filter((x) => !x.sample);
      db.contacts = db.contacts.filter((x) => !x.sample);
      db.mails = db.mails.filter((x) => !x.sample);
      db.reviews = db.reviews.filter((x) => !x.sample);
      // Real orders that were handed to a sample team member go back to the owner.
      for (const o of db.orders) if (o.assignee && sampleTeam.has(o.assignee)) o.assignee = "admin";
      db.sampleVisits = {};
      log(db, user.name, "cleared all sample data");
      return null;
    }),
  );
}

/** Full JSON backup (password hashes left out). */
export async function exportBackup() {
  return run("admin", z.null(), null, async () => {
    const db = structuredClone(await readDb());
    delete db.profile.passwordHash;
    db.employees.forEach((e) => ((e as { passwordHash?: string }).passwordHash = undefined));
    return JSON.stringify(db, null, 2);
  });
}

/** Clears the team chat history. */
export async function clearChat() {
  return run("admin", z.null(), null, (_, user) =>
    mutate((db) => {
      db.messages = [];
      log(db, user.name, "cleared the team chat");
      return null;
    }),
  );
}
