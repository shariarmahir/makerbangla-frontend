"use server";

import { z } from "zod";
import { idOf, run, str, UserError } from "../action";
import { log, mutate, readDb, uid } from "../db";
import { sendMail } from "../mail";
import { contactStatuses, leadSources } from "../types";

// One line, no header injection.
const subject = str(160, 2, "Subject").refine((s) => !/[\r\n]/.test(s), "Keep the subject on one line.");
const body = str(5000, 2, "Message");
const ids = z.array(idOf).min(1).max(500);

/** Approve, mark as spam, archive or reopen website messages. */
export async function setContactStatus(input: { ids: string[]; status: string }) {
  return run("clients", z.object({ ids, status: z.enum(contactStatuses) }), input, ({ ids, status }, user) =>
    mutate((db) => {
      const hit = db.contacts.filter((c) => ids.includes(c.id));
      hit.forEach((c) => (c.status = status));
      log(db, user.name, `marked ${hit.length} message${hit.length === 1 ? "" : "s"} as ${status}`);
      return null;
    }),
  );
}

export async function deleteContacts(input: { ids: string[] }) {
  return run("clients", z.object({ ids }), input, ({ ids }, user) =>
    mutate((db) => {
      const before = db.contacts.length;
      db.contacts = db.contacts.filter((c) => !ids.includes(c.id));
      log(db, user.name, `deleted ${before - db.contacts.length} message(s)`);
      return null;
    }),
  );
}

/** Turns an approved message into a lead in Clients & leads. */
export async function contactToLead(input: { id: string; source: string }) {
  return run("clients", z.object({ id: idOf, source: z.enum(leadSources) }), input, ({ id, source }, user) =>
    mutate((db) => {
      const c = db.contacts.find((x) => x.id === id);
      if (!c) throw new UserError("That message no longer exists.");
      if (db.leads.some((l) => l.email === c.email)) throw new UserError("This person is already a lead.");
      db.leads.unshift({ id: uid("l"), createdAt: new Date().toISOString(), name: c.name, email: c.email, phone: c.phone, source, country: "Bangladesh", status: "contacted", approved: true, note: `${c.topic}: ${c.message.slice(0, 200)}` });
      if (c.status === "new") c.status = "approved";
      log(db, user.name, `added ${c.name} as a lead`);
      return null;
    }),
  );
}

/** Reply to a website message. Sent from the server when mail is configured; otherwise the client opens the mail app. */
export async function replyContact(input: { id: string; text: string }) {
  return run("clients", z.object({ id: idOf, text: body }), input, async ({ id, text }, user) => {
    const c = (await readDb()).contacts.find((x) => x.id === id);
    if (!c) throw new UserError("That message no longer exists.");
    if (c.status === "spam") throw new UserError("Move this message out of spam before replying.");
    const subj = `Re: ${c.topic} — Makerbangla`;
    const sent = await sendMail({ to: c.email, subject: subj, text });
    return mutate((db) => {
      const m = db.contacts.find((x) => x.id === id);
      if (m) {
        m.replies.push({ at: new Date().toISOString(), by: user.name, text, sent });
        m.status = "replied";
      }
      db.mails.unshift({ id: uid("ml"), at: new Date().toISOString(), by: user.name, to: c.email, subject: subj, text, sent, ref: c.id });
      db.mails.length = Math.min(db.mails.length, 500);
      log(db, user.name, `replied to ${c.name}`);
      return { sent, to: c.email, subject: subj };
    });
  });
}

/** New email to a customer, lead or anyone. */
export async function sendEmail(input: { to: string; subject: string; text: string; ref?: string }) {
  return run("clients", z.object({ to: z.email("Enter a valid email address.").max(254), subject, text: body, ref: str(40).optional() }), input, async ({ to, subject, text, ref }, user) => {
    const sent = await sendMail({ to, subject, text });
    return mutate((db) => {
      db.mails.unshift({ id: uid("ml"), at: new Date().toISOString(), by: user.name, to, subject, text, sent, ...(ref ? { ref } : {}) });
      db.mails.length = Math.min(db.mails.length, 500);
      log(db, user.name, `emailed ${to}`);
      return { sent, to, subject };
    });
  });
}

export async function clearMailLog() {
  return run("admin", z.null(), null, (_, user) =>
    mutate((db) => {
      db.mails = [];
      log(db, user.name, "cleared the sent-mail log");
      return null;
    }),
  );
}
