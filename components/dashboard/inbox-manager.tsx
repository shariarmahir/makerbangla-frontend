"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { contactToLead, clearMailLog, deleteContacts, replyContact, sendEmail, setContactStatus } from "@/lib/admin/actions/mail";
import { mailto } from "@/lib/admin/pdf";
import { leadSources, type Contact, type MailLog, type Review } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";
import { Btn, ConfirmButton, Field, input, textarea, toast, useAction } from "./kit";
import { ReviewsAdmin } from "./reviews-admin";
import { Avatar, Card, Empty, Pill, type PillTone } from "./ui";

/**
 * Inbox & email: website messages wait for approval (spam check), then the team replies. Replies and new emails are
 * sent from the server when mail is configured, otherwise they open in the user's mail app with everything filled in.
 */

type Recipient = { email: string; name: string };
type Exec = ReturnType<typeof useAction>["exec"];

const folders: { key: Contact["status"] | "all"; label: string; icon: IconName }[] = [
  { key: "new", label: "Needs approval", icon: "hourglass" },
  { key: "approved", label: "Approved", icon: "circle-check" },
  { key: "replied", label: "Replied", icon: "send" },
  { key: "spam", label: "Spam", icon: "ban" },
  { key: "archived", label: "Archived", icon: "archive" },
  { key: "all", label: "All", icon: "layers" },
];
const tone: Record<Contact["status"], PillTone> = { new: "pending", approved: "confirmed", replied: "delivered", spam: "cancelled", archived: "neutral" };

const templates: { name: string; subject: string; text: string }[] = [
  { name: "Order update", subject: "Your Makerbangla order update", text: "Hi {name},\n\nThank you for ordering from Makerbangla. Your order [order number] is being prepared and we'll share the courier tracking number as soon as it ships.\n\nYou can follow it any time at makerbangla.com/track\n\n— Team Makerbangla" },
  { name: "Payment reminder", subject: "Payment reminder from Makerbangla", text: "Hi {name},\n\nA friendly reminder that BDT [amount] is still due on order [order number]. You can pay by bKash, Nagad or cash on delivery.\n\nThank you!\n— Team Makerbangla" },
  { name: "Quotation follow-up", subject: "Your Makerbangla quotation", text: "Dear {name},\n\nFollowing up on the quotation we sent for your lab/project. The prices are held for 7 days — reply to this email to confirm or change quantities.\n\nBest regards,\nTeam Makerbangla" },
  { name: "In stock now", subject: "Good news — it's back in stock", text: "Hi {name},\n\nThe item you asked about is back in stock at Makerbangla. Reply to this email or order on makerbangla.com.\n\n— Team Makerbangla" },
  { name: "Thank you", subject: "Thank you from Makerbangla", text: "Hi {name},\n\nThank you for reaching out to Makerbangla. We're glad to help — let us know if you need anything else for your project.\n\n— Team Makerbangla" },
];
const fill = (t: string, name: string) => t.replaceAll("{name}", name.split(" ")[0] || "there");
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" });
/** Hands an unsent message to the user's mail app. */
const openMailApp = (to: string, subject: string, text: string) => window.open(mailto(to, subject, text), "_self");

