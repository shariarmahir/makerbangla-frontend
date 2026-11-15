"use server";

import { z } from "zod";
import { day, idOf, run, str, UserError } from "../action";
import { assertUser } from "../auth";
import { log, mutate, readDb, uid } from "../db";
import { noteColors, priorities, taskStatuses, type Message, type Task } from "../types";

/** Staff may only touch their own tasks; the super admin can touch all. */
const own = (task: Task, user: { id: string; role: string }) => user.role === "admin" || task.assignee === user.id;

const taskSchema = z.object({
  id: z.string().max(40).optional(),
  title: str(140, 3, "Task"),
  detail: str(600).optional(),
  priority: z.enum(priorities),
  assignee: z.string().max(40),
  due: z.union([z.literal(""), day]).optional(),
});

export async function saveTask(input: unknown) {
  return run(null, taskSchema, input, (d, user) =>
    mutate((db) => {
      // Staff can create tasks for themselves only.
      const assignee = user.role === "admin" ? d.assignee : user.id;
      if (assignee !== "admin" && !db.employees.some((e) => e.id === assignee)) throw new UserError("Pick who the task is for.");
      const existing = db.tasks.find((t) => t.id === d.id);
      if (existing) {
        if (!own(existing, user)) throw new UserError("You can only edit your own tasks.");
        Object.assign(existing, { title: d.title, detail: d.detail || undefined, priority: d.priority, assignee, due: d.due || undefined });
      } else {
        db.tasks.unshift({ id: uid("t"), createdAt: new Date().toISOString(), createdBy: user.id, title: d.title, detail: d.detail || undefined, priority: d.priority, status: "todo", assignee, due: d.due || undefined });
      }
      log(db, user.name, `${existing ? "updated" : "created"} task “${d.title}”`);
      return null;
    }),
  );
}

export async function moveTask(input: { id: string; status: string; submission?: string }) {
  return run(null, z.object({ id: idOf, status: z.enum(taskStatuses), submission: str(600).optional() }), input, ({ id, status, submission }, user) =>
    mutate((db) => {
      const t = db.tasks.find((x) => x.id === id);
      if (!t || !own(t, user)) throw new UserError("You can only update your own tasks.");
      // Team members submit work for review; the super admin approves it as done.
      if (status === "done" && user.role !== "admin" && t.assignee !== "admin" && t.createdBy !== user.id) throw new UserError("Submit it for review — the super admin will mark it done.");
      t.status = status;
      if (submission) t.submission = submission;
      log(db, user.name, `moved “${t.title}” to ${status}`);
      return null;
    }),
  );
}

export async function deleteTasks(input: { ids: string[] }) {
  return run(null, z.object({ ids: z.array(idOf).min(1).max(1000) }), input, ({ ids }, user) =>
    mutate((db) => {
      db.tasks = db.tasks.filter((t) => !(ids.includes(t.id) && own(t, user)));
      log(db, user.name, `deleted ${ids.length} task(s)`);
      return null;
    }),
  );
}

// ——— Calendar notes ———
export async function saveNote(input: unknown) {
  return run(null, z.object({ id: z.string().max(40).optional(), date: day, time: z.union([z.literal(""), z.string().regex(/^\d{2}:\d{2}$/)]).optional(), title: str(120, 2, "Note"), color: z.enum(noteColors), pinned: z.boolean() }), input, (d, user) =>
    mutate((db) => {
      const n = db.notes.find((x) => x.id === d.id && x.owner === user.id);
      const note = { ...d, time: d.time || undefined, id: n?.id ?? uid("n"), owner: user.id };
      if (n) Object.assign(n, note);
      else db.notes.push(note);
      return null;
    }),
  );
}

export async function toggleNotePin(input: { id: string }) {
  return run(null, z.object({ id: idOf }), input, ({ id }, user) =>
    mutate((db) => {
      const n = db.notes.find((x) => x.id === id && x.owner === user.id);
      if (n) n.pinned = !n.pinned;
      return null;
    }),
  );
}

export async function deleteNote(input: { id: string }) {
  return run(null, z.object({ id: idOf }), input, ({ id }, user) =>
    mutate((db) => {
      db.notes = db.notes.filter((n) => !(n.id === id && n.owner === user.id));
      return null;
    }),
  );
}

// ——— Team chat ———
/** Polled by the chat popup. Returns messages newer than `since` (ISO). */
export async function getMessages(since?: string): Promise<Message[]> {
  await assertUser();
  const db = await readDb();
  const s = typeof since === "string" && since.length < 40 ? since : "";
  return db.messages.filter((m) => m.at > s).slice(-80);
}

export async function sendMessage(input: { text: string }) {
  return run(null, z.object({ text: str(600, 1, "Message") }), input, ({ text }, user) =>
    mutate((db) => {
      const m: Message = { id: uid("m"), from: user.id, name: user.name, text, at: new Date().toISOString() };
      db.messages.push(m);
      if (db.messages.length > 400) db.messages.splice(0, db.messages.length - 400);
      return m;
    }),
  );
}
