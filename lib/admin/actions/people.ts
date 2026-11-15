"use server";

import { z } from "zod";
import { day, idOf, mediaOrPath, money, run, str, UserError } from "../action";
import { adminEmail } from "../admin-account";
import { log, mutate, uid } from "../db";
import { generatePassword, hashPassword } from "../session";
import { expenseCategories, leadSources, leadStatuses, sections, type Section } from "../types";

// ——— Expenses (finance) ———
export async function addExpense(input: unknown) {
  return run("finance", z.object({ date: day, category: z.enum(expenseCategories), note: str(120), amount: money.min(1, "Enter an amount.") }), input, (d, user) =>
    mutate((db) => {
      db.expenses.unshift({ id: uid("e"), ...d });
      log(db, user.name, `added expense BDT ${d.amount.toLocaleString("en-IN")} (${d.category})`);
      return null;
    }),
  );
}

export async function deleteExpenses(input: { ids: string[] }) {
  return run("finance", z.object({ ids: z.array(idOf).min(1).max(2000) }), input, ({ ids }, user) =>
    mutate((db) => {
      db.expenses = db.expenses.filter((e) => !ids.includes(e.id));
      log(db, user.name, `deleted ${ids.length} expense(s)`);
      return null;
    }),
  );
}

// ——— Leads (clients) ———
const leadSchema = z.object({
  id: z.string().max(40).optional(),
  name: str(80, 2, "Name"),
  email: z.union([z.literal(""), z.email("Enter a valid email.")]).optional(),
  phone: str(20).optional(),
  org: str(80).optional(),
  source: z.enum(leadSources),
  country: str(60, 2, "Country"),
  status: z.enum(leadStatuses),
  value: z.union([z.literal(""), money]).optional().transform((v) => (v === "" ? undefined : v)),
  note: str(300).optional(),
});

export async function saveLead(input: unknown) {
  return run("clients", leadSchema, input, (d, user) =>
    mutate((db) => {
      const existing = db.leads.find((l) => l.id === d.id);
      const lead = { ...d, email: d.email || undefined, id: existing?.id ?? uid("l"), createdAt: existing?.createdAt ?? new Date().toISOString(), approved: existing?.approved ?? false };
      if (existing) Object.assign(existing, lead);
      else db.leads.unshift(lead);
      log(db, user.name, `${existing ? "updated" : "added"} lead ${d.name}`);
      return null;
    }),
  );
}

export async function updateLead(input: { id: string; approved?: boolean; status?: string }) {
  return run("clients", z.object({ id: idOf, approved: z.boolean().optional(), status: z.enum(leadStatuses).optional() }), input, ({ id, approved, status }, user) =>
    mutate((db) => {
      const l = db.leads.find((x) => x.id === id);
      if (!l) throw new UserError("That lead no longer exists.");
      if (approved !== undefined) l.approved = approved;
      if (status) l.status = status;
      log(db, user.name, `updated lead ${l.name}`);
      return null;
    }),
  );
}

export async function deleteLeads(input: { ids: string[] }) {
  return run("clients", z.object({ ids: z.array(idOf).min(1).max(2000) }), input, ({ ids }, user) =>
    mutate((db) => {
      db.leads = db.leads.filter((l) => !ids.includes(l.id));
      log(db, user.name, `deleted ${ids.length} lead(s)`);
      return null;
    }),
  );
}

// ——— Team (super admin only) ———
const access = z.array(z.enum(Object.keys(sections) as [Section, ...Section[]])).max(10);
const employeeSchema = z.object({
  id: z.string().max(40).optional(),
  name: str(80, 2, "Name"),
  designation: str(80, 2, "Designation"),
  email: z.email("Enter a valid email."),
  phone: str(20, 6, "Phone"),
  photo: z.union([z.literal(""), mediaOrPath]).optional(),
  access,
});