export function InboxManager({ contacts, mails, reviews, recipients, mailReady, isAdmin }: { contacts: Contact[]; mails: MailLog[]; reviews: Review[]; recipients: Recipient[]; mailReady: boolean; isAdmin: boolean }) {
  const params = useSearchParams();
  const [tab, setTab] = useState<"inbox" | "compose" | "sent" | "reviews">(params.get("tab") === "reviews" ? "reviews" : "inbox");
  const { pending, exec } = useAction();
  const fresh = contacts.filter((c) => c.status === "new").length;
  const waiting = reviews.filter((r) => r.status === "pending").length;
  const tabs = [["inbox", `Inbox${fresh ? ` · ${fresh}` : ""}`, "mail-check"], ["reviews", `Reviews${waiting ? ` · ${waiting}` : ""}`, "sparkles"], ["compose", "Compose", "file-pen-line"], ["sent", `Sent · ${mails.length}`, "send"]] as const;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex flex-wrap rounded-2xl bg-white p-1 ring-1 ring-line">
          {tabs.map(([t, label, icon]) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-black transition-colors", tab === t ? "bg-tile-navy text-tile-yellow" : "text-subtle hover:text-ink")}>
              <Icon name={icon} className="size-4" /> {label}
            </button>
          ))}
        </div>
        <p className={cn("ml-auto flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-bold", mailReady ? "bg-tile-sky/50 text-tile-navy" : "bg-tile-butter/70 text-tile-navy")}>
          <span className={cn("size-2 rounded-full", mailReady ? "bg-brand" : "bg-tile-yellow ring-2 ring-tile-navy/20")} />
          {mailReady ? "Sending from the dashboard" : "Emails open in your mail app — add RESEND_API_KEY and MAIL_FROM to send from here"}
        </p>
      </div>
      {tab === "inbox" ? <Inbox contacts={contacts} exec={exec} pending={pending} /> : tab === "reviews" ? <ReviewsAdmin reviews={reviews} /> : tab === "compose" ? <Compose recipients={recipients} exec={exec} pending={pending} onSent={() => setTab("sent")} /> : <Sent mails={mails} exec={exec} isAdmin={isAdmin} />}
    </div>
  );
}

