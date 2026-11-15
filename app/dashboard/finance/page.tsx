import { Banknote, HandCoins, Landmark, PiggyBank } from "lucide-react";
import { Bars, BarChart, Donut, Legend, LineChart } from "@/components/dashboard/charts";
import { palette, seriesColors } from "@/components/dashboard/palette";
import { BusinessCalculator, ExpenseBook, Reports } from "@/components/dashboard/finance-tools";
import { Card, Kpi, PageHeader, Table } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";
import { bySource, DAY, dayKey, delta, dueOf, monthly, requestNow, sourceLabel, topProducts, totals } from "@/lib/admin/metrics";
import type { ReportInput } from "@/lib/admin/pdf";
import type { Db } from "@/lib/admin/types";
import { bdt } from "@/lib/utils";

export const metadata = { title: "Finance" };

const short = (n: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const fmtDay = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" });

function report(db: Db, title: string, from: number, to: number): ReportInput {
  const t = totals(db, from, to);
  const byCat = new Map<string, number>();
  db.expenses.filter((e) => Date.parse(`${e.date}T00:00:00+06:00`) >= from && Date.parse(`${e.date}T00:00:00+06:00`) < to).forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
  const tables: ReportInput["tables"] = [
    { title: "Expenses by category", head: ["Category", "Amount"], rows: [...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => [c, bdt(n)]) },
    { title: "Top products", head: ["Product", "Units", "Sales"], rows: topProducts(db, from, 10).map((p) => [p.name, p.qty, bdt(p.value)]) },
    { title: "Sales by channel", head: ["Channel", "Orders", "Sales"], rows: bySource(db, from).map(([s, v]) => [sourceLabel(s), v.orders, bdt(v.value)]) },
  ];
  if (to - from > 40 * DAY) {
    const m = monthly(db, to - DAY, 12);
    tables.unshift({ title: "Month by month", head: ["Month", "Sales", "Collected", "Expenses", "Profit"], rows: m.keys.map((k, i) => [k, bdt(m.sales[i]), bdt(m.collected[i]), bdt(m.expenses[i]), bdt(m.profit[i])]) });
  }
  return {
    title,
    period: `${fmtDay(from)} - ${fmtDay(to - 1)}`,
    kpis: [["Sales", bdt(t.sales)], ["Collected", bdt(t.collected)], ["Expenses", bdt(t.expenses)], ["Profit", bdt(t.profit)], ["Orders", String(t.orders)], ["Avg order", bdt(t.avg)], ["Cancelled", String(t.cancelled)], ["Due now", bdt(db.orders.reduce((n, o) => n + dueOf(o), 0))]],
    tables,
  };
}

export default async function FinancePage() {
  await requireUser("finance");
  const db = await readDb();
  const now = await requestNow();
  const today = dayKey(now);
  const monthStart = Date.parse(`${today.slice(0, 7)}-01T00:00:00+06:00`);
  const prevStart = Date.parse(`${new Date(monthStart - DAY).toISOString().slice(0, 7)}-01T00:00:00+06:00`);
  const end = Date.parse(`${today}T00:00:00+06:00`) + DAY;
  const cur = totals(db, monthStart, end), prev = totals(db, prevStart, monthStart);
  const m = monthly(db, now);
  const year = totals(db, end - 365 * DAY, end);

  const expCats = new Map<string, number>();
  db.expenses.filter((e) => e.date >= dayKey(now - 365 * DAY)).forEach((e) => expCats.set(e.category, (expCats.get(e.category) ?? 0) + e.amount));
  const expList = [...expCats.entries()].sort((a, b) => b[1] - a[1]);
  const methods = new Map<string, number>();
  db.orders.flatMap((o) => o.payments).filter((p) => Date.parse(p.at) >= now - 365 * DAY).forEach((p) => methods.set(p.method, (methods.get(p.method) ?? 0) + p.amount));

  return (
    <>
      <PageHeader title="Finance" />
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi icon={Banknote} label="Collected this month" value={bdt(cur.collected)} delta={delta(cur.collected, prev.collected)} tone="blue" />
          <Kpi icon={Landmark} label="Expenses this month" value={bdt(cur.expenses)} delta={delta(cur.expenses, prev.expenses)} tone="yellow" />
          <Kpi icon={PiggyBank} label="Profit this month" value={bdt(cur.profit)} delta={prev.profit > 0 ? delta(cur.profit, prev.profit) : undefined} tone="navy" foot={cur.collected ? `${Math.round((cur.profit / cur.collected) * 100)}% margin` : undefined} />
          <Kpi icon={HandCoins} label="Receivable (due)" value={bdt(db.orders.reduce((n, o) => n + dueOf(o), 0))} tone="coral" foot={`${db.orders.filter((o) => dueOf(o) > 0).length} orders with balance`} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <Card title="Profit trend · 12 months" action={<Legend items={[{ name: "Collected", color: palette.blue }, { name: "Expenses", color: palette.coral }, { name: "Profit", color: palette.yellow }]} />}>
            <LineChart labels={m.labels} series={[{ name: "Collected", color: palette.blue, values: m.collected }, { name: "Expenses", color: palette.coral, values: m.expenses }, { name: "Profit", color: palette.yellow, values: m.profit.map((p) => Math.max(0, p)) }]} format="compact" height={270} />
          </Card>
          <Card title="Where the money goes">
            <div className="flex flex-col items-center gap-4">
              <Donut data={expList.map(([c, v], i) => ({ label: c, value: v, color: seriesColors[i % seriesColors.length] }))} center={short(year.expenses)} sub="12-month expenses" size={176} />
              <Bars items={expList.slice(0, 5).map(([c, v], i) => ({ label: c, value: v, note: bdt(v), color: seriesColors[i % seriesColors.length] }))} />
            </div>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card title="Orders per month" className="xl:col-span-2">
            <BarChart labels={m.labels} series={[{ name: "Orders", color: palette.navy, values: m.orders }]} height={230} />
          </Card>
          <Card title="Payments received · 12 months">
            <Bars items={[...methods.entries()].sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({ label: k, value: v, note: bdt(v), color: seriesColors[i % seriesColors.length] }))} />
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <ExpenseBook expenses={db.expenses} today={today} />
          <div className="space-y-4">
            <Reports
              reports={[
                report(db, "Weekly report", end - 7 * DAY, end),
                report(db, "Monthly report", monthStart, end),
                report(db, "Yearly report", end - 365 * DAY, end),
              ]}
            />
            <BusinessCalculator />
          </div>
        </div>

        <Card title="Monthly summary">
          <Table head={["Month", "Orders", "Sales", "Collected", "Expenses", "Profit"]}>
            {[...m.keys].reverse().map((k, ri) => {
              const i = m.keys.length - 1 - ri;
              return (
                <tr key={k}>
                  <td className="font-black text-ink">{new Date(`${k}-01T00:00:00Z`).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}</td>
                  <td className="tabular-nums">{m.orders[i]}</td>
                  <td className="tabular-nums">{bdt(m.sales[i])}</td>
                  <td className="tabular-nums">{bdt(m.collected[i])}</td>
                  <td className="tabular-nums">{bdt(m.expenses[i])}</td>
                  <td className={m.profit[i] < 0 ? "font-black text-sale tabular-nums" : "font-black text-tile-navy tabular-nums"}>{bdt(m.profit[i])}</td>
                </tr>
              );
            })}
          </Table>
        </Card>
      </div>
    </>
  );
}
