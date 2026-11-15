"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Download, Mail, MessageCircle, Pencil, Plus, Search } from "lucide-react";
import { deleteLeads, saveLead, updateLead } from "@/lib/admin/actions/people";
import { mailto } from "@/lib/admin/pdf";
import { leadSources, leadStatuses, type Lead } from "@/lib/admin/types";
import { bdt, cn } from "@/lib/utils";
import { Bars, Donut, Legend, LineChart } from "./charts";
import { palette, seriesColors } from "./palette";
import { Btn, ConfirmButton, download, Field, input, Modal, textarea, toCsv, useAction } from "./kit";
import { Avatar, Card, Empty } from "./ui";

export type TrafficData = { labels: string[]; visits: number[]; views: number[]; totalVisits: number; totalViews: number; returning: number; sources: [string, number][]; countries: [string, number][] };

const label = (s: string) => ({ facebook: "Facebook", youtube: "YouTube", google: "Google search", instagram: "Instagram", whatsapp: "WhatsApp", direct: "Direct / typed", other: "Other websites", website: "Website form", referral: "Referral" })[s] ?? s;
const compact = (n: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/** Traffic panel with a 7 / 30 / 90-day switch (all three ranges come from the server). */
export function TrafficPanel({ ranges }: { ranges: Record<"7" | "30" | "90", TrafficData> }) {
  const [r, setR] = useState<"7" | "30" | "90">("30");
  const t = ranges[r];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl bg-white p-1 ring-1 ring-line">
          {(["7", "30", "90"] as const).map((k) => (
            <button key={k} onClick={() => setR(k)} aria-pressed={r === k} className={cn("h-8 rounded-lg px-3.5 text-[12.5px] font-black", r === k ? "bg-tile-navy text-tile-yellow" : "text-subtle hover:text-ink")}>{k} days</button>
          ))}
        </div>
        <dl className="ml-auto flex flex-wrap gap-2">
          {[["Visits", compact(t.totalVisits)], ["Page views", compact(t.totalViews)], ["Pages / visit", t.totalVisits ? (t.totalViews / t.totalVisits).toFixed(1) : "0"], ["Returning", `${t.totalVisits ? Math.round((t.returning / t.totalVisits) * 100) : 0}%`]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white px-3.5 py-2 ring-1 ring-line"><dt className="text-[10.5px] font-black tracking-wide text-subtle uppercase">{k}</dt><dd className="text-[16px] font-black text-ink tabular-nums">{v}</dd></div>
          ))}
        </dl>
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card key={`l${r}`} title="Daily visits" action={<Legend items={[{ name: "Visits", color: palette.blue }, { name: "Page views", color: palette.yellow }]} />}>
          <LineChart labels={t.labels} series={[{ name: "Visits", color: palette.blue, values: t.visits }, { name: "Page views", color: palette.yellow, values: t.views }]} format="compact" height={260} />
        </Card>
        <Card key={`s${r}`} title="Where visitors come from">
          <div className="flex flex-col items-center gap-4">
            <Donut data={t.sources.map(([s, v], i) => ({ label: label(s), value: v, color: seriesColors[i % seriesColors.length] }))} center={compact(t.totalVisits)} sub="visits" size={170} />
            <Bars items={t.sources.slice(0, 6).map(([s, v], i) => ({ label: label(s), value: v, note: `${Math.round((v / (t.totalVisits || 1)) * 100)}%`, color: seriesColors[i % seriesColors.length] }))} />
          </div>
        </Card>
      </div>
      <Card key={`c${r}`} title="Visits by country">
        <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          <Bars items={t.countries.slice(0, 5).map(([c, v], i) => ({ label: c, value: v, max: t.countries[0]?.[1], note: `${compact(v)} · ${Math.round((v / (t.totalVisits || 1)) * 100)}%`, color: seriesColors[i % seriesColors.length] }))} />
          <Bars items={t.countries.slice(5, 10).map(([c, v], i) => ({ label: c, value: v, max: t.countries[0]?.[1], note: `${compact(v)} · ${Math.round((v / (t.totalVisits || 1)) * 100)}%`, color: seriesColors[(i + 5) % seriesColors.length] }))} />
        </div>
        {t.countries.length === 0 && <Empty>Country data appears once the site is hosted behind a provider that sends a country header (Vercel or Cloudflare).</Empty>}
      </Card>
    </div>
  );
}