function Inbox({ contacts, exec, pending }: { contacts: Contact[]; exec: Exec; pending: boolean }) {
  const [folder, setFolder] = useState<Contact["status"] | "all">(contacts.some((c) => c.status === "new") ? "new" : "all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const s = q.trim().toLowerCase();
  const shown = useMemo(() => contacts.filter((c) => (folder === "all" ? c.status !== "spam" : c.status === folder) && (!s || `${c.name} ${c.email} ${c.topic} ${c.message}`.toLowerCase().includes(s))).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [contacts, folder, s]);
  const current = contacts.find((c) => c.id === open) ?? shown[0];
  const bulk = (status: Contact["status"], msg: string) => exec(() => setContactStatus({ ids: picked, status }), msg).then((r) => r.ok && setPicked([]));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
      <Card bodyClassName="flex flex-col">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {folders.map((f) => {
            const n = f.key === "all" ? contacts.filter((c) => c.status !== "spam").length : contacts.filter((c) => c.status === f.key).length;
            return (
              <button key={f.key} onClick={() => (setFolder(f.key), setPicked([]))} className={cn("flex h-8 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-black", folder === f.key ? "bg-tile-navy text-tile-yellow" : "bg-soft text-subtle hover:text-ink")}>
                <Icon name={f.icon} className="size-3.5" /> {f.label} <span className="tabular-nums opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
        <label className="relative mb-3 block">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" aria-label="Search messages" className={cn(input, "pl-9")} />
        </label>
        {picked.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-xl bg-tile-navy p-2 text-[12px] font-bold text-white">
            <span className="px-1">{picked.length} selected</span>
            <Btn size="sm" tone="accent" onClick={() => bulk("approved", "Approved")}><Icon name="check" className="size-3.5" /> Approve</Btn>
            <Btn size="sm" tone="soft" onClick={() => bulk("spam", "Moved to spam")}><Icon name="ban" className="size-3.5" /> Spam</Btn>
            <ConfirmButton label="Delete" onConfirm={() => exec(() => deleteContacts({ ids: picked }), "Deleted").then((r) => r.ok && setPicked([]))} className="ml-auto" />
          </div>
        )}
        {shown.length === 0 ? (
          <Empty>No messages here.</Empty>
        ) : (
          <ul className="-mx-2 space-y-1">
            {shown.map((c) => (
              <li key={c.id} className={cn("flex items-start gap-2 rounded-2xl p-2 transition-colors", current?.id === c.id ? "bg-tile-sky/45" : "hover:bg-soft")}>
                <input type="checkbox" aria-label={`Select message from ${c.name}`} checked={picked.includes(c.id)} onChange={() => setPicked((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))} className="mt-3 size-4 shrink-0 accent-[var(--color-tile-navy)]" />
                <button onClick={() => setOpen(c.id)} className="flex min-w-0 flex-1 items-start gap-2.5 text-left">
                  <Avatar name={c.name} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <b className={cn("truncate text-[13px] text-ink", c.status === "new" && "text-tile-navy")}>{c.name}</b>
                      <span className="ml-auto shrink-0 text-[10.5px] font-semibold text-subtle">{when(c.createdAt)}</span>
                    </span>
                    <span className="block truncate text-[11.5px] font-bold text-brand-strong">{c.topic}</span>
                    <span className="line-clamp-1 text-[11.5px] text-subtle">{c.message}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {current ? <Reader c={current} exec={exec} pending={pending} /> : <Card><Empty>Select a message to read it.</Empty></Card>}
    </div>
  );
}

function Reader({ c, exec, pending }: { c: Contact; exec: Exec; pending: boolean }) {
  const [text, setText] = useState("");
  const [lead, setLead] = useState<string>("website");
  const set = (status: Contact["status"], msg: string) => exec(() => setContactStatus({ ids: [c.id], status }), msg);
  return (
    <Card key={c.id} className="min-h-[520px]">
      <div className="flex flex-wrap items-start gap-3">
        <Avatar name={c.name} size={46} />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-black text-ink">{c.name}</p>
          <p className="text-[12.5px] font-semibold text-subtle">{c.email}{c.phone && ` · ${c.phone}`}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] font-bold text-subtle"><Pill tone={tone[c.status]}>{c.status === "new" ? "Needs approval" : c.status}</Pill>{c.topic} · {when(c.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {c.status === "new" && <Btn size="sm" tone="primary" disabled={pending} onClick={() => set("approved", "Contact approved")}><Icon name="check" className="size-3.5" /> Approve</Btn>}
          {c.status !== "spam" ? <Btn size="sm" tone="danger" disabled={pending} onClick={() => set("spam", "Moved to spam")}><Icon name="ban" className="size-3.5" /> Spam</Btn> : <Btn size="sm" tone="soft" disabled={pending} onClick={() => set("new", "Moved back to the inbox")}>Not spam</Btn>}
          {c.status !== "archived" && c.status !== "spam" && <Btn size="sm" tone="soft" disabled={pending} onClick={() => set("archived", "Archived")}><Icon name="archive" className="size-3.5" /> Archive</Btn>}
          <ConfirmButton size="icon" label="Delete message" onConfirm={() => exec(() => deleteContacts({ ids: [c.id] }), "Message deleted")} />
        </div>
      </div>

      <p className="mt-5 rounded-2xl bg-soft p-4 text-[13.5px] leading-relaxed whitespace-pre-wrap text-ink">{c.message}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
        {c.phone && <a href={`tel:${c.phone}`} className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-white px-2.5 font-bold text-tile-navy ring-1 ring-line hover:bg-tile-sky/50"><Icon name="phone" className="size-3.5 text-brand" /> Call</a>}
        {c.status !== "spam" && (
          <span className="flex items-center gap-1.5">
            <select value={lead} onChange={(e) => setLead(e.target.value)} aria-label="Lead source" className="h-8 rounded-xl bg-white px-2 font-bold text-ink ring-1 ring-line outline-none">
              {leadSources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Btn size="sm" tone="soft" disabled={pending} onClick={() => exec(() => contactToLead({ id: c.id, source: lead }), "Added to leads")}><Icon name="user-plus" className="size-3.5" /> Add as lead</Btn>
          </span>
        )}
      </div>

      {c.replies.length > 0 && (
        <ul className="mt-5 space-y-2">
          {c.replies.map((r, i) => (
            <li key={i} className="ml-6 rounded-2xl bg-tile-navy p-3.5 text-[13px] leading-relaxed text-white">
              <p className="mb-1 flex items-center gap-2 text-[11px] font-bold text-white/70">{r.by} · {when(r.at)} · {r.sent ? "sent" : "opened in mail app"}</p>
              <p className="whitespace-pre-wrap">{r.text}</p>
            </li>
          ))}
        </ul>
      )}

      {c.status !== "spam" && (
        <form
          className="mt-5 space-y-2 border-t border-line pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await exec(() => replyContact({ id: c.id, text }));
            if (!r.ok) return;
            setText("");
            if (r.data.sent) return toast("Reply sent");
            toast("Opening your mail app…");
            openMailApp(r.data.to, r.data.subject, text);
          }}
        >
          <div className="flex flex-wrap gap-1.5">
            {templates.map((t) => <button key={t.name} type="button" onClick={() => setText(fill(t.text, c.name))} className="h-7 rounded-full bg-soft px-2.5 text-[11.5px] font-bold text-ink hover:bg-tile-sky/60">{t.name}</button>)}
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} required minLength={2} maxLength={5000} rows={5} placeholder={`Reply to ${c.name.split(" ")[0]}…`} aria-label="Reply" className={textarea} />
          <div className="flex justify-end"><Btn type="submit" tone="primary" disabled={pending || text.trim().length < 2}><Icon name="send" className="size-4" /> Send reply</Btn></div>
        </form>
      )}
    </Card>
  );
}

function Compose({ recipients, exec, pending, onSent }: { recipients: Recipient[]; exec: Exec; pending: boolean; onSent: () => void }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const name = recipients.find((r) => r.email === to.trim().toLowerCase())?.name ?? "";
  return (
    <Card icon="file-pen-line" title="New email" className="max-w-3xl">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await exec(() => sendEmail({ to: to.trim(), subject, text }));
          if (!r.ok) return;
          if (r.data.sent) toast("Email sent");
          else {
            toast("Opening your mail app…");
            openMailApp(r.data.to, r.data.subject, text);
          }
          setTo("");
          setSubject("");
          setText("");
          onSent();
        }}
      >
        <Field label="To" hint="Type an email, or pick a customer or lead.">
          <input value={to} onChange={(e) => setTo(e.target.value)} type="email" required list="mb-recipients" maxLength={254} className={input} placeholder="name@example.com" />
          <datalist id="mb-recipients">{recipients.map((r) => <option key={r.email} value={r.email}>{r.name}</option>)}</datalist>
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {templates.map((t) => <button key={t.name} type="button" onClick={() => (setSubject(t.subject), setText(fill(t.text, name)))} className="h-7 rounded-full bg-soft px-2.5 text-[11.5px] font-bold text-ink hover:bg-tile-sky/60">{t.name}</button>)}
        </div>
        <Field label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={160} className={input} /></Field>
        <Field label="Message"><textarea value={text} onChange={(e) => setText(e.target.value)} required maxLength={5000} rows={10} className={textarea} /></Field>
        <div className="flex justify-end"><Btn type="submit" tone="primary" disabled={pending}><Icon name="send" className="size-4" /> Send email</Btn></div>
      </form>
    </Card>
  );
}

function Sent({ mails, exec, isAdmin }: { mails: MailLog[]; exec: Exec; isAdmin: boolean }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const s = q.trim().toLowerCase();
  const shown = mails.filter((m) => !s || `${m.to} ${m.subject} ${m.text}`.toLowerCase().includes(s));
  return (
    <Card icon="send" title="Sent mail" action={isAdmin && mails.length > 0 && <ConfirmButton label="Clear log" confirm="Clear all" onConfirm={() => exec(() => clearMailLog(), "Log cleared")} />}>
      <label className="relative mb-3 block max-w-sm">
        <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sent mail" aria-label="Search sent mail" className={cn(input, "pl-9")} />
      </label>
      {shown.length === 0 ? (
        <Empty>Nothing sent yet. Replies and emails you send show up here.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {shown.map((m) => (
            <li key={m.id}>
              <button onClick={() => setOpen(open === m.id ? null : m.id)} className="flex w-full items-center gap-3 py-2.5 text-left text-[12.5px] hover:bg-soft/60">
                <Avatar name={m.to} size={30} />
                <span className="min-w-0 flex-1"><b className="block truncate text-ink">{m.subject}</b><span className="block truncate text-subtle">To {m.to} · by {m.by}</span></span>
                <Pill tone={m.sent ? "delivered" : "pending"}>{m.sent ? "Sent" : "Mail app"}</Pill>
                <span className="hidden shrink-0 text-[11px] font-semibold text-subtle sm:block">{when(m.at)}</span>
              </button>
              {open === m.id && (
                <div className="mb-3 rounded-2xl bg-soft p-3.5">
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-ink">{m.text}</p>
                  {!m.sent && <Btn size="sm" tone="primary" className="mt-3" onClick={() => openMailApp(m.to, m.subject, m.text)}><Icon name="send" className="size-3.5" /> Open in mail app again</Btn>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