/** Creates or edits an employee. New accounts get a username and a one-time password that is shown once. */
export async function saveEmployee(input: unknown) {
  return run("admin", employeeSchema, input, async (d, user) => {
    const password = d.id ? null : generatePassword();
    const hash = password ? await hashPassword(password) : null;
    return mutate((db) => {
      const email = d.email.toLowerCase();
      if (db.employees.some((e) => e.email.toLowerCase() === email && e.id !== d.id) || email === adminEmail) throw new UserError("That email is already used by another account.");
      const existing = db.employees.find((e) => e.id === d.id);
      if (existing) {
        Object.assign(existing, { name: d.name, designation: d.designation, email, phone: d.phone, access: d.access, photo: d.photo || undefined });
        log(db, user.name, `updated ${d.name}'s profile`);
        return null;
      }
      const base = d.name.toLowerCase().normalize("NFKD").replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "").split(".").slice(0, 2).join(".") || "member";
      let username = `${base}.mb`;
      for (let i = 2; db.employees.some((e) => e.username === username); i++) username = `${base}${i}.mb`;
      db.employees.push({ id: uid("emp"), username, name: d.name, designation: d.designation, email, phone: d.phone, photo: d.photo || undefined, access: d.access, passwordHash: hash!, sessionVersion: 1, active: true, createdAt: new Date().toISOString() });
      log(db, user.name, `added team member ${d.name} (${username})`);
      return { username, password: password! };
    });
  });
}

export async function resetEmployeePassword(input: { id: string }) {
  return run("admin", z.object({ id: idOf }), input, async ({ id }, user) => {
    const password = generatePassword();
    const hash = await hashPassword(password);
    return mutate((db) => {
      const e = db.employees.find((x) => x.id === id);
      if (!e) throw new UserError("That team member no longer exists.");
      e.passwordHash = hash;
      e.sessionVersion++;
      log(db, user.name, `reset ${e.name}'s password`);
      return { username: e.username, password };
    });
  });
}

export async function setEmployeeActive(input: { id: string; active: boolean }) {
  return run("admin", z.object({ id: idOf, active: z.boolean() }), input, ({ id, active }, user) =>
    mutate((db) => {
      const e = db.employees.find((x) => x.id === id);
      if (!e) throw new UserError("That team member no longer exists.");
      e.active = active;
      e.sessionVersion++;
      log(db, user.name, `${active ? "re-activated" : "paused"} ${e.name}'s account`);
      return null;
    }),
  );
}

/** Removes the account (e.g. after leaving the company). Their tasks move back to the super admin. */
export async function deleteEmployee(input: { id: string }) {
  return run("admin", z.object({ id: idOf }), input, ({ id }, user) =>
    mutate((db) => {
      const e = db.employees.find((x) => x.id === id);
      if (!e) throw new UserError("That team member no longer exists.");
      db.employees = db.employees.filter((x) => x.id !== id);
      db.tasks.forEach((t) => t.assignee === id && (t.assignee = "admin"));
      db.leaves = db.leaves.filter((l) => l.employeeId !== id);
      db.notes = db.notes.filter((n) => n.owner !== id);
      log(db, user.name, `removed ${e.name}'s account`);
      return null;
    }),
  );
}

// ——— Leave ———
export async function requestLeave(input: unknown) {
  return run(null, z.object({ from: day, to: day, reason: str(200, 3, "Reason") }).refine((d) => d.to >= d.from, { message: "The end date is before the start date." }), input, (d, user) =>
    mutate((db) => {
      if (user.role !== "staff") throw new UserError("Leave requests are for team members.");
      db.leaves.unshift({ id: uid("lv"), employeeId: user.id, ...d, status: "pending", createdAt: new Date().toISOString() });
      log(db, user.name, `requested leave ${d.from} → ${d.to}`);
      return null;
    }),
  );
}

export async function decideLeave(input: { id: string; status: string }) {
  return run("admin", z.object({ id: idOf, status: z.enum(["approved", "rejected"]) }), input, ({ id, status }, user) =>
    mutate((db) => {
      const l = db.leaves.find((x) => x.id === id);
      if (!l) throw new UserError("That request no longer exists.");
      l.status = status;
      log(db, user.name, `${status} a leave request`);
      return null;
    }),
  );
}
