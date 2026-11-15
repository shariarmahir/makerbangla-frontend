"use client";

import { useActionState } from "react";
import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import { sendContact, type ContactState } from "@/app/actions";
import { MagicButton } from "@/components/ui/magic-button";
import { contactTopics } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const field = "h-12 w-full rounded-xl bg-soft px-4 text-[14px] font-semibold text-ink ring-1 ring-line outline-none transition-shadow placeholder:font-medium placeholder:text-subtle/70 focus:bg-white focus:ring-2 focus:ring-brand";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, null);
  if (state?.ok)
    return (
      <div role="status" className="grid place-items-center gap-3 rounded-[22px] bg-tile-sky/40 p-10 text-center">
        <CircleCheck className="size-10 text-tile-navy" />
        <p className="max-w-sm text-[15px] font-bold text-tile-navy">{state.message}</p>
      </div>
    );
  const f = state?.fields;
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <label className="block">
        <span className="mb-1.5 block text-[12.5px] font-bold text-ink">Your name</span>
        <input name="name" required maxLength={80} defaultValue={f?.name} autoComplete="name" className={field} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[12.5px] font-bold text-ink">Email</span>
        <input name="email" type="email" required maxLength={254} defaultValue={f?.email} autoComplete="email" className={field} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[12.5px] font-bold text-ink">Phone <span className="font-medium text-subtle">(optional)</span></span>
        <input name="phone" type="tel" maxLength={20} defaultValue={f?.phone} autoComplete="tel" placeholder="01XXXXXXXXX" className={field} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[12.5px] font-bold text-ink">Topic</span>
        <select name="topic" defaultValue={f?.topic ?? contactTopics[1]} className={field}>
          {contactTopics.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-[12.5px] font-bold text-ink">Message</span>
        <textarea name="message" required minLength={10} maxLength={2000} rows={5} defaultValue={f?.message} className={cn(field, "h-auto py-3 leading-relaxed")} placeholder="Parts list, order number, or what you're building…" />
      </label>
      {/* Honeypot for bots — hidden from people and screen readers */}
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />
      <p role="alert" aria-live="polite" className="min-h-5 text-[12.5px] font-bold text-sale sm:col-span-2">{state?.message}</p>
      <div className="sm:col-span-2">
        <MagicButton type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
          {pending ? "Sending…" : "Send message"}
        </MagicButton>
      </div>
    </form>
  );
}
