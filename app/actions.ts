"use server";

import { headers } from "next/headers";
import { mutate, readDb, uid } from "@/lib/admin/db";
import { contactTopics } from "@/lib/admin/types";
import { clientIp, limiter } from "@/lib/rate-limit";

const newsletterHits = limiter("newsletter", 5, 10 * 60_000);
const contactHits = limiter("contact", 5, 10 * 60_000);
const reviewHits = limiter("review", 3, 60 * 60_000);

export type SubscribeState = { ok: boolean; message: string } | null;

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;

export async function subscribe(_: SubscribeState, form: FormData): Promise<SubscribeState> {
  // Honeypot: bots fill every field.
  if (form.get("company")) return { ok: true, message: "Thanks for subscribing!" };

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!newsletterHits.take(clientIp(await headers()))) return { ok: false, message: "Please try again in a few minutes." };
  if (email.length > 254 || !EMAIL.test(email)) return { ok: false, message: "Please enter a valid email address." };

  const api = process.env.API_URL;
  if (!api) return { ok: false, message: "Newsletter sign-up opens soon — follow us on WhatsApp for updates." };

  try {
    const res = await fetch(new URL("/newsletter", api), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(String(res.status));
    return { ok: true, message: "Thanks for subscribing!" };
  } catch {
    return { ok: false, message: "We couldn't subscribe you right now. Please try again." };
  }
}

// ——— Contact form ———
export type ContactState = { ok: boolean; message: string; fields?: Record<string, string> } | null;

/** Website contact form → dashboard Inbox (waits for approval). 5 messages per IP per 10 minutes. */
export async function sendContact(_: ContactState, form: FormData): Promise<ContactState> {
  const get = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const fields = { name: get("name", 80), email: get("email", 254).toLowerCase(), phone: get("phone", 20), topic: get("topic", 40), message: get("message", 2000) };
  if (form.get("company")) return { ok: true, message: "Thanks! We'll get back to you soon." }; // honeypot

  const ip = clientIp(await headers());
  const now = Date.now();
  if (contactHits.blocked(ip, now)) return { ok: false, message: "You've sent a few messages already. Please call or WhatsApp us instead.", fields };

  if (fields.name.length < 2) return { ok: false, message: "Please enter your name.", fields };
  if (!EMAIL.test(fields.email)) return { ok: false, message: "Please enter a valid email address.", fields };
  if (fields.phone && !/^\+?[\d\s()-]{6,20}$/.test(fields.phone)) return { ok: false, message: "Please check the phone number.", fields };
  if (fields.message.length < 10) return { ok: false, message: "Please write a little more so we can help.", fields };
  const topic = (contactTopics as readonly string[]).includes(fields.topic) ? (fields.topic as (typeof contactTopics)[number]) : "Other";

  // Site-wide brake: forwarded IPs can be forged, so cap unapproved messages per hour too.
  const db = await readDb();
  if (db.contacts.filter((c) => c.status === "new" && now - Date.parse(c.createdAt) < 3_600_000).length >= 60) return { ok: false, message: "We're getting a lot of messages right now. Please call or WhatsApp us instead.", fields };
  contactHits.take(ip, now);

  await mutate((db) => {
    db.contacts.unshift({ id: uid("c"), createdAt: new Date().toISOString(), name: fields.name, email: fields.email, ...(fields.phone ? { phone: fields.phone } : {}), topic, message: fields.message, status: "new", replies: [] });
    db.contacts.length = Math.min(db.contacts.length, 2000);
  });
  return { ok: true, message: "Thanks! Your message is with our team — we usually reply within a working day." };
}

// ——— Reviews ———
export type ReviewState = { ok: boolean; message: string; fields?: Record<string, string> } | null;

/** Website review → dashboard (Inbox & email → Reviews). Nothing is shown publicly until the team approves it. */
export async function submitReview(_: ReviewState, form: FormData): Promise<ReviewState> {
  const get = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const fields = { name: get("name", 60), role: get("role", 60), rating: get("rating", 1), text: get("text", 800) };
  if (form.get("company")) return { ok: true, message: "Thank you for your review!" }; // honeypot

  const ip = clientIp(await headers());
  const now = Date.now();
  if (reviewHits.blocked(ip, now)) return { ok: false, message: "Thanks — you've already sent a review recently.", fields };

  const rating = Number(fields.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, message: "Tap the stars to give a rating.", fields };
  if (fields.name.length < 2) return { ok: false, message: "Please enter your name.", fields };
  if (fields.text.length < 15) return { ok: false, message: "Please write a sentence or two about your experience.", fields };

  const db = await readDb();
  if (db.reviews.filter((r) => r.status === "pending" && now - Date.parse(r.createdAt) < 3_600_000).length >= 40) return { ok: false, message: "We're getting a lot of reviews right now. Please try again later.", fields };
  reviewHits.take(ip, now);

  await mutate((d) => {
    d.reviews.unshift({ id: uid("r"), createdAt: new Date().toISOString(), name: fields.name, ...(fields.role ? { role: fields.role } : {}), rating: rating as 1 | 2 | 3 | 4 | 5, text: fields.text, status: "pending" });
    d.reviews.length = Math.min(d.reviews.length, 2000);
  });
  return { ok: true, message: "Thank you! Your review will appear once our team has checked it." };
}
