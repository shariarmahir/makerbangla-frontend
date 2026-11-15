"use client";

import { useMemo, useState } from "react";
import { Icon } from "./icon";
import { addExpense, deleteExpenses } from "@/lib/admin/actions/people";
import { reportPdf, type ReportInput } from "@/lib/admin/pdf";
import { expenseCategories, type Expense } from "@/lib/admin/types";
import { bdt, cn } from "@/lib/utils";
import { Btn, ConfirmButton, download, input, toCsv, useAction } from "./kit";
import { Card, Empty } from "./ui";

/** Expense book: add, filter, delete selected, export. */
export function ExpenseBook({ expenses, today }: { expenses: Expense[]; today: string }) {
  const { pending, exec } = useAction();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [picked, setPicked] = useState<string[]>([]);
  const shown = useMemo(() => expenses.filter((e) => (cat === "all" || e.category === cat) && (!q || `${e.note} ${e.category}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => b.date.localeCompare(a.date)), [expenses, q, cat]);
  return (
    <Card title="Daily expenses" action={<Btn size="sm" onClick={() => download("expenses.csv", toCsv([["Date", "Category", "Note", "Amount"], ...shown.map((e) => [e.date, e.category, e.note, e.amount])]))}><Icon name="download" className="size-3.5 text-brand" /> CSV</Btn>}>
      <form
        className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-soft p-3 sm:grid-cols-[140px_1fr_1.4fr_120px_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const r = await exec(() => addExpense(Object.fromEntries(new FormData(form))), "Expense added");
          if (r.ok) form.reset();
        }}
      >
        <input name="date" type="date" required defaultValue={today} aria-label="Date" className={cn(input, "bg-white")} />
        <select name="category" aria-label="Category" className={cn(input, "bg-white")}>{expenseCategories.map((c) => <option key={c}>{c}</option>)}</select>
        <input name="note" maxLength={120} placeholder="What was it for?" aria-label="Note" className={cn(input, "col-span-2 bg-white sm:col-span-1")} />
        <input name="amount" type="number" min={1} required placeholder="Amount" aria-label="Amount" className={cn(input, "bg-white")} />
        <Btn type="submit" tone="primary" disabled={pending}><Icon name="plus" className="size-4" /> Add</Btn>
      </form>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative min-w-48 flex-1">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search expenses" aria-label="Search expenses" className={cn(input, "pl-9")} />
        </label>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter category" className={cn(input, "w-auto")}>
          <option value="all">All categories</option>
          {expenseCategories.map((c) => <option key={c}>{c}</option>)}
        </select>
        {picked.length > 0 && <ConfirmButton label={`Delete ${picked.length}`} confirm="Confirm delete" onConfirm={() => exec(() => deleteExpenses({ ids: picked }), "Expenses deleted").then((r) => r.ok && setPicked([]))} />}
      </div>
      {shown.length === 0 ? (
        <Empty>No expenses recorded.</Empty>
      ) : (
        <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
          {shown.slice(0, 300).map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2.5 text-[12.5px]">
              <input type="checkbox" aria-label="Select expense" checked={picked.includes(e.id)} onChange={() => setPicked((s) => (s.includes(e.id) ? s.filter((x) => x !== e.id) : [...s, e.id]))} className="size-4 accent-[var(--color-tile-navy)]" />
              <span className="w-20 shrink-0 font-semibold text-subtle tabular-nums">{e.date.slice(5).replace("-", "/")}</span>
              <span className="min-w-0 flex-1"><b className="text-ink">{e.category}</b><span className="block truncate text-subtle">{e.note}</span></span>
              <span className="font-black text-ink tabular-nums">{bdt(e.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Weekly / monthly / yearly PDF business reports (data prepared on the server). */
export function Reports({ reports }: { reports: ReportInput[] }) {
  return (
    <Card title={<span className="flex items-center gap-2"><Icon name="file-chart-line" className="size-4.5 text-brand" /> Business reports</span>}>
      <ul className="space-y-2.5">
        {reports.map((r, i) => (
          <li key={r.title} className={cn("flex items-center gap-3 rounded-2xl p-3.5", ["bg-tile-sky/50", "bg-tile-butter/70", "bg-tile-navy text-white"][i % 3])}>
            <span className="min-w-0 flex-1">
              <b className={cn("block text-[13.5px]", i % 3 === 2 ? "text-tile-yellow" : "text-ink")}>{r.title}</b>
              <span className={cn("text-[11.5px] font-semibold", i % 3 === 2 ? "text-white/75" : "text-subtle")}>{r.period}</span>
            </span>
            <Btn size="sm" tone={i % 3 === 2 ? "accent" : "primary"} onClick={() => reportPdf(r)}><Icon name="download" className="size-3.5" /> PDF</Btn>
          </li>
        ))}
      </ul>
    </Card>
  );
}
