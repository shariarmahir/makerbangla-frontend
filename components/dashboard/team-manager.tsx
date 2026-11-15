"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Mail, Pause, Pencil, Phone, Play, UserPlus, X } from "lucide-react";
import { decideLeave, deleteEmployee, resetEmployeePassword, saveEmployee, setEmployeeActive } from "@/lib/admin/actions/people";
import { sections, type Leave, type Section } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { ImagePicker } from "./image-picker";
import { Btn, ConfirmButton, Field, input, Modal, toast, useAction } from "./kit";
import { Avatar, Card, Empty, Pill } from "./ui";

export type Member = { id: string; username: string; name: string; designation: string; email: string; phone: string; photo?: string; access: Section[]; active: boolean; lastLogin?: string; open: number; done: number; sample?: boolean };

const ago = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" }) : "Never signed in");

/** Team: create accounts (username + one-time password), set access, reset passwords, pause or remove, approve leave. */
export function TeamManager({ members, leaves }: { members: Member[]; leaves: (Leave & { name: string; photo?: string })[] }) {
  const { pending, exec } = useAction();
  const [edit, setEdit] = useState<Partial<Member> | null>(null);
  const [creds, setCreds] = useState<{ username: string; password: string; title: string } | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Btn tone="primary" onClick={() => setEdit({ access: [] })}><UserPlus className="size-4" /> Add team member</Btn>
        <p className="text-[12.5px] font-semibold text-subtle">Each member signs in at /account with their username (or email) and password.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {members.length === 0 && <Empty>No team members yet.</Empty>}
        {members.map((m) => (
          <article key={m.id} className={cn("dash-rise flex flex-col rounded-[22px] bg-white p-5 ring-1 ring-line", !m.active && "opacity-70")}>
            <div className="flex items-start gap-3.5">
              <Avatar name={m.name} photo={m.photo} size={56} className="ring-tile-sky" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-black text-ink">{m.name}</p>
                <p className="truncate text-[12.5px] font-semibold text-brand-strong">{m.designation}</p>
                <p className="mt-0.5 text-[11.5px] font-bold text-subtle">@{m.username}</p>
              </div>
              <Pill tone={m.active ? "delivered" : "neutral"}>{m.active ? "Active" : "Paused"}</Pill>
            </div>
            <ul className="mt-4 space-y-1 text-[12px] text-subtle">
              <li className="flex items-center gap-2"><Mail className="size-3.5 text-brand" /><span className="truncate">{m.email}</span></li>
              <li className="flex items-center gap-2"><Phone className="size-3.5 text-brand" />{m.phone}</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-1">
              {m.access.map((a) => <span key={a} className="rounded-full bg-tile-sky/60 px-2 py-0.5 text-[10.5px] font-black text-tile-navy">{sections[a]}</span>)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-soft p-3 text-center">
              <p><b className="block text-[17px] text-ink tabular-nums">{m.open}</b><span className="text-[11px] font-bold text-subtle">open tasks</span></p>
              <p><b className="block text-[17px] text-ink tabular-nums">{m.done}</b><span className="text-[11px] font-bold text-subtle">done</span></p>
            </div>
            <p className="mt-3 text-[11px] font-semibold text-subtle">Last sign-in: {ago(m.lastLogin)}{m.sample && " · sample member"}</p>
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
              <Btn size="sm" tone="soft" onClick={() => setEdit(m)}><Pencil className="size-3.5" /> Edit</Btn>
              <Btn size="sm" tone="soft" disabled={pending} onClick={() => exec(() => resetEmployeePassword({ id: m.id })).then((r) => r.ok && setCreds({ ...r.data, title: `New password for ${m.name}` }))}><KeyRound className="size-3.5" /> Reset password</Btn>
              <Btn size="sm" tone="soft" disabled={pending} onClick={() => exec(() => setEmployeeActive({ id: m.id, active: !m.active }), m.active ? "Account paused" : "Account active")}>{m.active ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}{m.active ? "Pause" : "Activate"}</Btn>
              <ConfirmButton size="icon" label={`Remove ${m.name}`} confirm="Remove" onConfirm={() => exec(() => deleteEmployee({ id: m.id }), "Account removed")} className="ml-auto" />
            </div>
          </article>
        ))}
      </div>

      <Card title="Leave requests">
        {leaves.length === 0 ? (
          <Empty>No leave requests.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {leaves.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar name={l.name} photo={l.photo} size={36} />
                <span className="min-w-0 flex-1">
                  <b className="block text-[13px] text-ink">{l.name}</b>
                  <span className="text-[12px] text-subtle">{l.from}{l.to !== l.from && ` → ${l.to}`} · {l.reason}</span>
                </span>
                {l.status === "pending" ? (
                  <span className="flex gap-1.5">
                    <Btn size="sm" tone="primary" disabled={pending} onClick={() => exec(() => decideLeave({ id: l.id, status: "approved" }), "Leave approved")}><Check className="size-3.5" /> Approve</Btn>
                    <Btn size="sm" tone="danger" disabled={pending} onClick={() => exec(() => decideLeave({ id: l.id, status: "rejected" }), "Leave declined")}><X className="size-3.5" /> Decline</Btn>
                  </span>
                ) : (
                  <Pill tone={l.status === "approved" ? "delivered" : "cancelled"}>{l.status}</Pill>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? `Edit ${edit.name}` : "Add team member"} wide>
        {edit && <MemberForm key={edit.id ?? "new"} m={edit} pending={pending} onCancel={() => setEdit(null)} onSave={(d) => exec(() => saveEmployee(d), edit.id ? "Profile updated" : undefined).then((r) => {
          if (!r.ok) return;
          setEdit(null);
          if (r.data) setCreds({ ...r.data, title: "Account created — share these sign-in details" });
        })} />}
      </Modal>

      <Modal open={!!creds} onOpenChange={(o) => !o && setCreds(null)} title={creds?.title ?? ""}>
        {creds && (
          <div className="space-y-3">
            {[["Username", creds.username], ["Password", creds.password]].map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 rounded-2xl bg-soft p-3.5">
                <span className="min-w-0 flex-1"><span className="block text-[11px] font-black tracking-wide text-subtle uppercase">{k}</span><code className="text-[15px] font-black text-ink">{v}</code></span>
                <Btn size="sm" tone="ghost" onClick={() => navigator.clipboard.writeText(v).then(() => toast(`${k} copied`))}><Copy className="size-3.5" /> Copy</Btn>
              </div>
            ))}
            <p className="rounded-xl bg-tile-butter/70 px-3 py-2 text-[12px] font-semibold text-tile-navy">This password is shown once. They can change it in Settings after signing in.</p>
            <div className="flex justify-end"><Btn tone="primary" onClick={() => setCreds(null)}>Done</Btn></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function MemberForm({ m, pending, onSave, onCancel }: { m: Partial<Member>; pending: boolean; onSave: (d: unknown) => void; onCancel: () => void }) {
  const [photo, setPhoto] = useState(m.photo ?? "");
  const [access, setAccess] = useState<Section[]>(m.access ?? []);
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...Object.fromEntries(new FormData(e.currentTarget)), id: m.id, access, photo });
      }}
    >
      <Field label="Profile picture" className="sm:col-span-2"><ImagePicker name="photo" value={photo} onChange={setPhoto} round /></Field>
      <Field label="Full name"><input name="name" required maxLength={80} defaultValue={m.name} className={input} /></Field>
      <Field label="Designation"><input name="designation" required maxLength={80} defaultValue={m.designation} placeholder="e.g. Sales Executive" className={input} /></Field>
      <Field label="Email"><input name="email" type="email" required defaultValue={m.email} className={input} /></Field>
      <Field label="Employee phone"><input name="phone" required maxLength={20} defaultValue={m.phone} className={input} /></Field>
      <fieldset className="sm:col-span-2">
        <legend className="mb-2 text-[11.5px] font-black tracking-wide text-subtle uppercase">Access</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.keys(sections) as Section[]).map((s) => (
            <label key={s} className={cn("flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[12.5px] font-bold ring-1 transition-colors", access.includes(s) ? "bg-tile-navy text-tile-yellow ring-tile-navy" : "bg-white text-ink ring-line hover:bg-soft")}>
              <input type="checkbox" checked={access.includes(s)} onChange={() => setAccess((a) => (a.includes(s) ? a.filter((x) => x !== s) : [...a, s]))} className="sr-only" />
              <Check className={cn("size-3.5", !access.includes(s) && "opacity-0")} />
              {sections[s]}
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11.5px] text-subtle">Everyone gets their own tasks, calendar, leave and chat. Team settings stay with the super admin.</p>
      </fieldset>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Btn onClick={onCancel}>Cancel</Btn>
        <Btn type="submit" tone="primary" disabled={pending}>{m.id ? "Save" : "Create account"}</Btn>
      </div>
    </form>
  );
}
