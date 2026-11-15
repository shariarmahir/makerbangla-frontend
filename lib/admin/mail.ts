import "server-only";
import { UserError } from "./action";

/**
 * Outgoing email. With RESEND_API_KEY and MAIL_FROM set (e.g. `Makerbangla <hello@makerbangla.com>`), messages are sent
 * from the server through Resend's HTTP API. Without them nothing leaves the server: the dashboard opens the user's
 * mail app with the message filled in, and the log records it as "opened in mail app".
 */
export const mailReady = () => !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

export async function sendMail({ to, subject, text, replyTo }: { to: string; subject: string; text: string; replyTo?: string }) {
  if (!mailReady()) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) throw new UserError("The email service didn't accept the message. Check the mail settings and try again.");
  return true;
}
