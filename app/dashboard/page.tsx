import Link from "next/link";
import { ArrowRight, CalendarClock, CircleCheckBig, ClipboardList, Eye, Hourglass, Megaphone, PackagePlus, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { Calendar, PinnedNotes } from "@/components/dashboard/calendar";
import { Bars, BarChart, Donut, Gauge, Legend, LineChart, Ring, Sparkline } from "@/components/dashboard/charts";
import { palette, seriesColors } from "@/components/dashboard/palette";
import { LeaveCard } from "@/components/dashboard/leave-card";
import { TasksBoard } from "@/components/dashboard/tasks-board";
import { Avatar, Card, Kpi, Pill, Table } from "@/components/dashboard/ui";
import { MagicLink } from "@/components/ui/magic-button";
import { requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";
import { categorySales, DAY, dayKey, delta, dueOf, monthly, paidOf, requestNow, sourceLabel, totals, traffic } from "@/lib/admin/metrics";
import { dashNav } from "@/components/dashboard/nav";
import type { Db, User } from "@/lib/admin/types";
import { categories } from "@/lib/data/catalog";
import { bdt } from "@/lib/utils";

export const metadata = { title: "Overview" };

const greet = (now: number) => {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Dhaka" }).format(now));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Working late";
};
const short = (n: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const people = (db: Db) => [{ id: "admin", name: db.profile.name, photo: db.profile.photo }, ...db.employees.filter((e) => e.active).map((e) => ({ id: e.id, name: e.name, photo: e.photo }))];

export default async function OverviewPage() {
  const user = await requireUser();
  const db = await readDb();
  const now = await requestNow();
  return user.role === "admin" ? <AdminOverview db={db} user={user} now={now} /> : <StaffHome db={db} user={user} now={now} />;
}

function AdminOverview({ db, user, now }: { db: Db; user: User; now: number }) {
  const today = dayKey(now);
  const monthStart = Date.parse(`${today.slice(0, 7)}-01T00:00:00+06:00`);
  const prevStart = Date.parse(`${new Date(monthStart - DAY).toISOString().slice(0, 7)}-01T00:00:00+06:00`);
  const cur = totals(db, monthStart, now + DAY);
  const prev = totals(db, prevStart, monthStart);
  const m = monthly(db, now);
  const t = traffic(db, now, 30);
  const status = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"].map((s) => ({ s, n: db.orders.filter((o) => o.status === s).length }));
  const open = db.orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const receivable = db.orders.reduce((n, o) => n + dueOf(o), 0);
  const yearSales = m.sales.reduce((a, b) => a + b, 0), yearCollected = m.collected.reduce((a, b) => a + b, 0);
  const cats = categorySales(db, now - 90 * DAY).slice(0, 6);
  const catName = (s: string) => categories.find((c) => c.slug === s)?.name ?? s;
  const pendingCount = status[0].n;
  const dueToday = db.tasks.filter((x) => x.due === today && x.status !== "done").length;
  const team = people(db).slice(1);
  const lastMonths = (arr: number[]) => arr.slice(-6);

  return (
    <div className="space-y-5">
      {/* Greeting + quick actions */}
      <section className="dash-rise relative isolate overflow-hidden rounded-[24px] bg-tile-navy p-6 text-white sm:p-7">
        <span aria-hidden className="absolute -top-24 -right-10 -z-10 size-72 rounded-full bg-brand/50 blur-3xl" />
        <span aria-hidden className="absolute -bottom-28 left-1/3 -z-10 size-64 rounded-full bg-tile-yellow/20 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} photo={user.photo} size={58} className="ring-4 ring-white/20" />
            <div>
              <h1 className="text-[clamp(1.4rem,2.6vw,2rem)] leading-tight font-black tracking-tight text-tile-yellow">{greet(now)}, {user.name}!</h1>
              <p className="mt-1 text-[13.5px] text-white/80">
                {pendingCount} order{pendingCount === 1 ? "" : "s"} waiting · {dueToday} task{dueToday === 1 ? "" : "s"} due today · {bdt(receivable)} to collect
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <MagicLink href="/dashboard/orders?new=1" variant="accent" size="sm"><ShoppingBag className="size-4" /> New order</MagicLink>
            <MagicLink href="/dashboard/products?new=1" variant="light" size="sm"><PackagePlus className="size-4" /> Add product</MagicLink>
            <MagicLink href="/dashboard/promotions" variant="brand" size="sm"><Megaphone className="size-4" /> Banners</MagicLink>
          </div>
        </div>
      </section>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={TrendingUp} label="Sales this month" value={bdt(cur.sales)} delta={delta(cur.sales, prev.sales)} tone="blue">
          <Sparkline values={lastMonths(m.sales)} className="mt-2" />
        </Kpi>
        <Kpi icon={Wallet} label="Cash collected" value={bdt(cur.collected)} delta={delta(cur.collected, prev.collected)} tone="yellow">
          <Sparkline values={lastMonths(m.collected)} color={palette.yellow} className="mt-2" />
        </Kpi>
        <Kpi icon={ShoppingBag} label="Orders this month" value={String(cur.orders)} delta={delta(cur.orders, prev.orders)} tone="navy">
          <Sparkline values={lastMonths(m.orders)} color={palette.navy} className="mt-2" />
        </Kpi>
        <Kpi icon={Eye} label="Visitors · 30 days" value={short(t.totalVisits)} delta={delta(t.totalVisits, t.prevVisits)} tone="coral">
          <Sparkline values={t.visits} color={palette.coral} className="mt-2" />
        </Kpi>
      </div>

      {/* Revenue analysis + order status */}
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card title="Revenue analysis" action={<Legend items={[{ name: "Sales", color: palette.blue }, { name: "Collected", color: palette.yellow }, { name: "Expenses", color: palette.coral }]} />}>
          <LineChart labels={m.labels} series={[{ name: "Sales", color: palette.blue, values: m.sales }, { name: "Collected", color: palette.yellow, values: m.collected }, { name: "Expenses", color: palette.coral, values: m.expenses }]} format="compact" height={270} />
        </Card>
        <Card title="Order status" action={<Link href="/dashboard/orders" className="text-[12px] font-black text-brand hover:underline">View all</Link>}>
          <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col">
            <Donut data={status.map((x, i) => ({ label: x.s, value: x.n, color: [palette.yellow, palette.sky, palette.blue, palette.navy, palette.midnight, palette.coral][i] }))} center={String(open.length)} sub="open orders" size={170} />
            <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
              {status.map((x, i) => (
                <li key={x.s} className="flex items-center gap-2 font-bold text-ink capitalize">
                  <span className="size-2.5 rounded-full" style={{ background: [palette.yellow, palette.sky, palette.blue, palette.navy, palette.midnight, palette.coral][i] }} />
                  {x.s}<span className="ml-auto text-subtle tabular-nums">{x.n}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Company-style KPI tiles with rings */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Profit this month", value: bdt(cur.profit), ring: cur.collected ? (cur.profit / cur.collected) * 100 : 0, note: "margin on cash collected", color: palette.blue, spark: lastMonths(m.profit) },
          { label: "Average order value", value: bdt(cur.avg), ring: yearSales ? (yearCollected / yearSales) * 100 : 0, note: "of 12-month sales collected", color: palette.yellow, spark: lastMonths(m.sales.map((s, i) => (m.orders[i] ? s / m.orders[i] : 0))) },
          { label: "Returning visitors", value: short(t.returning), ring: t.totalVisits ? (t.returning / t.totalVisits) * 100 : 0, note: "of visits in 30 days", color: palette.navy, spark: t.visits.slice(-12) },
        ].map((k) => (
          <Card key={k.label}>
            <div className="flex items-center gap-4">
              <Ring value={k.ring} color={k.color} size={68} label={k.label} />
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-subtle">{k.label}</p>
                <p className="truncate text-[1.35rem] leading-tight font-black text-ink tabular-nums">{k.value}</p>
                <p className="text-[11px] font-semibold text-subtle">{Math.round(k.ring)}% {k.note}</p>
              </div>
            </div>
            <Sparkline values={k.spark} color={k.color} className="mt-3 h-12" />
          </Card>
        ))}
      </div>

      {/* Sales vs expenses bars + category share + gauges */}
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr]">
        <Card title="Monthly sales vs expenses" action={<Legend items={[{ name: "Sales", color: palette.blue }, { name: "Expenses", color: palette.yellow }]} />}>
          <BarChart labels={m.labels} series={[{ name: "Sales", color: palette.blue, values: m.sales }, { name: "Expenses", color: palette.yellow, values: m.expenses }]} format="compact" height={250} />
        </Card>
        <Card title="Top categories · 90 days">
          <Bars items={cats.map(([c, v], i) => ({ label: catName(c), value: v, note: short(v), color: seriesColors[i % seriesColors.length] }))} />
        </Card>
        <Card title="Health">
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            <Gauge value={yearCollected} max={yearSales} label="Cash collection" color={palette.blue} />
            <Gauge value={db.orders.filter((o) => o.status === "delivered").length} max={db.orders.filter((o) => o.status !== "cancelled").length} label="Orders fulfilled" color={palette.yellow} />
            <Gauge value={db.tasks.filter((x) => x.status === "done").length} max={db.tasks.length} label="Tasks done" color={palette.navy} />
            <Gauge value={db.products.filter((p) => p.stock > 5).length} max={db.products.length} label="Healthy stock" color={palette.coral} />
          </div>
        </Card>
      </div>

      {/* Recent orders + calendar */}
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card title="Recent orders" action={<Link href="/dashboard/orders" className="flex items-center gap-1 text-[12px] font-black text-brand hover:underline">All orders <ArrowRight className="size-3.5" /></Link>}>
          <Table head={["Order", "Customer", "Source", "Total", "Paid", "Status"]}>
            {db.orders.slice(0, 7).map((o) => (
              <tr key={o.id}>
                <td className="font-black text-ink">{o.id}<span className="block text-[11px] font-semibold text-subtle">{new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dhaka" })}</span></td>
                <td><span className="flex items-center gap-2 font-bold text-ink"><Avatar name={o.customer.name} size={28} />{o.customer.name}</span></td>
                <td className="font-semibold text-subtle">{sourceLabel(o.source)}</td>
                <td className="font-black text-ink tabular-nums">{bdt(o.total)}</td>
                <td className="font-semibold tabular-nums">{bdt(paidOf(o))}</td>
                <td><Pill tone={o.status}>{o.status}</Pill></td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Calendar">
          <Calendar notes={db.notes.filter((n) => n.owner === user.id)} today={today} compact />
        </Card>
      </div>

      {/* Pinned notes, team workload, activity */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Pinned notes"><PinnedNotes notes={db.notes.filter((n) => n.owner === user.id)} /></Card>
        <Card title="Team workload" action={<Link href="/dashboard/team" className="text-[12px] font-black text-brand hover:underline">Team</Link>}>
          <ul className="space-y-3.5">
            {team.length === 0 && <li className="text-[12.5px] font-semibold text-subtle">Add team members in Team.</li>}
            {team.map((p) => {
              const mine = db.tasks.filter((x) => x.assignee === p.id);
              const done = mine.filter((x) => x.status === "done").length;
              const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
              return (
                <li key={p.id} className="flex items-center gap-3">
                  <Avatar name={p.name} photo={p.photo} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="flex justify-between text-[12.5px] font-black text-ink"><span className="truncate">{p.name}</span><span className="text-subtle tabular-nums">{done}/{mine.length}</span></p>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-soft"><div className="chart-grow-x h-full rounded-full bg-brand" style={{ width: `${Math.max(3, pct)}%` }} /></div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card title="Recent activity">
          <ul className="space-y-3">
            {db.activity.length === 0 && <li className="text-[12.5px] font-semibold text-subtle">Changes made in the dashboard show up here.</li>}
            {db.activity.slice(0, 7).map((a) => (
              <li key={a.id} className="flex gap-3 text-[12.5px]">
                <Avatar name={a.who} size={28} />
                <p className="min-w-0 leading-snug text-ink-2"><b className="text-ink">{a.who}</b> {a.text}<span className="block text-[11px] font-semibold text-subtle">{new Date(a.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" })}</span></p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function StaffHome({ db, user, now }: { db: Db; user: User; now: number }) {
  const today = dayKey(now);
  const mine = db.tasks.filter((t) => t.assignee === user.id);
  const links = dashNav.filter((n) => n.area && n.area !== "admin" && user.access.includes(n.area));
  return (
    <div className="space-y-5">
      <section className="dash-rise relative isolate overflow-hidden rounded-[24px] bg-tile-navy p-6 text-white sm:p-7">
        <span aria-hidden className="absolute -top-24 -right-10 -z-10 size-72 rounded-full bg-brand/50 blur-3xl" />
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={user.name} photo={user.photo} size={58} className="ring-4 ring-white/20" />
          <div>
            <h1 className="text-[clamp(1.4rem,2.6vw,2rem)] leading-tight font-black tracking-tight text-tile-yellow">{greet(now)}, {user.name.split(" ")[0]}!</h1>
            <p className="mt-1 text-[13.5px] text-white/80">{user.title} · here&apos;s your day.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={ClipboardList} label="Open tasks" value={String(mine.filter((t) => t.status !== "done").length)} tone="blue" />
        <Kpi icon={CalendarClock} label="Due today" value={String(mine.filter((t) => t.due === today && t.status !== "done").length)} tone="yellow" />
        <Kpi icon={Hourglass} label="In review" value={String(mine.filter((t) => t.status === "review").length)} tone="navy" />
        <Kpi icon={CircleCheckBig} label="Completed" value={String(mine.filter((t) => t.status === "done").length)} tone="coral" />
      </div>

      {links.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="dash-rise group flex items-center gap-3 rounded-[18px] bg-white p-4 ring-1 ring-line transition-shadow hover:shadow-[0_16px_30px_-22px_rgb(14_31_77/0.7)]">
              <span className="grid size-10 place-items-center rounded-xl bg-tile-sky text-tile-navy"><Icon className="size-5" /></span>
              <span className="text-[13px] font-black text-ink">{label}</span>
              <ArrowRight className="ml-auto size-4 text-brand transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}

      <Card title="My tasks">
        <TasksBoard tasks={mine} people={people(db)} me={user.id} isAdmin={false} today={today} />
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Calendar"><Calendar notes={db.notes.filter((n) => n.owner === user.id)} today={today} compact /></Card>
        <Card title="Pinned notes"><PinnedNotes notes={db.notes.filter((n) => n.owner === user.id)} /></Card>
        <Card title="Leave"><LeaveCard leaves={db.leaves.filter((l) => l.employeeId === user.id)} /></Card>
      </div>

    </div>
  );
}