const stageClass: Record<Lead["status"], string> = { new: "bg-tile-butter text-tile-navy", contacted: "bg-tile-sky text-tile-navy", qualified: "bg-brand/15 text-brand-strong", won: "bg-tile-navy text-tile-yellow", lost: "bg-tile-coral/12 text-sale" };

/** Leads: add/edit, approve, move through the funnel, contact, export, delete. */
export function LeadsManager({ leads }: { leads: Lead[] }) {
  const { pending, exec } = useAction();
  const [q, setQ] = useState("");
  const [src, setSrc] = useState("all");
  const [st, setSt] = useState("all");
  const [picked, setPicked] = useState<string[]>([]);
  const [edit, setEdit] = useState<Partial<Lead> | null>(null);
  const shown = useMemo(() => leads.filter((l) => (src === "all" || l.source === src) && (st === "all" || l.status === st) && (!q || `${l.name} ${l.email} ${l.phone} ${l.org} ${l.country}`.toLowerCase().includes(q.toLowerCase()))), [leads, q, src, st]);

  return (
    <Card
      title="Leads"
      action={
        <span className="flex gap-1.5">
          <Btn size="sm" onClick={() => download("leads.csv", toCsv([["Name", "Email", "Phone", "Organisation", "Source", "Country", "Status", "Approved", "Value", "Note", "Created"], ...shown.map((l) => [l.name, l.email, l.phone, l.org, l.source, l.country, l.status, l.approved ? "yes" : "no", l.value, l.note, l.createdAt.slice(0, 10)])]))}><Download className="size-3.5 text-brand" /> CSV</Btn>
          <Btn size="sm" tone="primary" onClick={() => setEdit({ source: "facebook", status: "new", country: "Bangladesh" })}><Plus className="size-3.5" /> Add lead</Btn>
        </span>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <label className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads" aria-label="Search leads" className={cn(input, "pl-9")} />
        </label>
        <select value={src} onChange={(e) => setSrc(e.target.value)} aria-label="Source" className={cn(input, "w-auto")}><option value="all">All platforms</option>{leadSources.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
        <select value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status" className={cn(input, "w-auto capitalize")}><option value="all">All stages</option>{leadStatuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        {picked.length > 0 && <ConfirmButton label={`Delete ${picked.length}`} confirm="Confirm delete" onConfirm={() => exec(() => deleteLeads({ ids: picked }), "Leads deleted").then((r) => r.ok && setPicked([]))} />}
      </div>
      {shown.length === 0 ? (
        <Empty>No leads match.</Empty>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[900px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-[11px] font-black tracking-wide text-subtle uppercase [&>th]:px-2 [&>th]:pb-2.5">
                <th className="w-8 !pl-0" /><th>Lead</th><th>Platform</th><th>Country</th><th>Value</th><th>Stage</th><th>Approval</th><th className="text-right">Contact</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 200).map((l) => (
                <tr key={l.id} className="border-b border-line/70 last:border-0 hover:bg-soft/50 [&>td]:px-2 [&>td]:py-2.5">
                  <td className="!pl-0"><input type="checkbox" aria-label={`Select ${l.name}`} checked={picked.includes(l.id)} onChange={() => setPicked((s) => (s.includes(l.id) ? s.filter((x) => x !== l.id) : [...s, l.id]))} className="size-4 accent-[var(--color-tile-navy)]" /></td>
                  <td>
                    <span className="flex items-center gap-2">
                      <Avatar name={l.name} size={30} />
                      <span className="min-w-0"><b className="block text-ink">{l.name}</b><span className="block max-w-56 truncate text-[11px] text-subtle">{[l.org, l.note].filter(Boolean).join(" · ") || l.email}</span></span>
                    </span>
                  </td>
                  <td className="font-semibold text-ink">{label(l.source)}</td>
                  <td className="text-subtle">{l.country}</td>
                  <td className="font-bold tabular-nums">{l.value ? bdt(l.value) : "—"}</td>
                  <td>
                    <select value={l.status} onChange={(e) => exec(() => updateLead({ id: l.id, status: e.target.value }), "Stage updated")} aria-label={`Stage for ${l.name}`} className={cn("h-7 cursor-pointer rounded-full px-2.5 text-[10.5px] font-black tracking-wide uppercase outline-none focus-visible:ring-2 focus-visible:ring-brand", stageClass[l.status])}>
                      {leadStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    {l.approved ? (
                      <button onClick={() => exec(() => updateLead({ id: l.id, approved: false }))} className="inline-flex items-center gap-1 text-[11.5px] font-black text-tile-navy"><BadgeCheck className="size-4 text-brand" /> Approved</button>
                    ) : (
                      <Btn size="sm" tone="accent" disabled={pending} onClick={() => exec(() => updateLead({ id: l.id, approved: true }), "Lead approved")}>Approve</Btn>
                    )}
                  </td>
                  <td className="text-right">
                    <span className="inline-flex gap-1">
                      {l.email && <a href={mailto(l.email, "Makerbangla — following up", `Hi ${l.name},\n\nThanks for your interest in Makerbangla. `)} aria-label={`Email ${l.name}`} className="grid size-8 place-items-center rounded-xl bg-soft text-tile-navy hover:bg-tile-sky/60"><Mail className="size-3.5" /></a>}
                      {l.phone && <a href={`https://wa.me/88${l.phone.replace(/\D/g, "").replace(/^88/, "")}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${l.name}`} className="grid size-8 place-items-center rounded-xl bg-soft text-tile-navy hover:bg-tile-sky/60"><MessageCircle className="size-3.5" /></a>}
                      <Btn size="icon" tone="soft" aria-label={`Edit ${l.name}`} onClick={() => setEdit(l)}><Pencil className="size-3.5" /></Btn>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? "Edit lead" : "Add lead"}>
        {edit && (
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await exec(() => saveLead({ ...Object.fromEntries(new FormData(e.currentTarget)), id: edit.id }), "Lead saved");
              if (r.ok) setEdit(null);
            }}
          >
            <Field label="Name"><input name="name" required maxLength={80} defaultValue={edit.name} className={input} /></Field>
            <Field label="Organisation"><input name="org" maxLength={80} defaultValue={edit.org} className={input} /></Field>
            <Field label="Email"><input name="email" type="email" defaultValue={edit.email} className={input} /></Field>
            <Field label="Phone"><input name="phone" maxLength={20} defaultValue={edit.phone} className={input} /></Field>
            <Field label="Platform"><select name="source" defaultValue={edit.source} className={input}>{leadSources.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></Field>
            <Field label="Country"><input name="country" required maxLength={60} defaultValue={edit.country} className={input} /></Field>
            <Field label="Stage"><select name="status" defaultValue={edit.status} className={cn(input, "capitalize")}>{leadStatuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
            <Field label="Estimated value (BDT)"><input name="value" type="number" min={0} defaultValue={edit.value} className={input} /></Field>
            <Field label="Note" className="sm:col-span-2"><textarea name="note" maxLength={300} defaultValue={edit.note} className={textarea} /></Field>
            <div className="flex justify-between gap-2 sm:col-span-2">
              {edit.id ? <ConfirmButton label="Delete" onConfirm={() => exec(() => deleteLeads({ ids: [edit.id!] }), "Lead deleted").then((r) => r.ok && setEdit(null))} /> : <span />}
              <span className="flex gap-2"><Btn onClick={() => setEdit(null)}>Cancel</Btn><Btn type="submit" tone="primary" disabled={pending}>Save lead</Btn></span>
            </div>
          </form>
        )}
      </Modal>
    </Card>
  );
}
