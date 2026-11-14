"use server";

export type SubscribeState = { ok: boolean; message: string } | null;

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;

export async function subscribe(_: SubscribeState, form: FormData): Promise<SubscribeState> {
  // Honeypot: bots fill every field.
  if (form.get("company")) return { ok: true, message: "Thanks for subscribing!" };

  const email = String(form.get("email") ?? "").trim().toLowerCase();
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
