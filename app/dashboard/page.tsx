import Link from "next/link";
import { Approvals, type Decision } from "@/components/dashboard/approvals";
import { Assignments } from "@/components/dashboard/assignments";
import { Calendar, PinnedNotes } from "@/components/dashboard/calendar";
import { Bars, BarChart, CalendarHeat, ComboChart, Funnel, Gauge, Legend, RadialRings, Ring, Sparkline } from "@/components/dashboard/charts";
import { Icon } from "@/components/dashboard/icon";
import { LeaveCard } from "@/components/dashboard/leave-card";
import { dashNav } from "@/components/dashboard/nav";
import { palette, seriesColors } from "@/components/dashboard/palette";
import { TasksBoard } from "@/components/dashboard/tasks-board";
import { Avatar, Card, Empty, Kpi, Pill, Table } from "@/components/dashboard/ui";
import { MagicLink } from "@/components/ui/magic-button";
import { requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";
import { categorySales, DAY, dayKey, delta, dueOf, monthly, paidOf, requestNow, sourceLabel, totals, traffic } from "@/lib/admin/metrics";
import { orderStatuses, statusLabel, type Db, type User } from "@/lib/admin/types";
import { categories } from "@/lib/data/catalog";
import { bdt } from "@/lib/utils";

export const metadata = { title: "Overview" };

const greet = (now: number) => {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Dhaka" }).format(now));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Working late";
};
const short = (n: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const people = (db: Db) => [{ id: "admin", name: db.profile.name, photo: db.profile.photo }, ...db.employees.filter((e) => e.active).map((e) => ({ id: e.id, name: e.name, photo: e.photo }))];
const step = (s: string) => (orderStatuses as readonly string[]).indexOf(s);

export default async function OverviewPage() {
  const user = await requireUser();
  const db = await readDb();
  const now = await requestNow();
  return user.role === "admin" ? <AdminOverview db={db} user={user} now={now} /> : <StaffHome db={db} user={user} now={now} />;
}

function Hero({ user, now, line, children }: { user: User; now: number; line: string; children?: React.ReactNode }) {
  return (
    <section className="dash-rise relative isolate overflow-hidden rounded-[26px] bg-tile-navy p-6 text-white sm:p-7">
      <span aria-hidden className="absolute -top-24 -right-10 -z-10 size-72 rounded-full bg-brand/50 blur-3xl" />
      <span aria-hidden className="absolute -bottom-28 left-1/3 -z-10 size-64 rounded-full bg-tile-yellow/20 blur-3xl" />
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} photo={user.photo} size={58} className="ring-4 ring-white/20" />
          <div>
            <h1 className="text-[clamp(1.4rem,2.6vw,2rem)] leading-tight font-black tracking-tight text-tile-yellow">{greet(now)}, {user.role === "admin" ? user.name : user.name.split(" ")[0]}!</h1>
            <p className="mt-1 text-[13.5px] text-white/80">{line}</p>
          </div>
        </div>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </section>
  );
}

/** The owner's cockpit: decisions first, then money, orders, customers and the team. */
function AdminOverview({ db, user, now }: { db: Db; user: User; now: number }) {
  const today = dayKey(now);
  const monthStart = Date.parse(`${today.slice(0, 7)}-01T00:00:00+06:00`);
  const prevStart = Date.parse(`${new Date(monthStart - DAY).toISOString().slice(0, 7)}-01T00:00:00+06:00`);
  const cur = totals(db, monthStart, now + DAY);
  const prev = totals(db, prevStart, monthStart);
  const m = monthly(db, now);
  const t = traffic(db, now, 30);
  const count = (s: string) => db.orders.filter((o) => o.status === s).length;
  const pipeline = [
    { label: "New", value: count("pending"), color: palette.yellow },
    { label: "Approved", value: count("confirmed"), color: palette.sky },
    { label: "Packed", value: count("packed"), color: palette.blue },
    { label: "On the way", value: count("shipped"), color: palette.navy },
  ];
  const open = pipeline.reduce((n, x) => n + x.value, 0);
  const receivable = db.orders.reduce((n, o) => n + dueOf(o), 0);
  const yearSales = m.sales.reduce((a, b) => a + b, 0), yearCollected = m.collected.reduce((a, b) => a + b, 0);
  const cats = categorySales(db, now - 90 * DAY).slice(0, 6);
  const catName = (s: string) => categories.find((c) => c.slug === s)?.name ?? s;
  const team = people(db).slice(1);
  const lastMonths = (arr: number[]) => arr.slice(-6);

  // Everything that waits on the owner's yes or no.
  const decisions: Decision[] = [
    ...db.orders.filter((o) => o.status === "pending").map((o) => ({ kind: "order" as const, id: o.id, title: o.customer.name, sub: `${o.id} · ${o.lines.reduce((n, l) => n + l.qty, 0)} item${o.lines.reduce((n, l) => n + l.qty, 0) === 1 ? "" : "s"} · ${sourceLabel(o.source)}`, amount: o.total, at: o.createdAt })),
    ...db.leaves.filter((l) => l.status === "pending").map((l) => ({ kind: "leave" as const, id: l.id, title: db.employees.find((e) => e.id === l.employeeId)?.name ?? "Team member", sub: `${l.from}${l.to !== l.from ? ` → ${l.to}` : ""} · ${l.reason}`, at: l.createdAt })),
    ...db.leads.filter((l) => !l.approved && l.status === "new").map((l) => ({ kind: "lead" as const, id: l.id, title: l.name, sub: `${l.org ? `${l.org} · ` : ""}${sourceLabel(l.source)} · ${l.country}`, amount: l.value, at: l.createdAt })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  // 30-day conversion: of the orders placed, how many reached each step.
  const recent = db.orders.filter((o) => Date.parse(o.createdAt) > now - 30 * DAY);
  const reached = (s: string) => recent.filter((o) => o.status !== "cancelled" && step(o.status) >= step(s)).length;
  const funnel = [
    { label: "Placed", value: recent.length, color: palette.yellow },
    { label: "Approved", value: reached("confirmed"), color: palette.sky },
    { label: "Packed", value: reached("packed"), color: palette.blue },
    { label: "Shipped", value: reached("shipped"), color: palette.navy },
    { label: "Delivered", value: reached("delivered"), color: palette.midnight },
  ];
  const from = dayKey(now - 181 * DAY);
  const daily = new Map<string, number>();
  for (const o of db.orders) {
    const d = dayKey(Date.parse(o.createdAt));
    if (d >= from) daily.set(d, (daily.get(d) ?? 0) + 1);
  }
  const heatTotal = [...daily.values()].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      <Hero user={user} now={now} line={`${decisions.length ? `${decisions.length} decision${decisions.length === 1 ? "" : "s"} waiting for you` : "Nothing waiting on you"} · ${open} order${open === 1 ? "" : "s"} in progress · ${bdt(receivable)} to collect`}>
        <MagicLink href="/dashboard/orders" variant="accent" size="sm"><Icon name="cart" className="size-4" /> Review orders{pipeline[0].value ? ` · ${pipeline[0].value}` : ""}</MagicLink>
        <MagicLink href="/dashboard/invoices?new=1" variant="light" size="sm"><Icon name="file-pen-line" className="size-4" /> Create invoice</MagicLink>
        <MagicLink href="/dashboard/products?new=1" variant="light" size="sm"><Icon name="box" className="size-4" /> Add product</MagicLink>
        <MagicLink href="/dashboard/finance" variant="brand" size="sm"><Icon name="file-chart-line" className="size-4" /> Reports</MagicLink>
        <MagicLink href="/dashboard/calculator" variant="brand" size="sm"><Icon name="badge-percent" className="size-4" /> Calculator</MagicLink>
      </Hero>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Kpi icon="trending-up" label="Sales this month" value={bdt(cur.sales)} delta={delta(cur.sales, prev.sales)} tone="blue" spark={<Sparkline values={lastMonths(m.sales)} className="h-11" />} />
        <Kpi icon="wallet" label="Cash collected" value={bdt(cur.collected)} delta={delta(cur.collected, prev.collected)} tone="yellow" spark={<Sparkline values={lastMonths(m.collected)} color={palette.yellow} className="h-11" />} />
        <Kpi icon="cart" label="Orders this month" value={String(cur.orders)} delta={delta(cur.orders, prev.orders)} tone="navy" spark={<Sparkline values={lastMonths(m.orders)} color={palette.navy} className="h-11" />} />
        <Kpi icon="eye" label="Visitors · 30 days" value={short(t.totalVisits)} delta={delta(t.totalVisits, t.prevVisits)} tone="coral" spark={<Sparkline values={t.visits} color={palette.coral} className="h-11" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card icon="clipboard-check" title="Needs your decision" action={decisions.length > 0 && <span className="rounded-full bg-tile-coral px-2.5 py-1 text-[11px] font-black text-white tabular-nums">{decisions.length}</span>}>
          <Approvals items={decisions} />
        </Card>
        <Card icon="truck" title="Live order pipeline" action={<Link href="/dashboard/orders" className="flex items-center gap-1 text-[12px] font-black text-brand hover:underline">Board <Icon name="arrow-right" className="size-3.5" /></Link>}>
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <RadialRings data={pipeline} max={Math.max(1, open)} center={String(open)} sub="in progress" size={190} />
            <ul className="w-full space-y-2">
              {pipeline.map((x) => (
                <li key={x.label} className="flex items-center gap-2.5 rounded-xl bg-soft/70 px-3 py-2 text-[12.5px] font-bold text-ink">
                  <span className="size-2.5 rounded-full" style={{ background: x.color }} />
                  {x.label}
                  <span className="ml-auto font-black tabular-nums">{x.value}</span>
                </li>
              ))}
              <li className="flex gap-2 pt-1 text-[11.5px] font-bold">
                <span className="flex-1 rounded-xl bg-tile-navy/8 px-3 py-2 text-tile-navy">Delivered <b className="float-right tabular-nums">{count("delivered")}</b></span>
                <span className="flex-1 rounded-xl bg-tile-coral/10 px-3 py-2 text-sale">Cancelled <b className="float-right tabular-nums">{count("cancelled")}</b></span>
              </li>
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card icon="chart-column-increasing" title="Revenue analysis">
          <ComboChart labels={m.labels} bars={{ name: "Sales", color: palette.blue, values: m.sales }} area={{ name: "Collected", color: palette.yellow, values: m.collected }} line={{ name: "Expenses", color: palette.coral, values: m.expenses }} height={350} />
        </Card>
        <Card icon="circle-gauge" title="Order conversion · 30 days">
          <Funnel steps={funnel} height={340} />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card icon="calendar-days" title="Orders per day · 6 months" action={<span className="text-[11.5px] font-bold text-subtle tabular-nums">{heatTotal} orders</span>}>
          <CalendarHeat days={[...daily]} from={from} to={today} height={262} />
        </Card>
        <Card icon="gauge" title="Business health">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <Gauge value={yearCollected} max={yearSales} label="Cash collection" color={palette.blue} />
            <Gauge value={count("delivered")} max={db.orders.filter((o) => o.status !== "cancelled").length} label="Orders fulfilled" color={palette.yellow} />
            <Gauge value={db.tasks.filter((x) => x.status === "done").length} max={db.tasks.length} label="Tasks done" color={palette.navy} />
            <Gauge value={db.products.filter((p) => p.stock > 5).length} max={db.products.length} label="Healthy stock" color={palette.coral} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Profit this month", value: bdt(cur.profit), ring: cur.collected ? (cur.profit / cur.collected) * 100 : 0, note: "margin on cash", color: palette.blue, spark: lastMonths(m.profit) },
          { label: "Average order value", value: bdt(cur.avg), ring: yearSales ? (yearCollected / yearSales) * 100 : 0, note: "of 12-month sales collected", color: palette.yellow, spark: lastMonths(m.sales.map((s, i) => (m.orders[i] ? s / m.orders[i] : 0))) },
          { label: "Returning visitors", value: short(t.returning), ring: t.totalVisits ? (t.returning / t.totalVisits) * 100 : 0, note: "of 30-day visits", color: palette.navy, spark: t.visits.slice(-12) },
        ].map((k) => (
          <Card key={k.label}>
            <div className="flex items-center gap-4">
              <Ring value={k.ring} color={k.color} size={64} label={k.label} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold text-subtle">{k.label}</p>
                <p className="truncate text-[1.3rem] leading-tight font-black text-ink tabular-nums">{k.value}</p>
                <p className="truncate text-[11px] font-semibold text-subtle">{Math.round(k.ring)}% {k.note}</p>
              </div>
            </div>
            <Sparkline values={k.spark} color={k.color} className="mt-2 h-11" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr]">
        <Card icon="chart-column-increasing" title="Sales vs expenses" action={<Legend items={[{ name: "Sales", color: palette.blue }, { name: "Expenses", color: palette.yellow }]} />}>
          <BarChart labels={m.labels} series={[{ name: "Sales", color: palette.blue, values: m.sales }, { name: "Expenses", color: palette.yellow, values: m.expenses }]} format="compact" height={250} />
        </Card>
        <Card icon="boxes" title="Top categories · 90 days">
          <Bars items={cats.map(([c, v], i) => ({ label: catName(c), value: v, note: short(v), color: seriesColors[i % seriesColors.length] }))} />
        </Card>
        <Card icon="users-round" title="Team workload" action={<Link href="/dashboard/team" className="text-[12px] font-black text-brand hover:underline">Team</Link>}>
          <ul className="space-y-3.5">
            {team.length === 0 && <li className="text-[12.5px] font-semibold text-subtle">Add team members in Team.</li>}
            {team.map((p) => {
              const mine = db.tasks.filter((x) => x.assignee === p.id);
              const done = mine.filter((x) => x.status === "done").length;
              const handling = db.orders.filter((o) => o.assignee === p.id && ["confirmed", "packed", "shipped"].includes(o.status)).length;
              const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
              return (
                <li key={p.id} className="flex items-center gap-3">
                  <Avatar name={p.name} photo={p.photo} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="flex justify-between gap-2 text-[12.5px] font-black text-ink"><span className="truncate">{p.name}</span><span className="shrink-0 text-[11px] text-subtle tabular-nums">{done}/{mine.length} tasks · {handling} orders</span></p>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-soft"><div className="chart-grow-x h-full rounded-full bg-linear-to-r from-brand to-tile-navy" style={{ width: `${Math.max(3, pct)}%` }} /></div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card icon="history" title="Recent orders" action={<Link href="/dashboard/orders?tab=list" className="flex items-center gap-1 text-[12px] font-black text-brand hover:underline">All orders <Icon name="arrow-right" className="size-3.5" /></Link>}>
          <Table head={["Order", "Customer", "Source", "Total", "Paid", "Status"]}>
            {db.orders.slice(0, 7).map((o) => (
              <tr key={o.id}>
                <td className="font-black text-ink">{o.id}<span className="block text-[11px] font-semibold text-subtle">{new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dhaka" })}</span></td>
                <td><span className="flex items-center gap-2 font-bold text-ink"><Avatar name={o.customer.name} size={28} />{o.customer.name}</span></td>
                <td className="font-semibold text-subtle">{sourceLabel(o.source)}</td>
                <td className="font-black text-ink tabular-nums">{bdt(o.total)}</td>
                <td className="font-semibold tabular-nums">{bdt(paidOf(o))}</td>
                <td><Pill tone={o.status}>{statusLabel[o.status]}</Pill></td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card icon="calendar-check-2" title="Calendar">
          <Calendar notes={db.notes.filter((n) => n.owner === user.id)} today={today} compact />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card icon="bookmark" title="Pinned notes"><PinnedNotes notes={db.notes.filter((n) => n.owner === user.id)} /></Card>
        <Card icon="zap" title="Recent activity">
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

/** Employee home: today's tasks, the orders they handle, and shortcuts to their areas. */
function StaffHome({ db, user, now }: { db: Db; user: User; now: number }) {
  const today = dayKey(now);
  const mine = db.tasks.filter((t) => t.assignee === user.id);
  const links = dashNav.filter((n) => n.area && n.area !== "admin" && user.access.includes(n.area));
  const queue = user.access.includes("orders") ? db.orders.filter((o) => o.assignee === user.id && ["confirmed", "packed", "shipped"].includes(o.status)) : [];
  const open = mine.filter((t) => t.status !== "done").length;
  return (
    <div className="space-y-5">
      <Hero user={user} now={now} line={`${user.title} · ${open} open task${open === 1 ? "" : "s"}${queue.length ? ` · ${queue.length} order${queue.length === 1 ? "" : "s"} to handle` : ""}`}>
        {queue.length > 0 && <MagicLink href="/dashboard/orders" variant="accent" size="sm"><Icon name="truck" className="size-4" /> My orders · {queue.length}</MagicLink>}
        <MagicLink href="/dashboard/tasks" variant="light" size="sm"><Icon name="calendar-check-2" className="size-4" /> Tasks & calendar</MagicLink>
      </Hero>

      <Assignments tasks={mine.filter((t) => t.response === "pending")} from={Object.fromEntries(people(db).map((p) => [p.id, p.name]))} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Kpi icon="clipboard-check" label="Open tasks" value={String(open)} tone="blue" />
        <Kpi icon="alarm-clock" label="Due today" value={String(mine.filter((t) => t.due === today && t.status !== "done").length)} tone="yellow" />
        <Kpi icon="hourglass" label="In review" value={String(mine.filter((t) => t.status === "review").length)} tone="navy" />
        <Kpi icon="circle-check" label="Completed" value={String(mine.filter((t) => t.status === "done").length)} tone="coral" />
      </div>

      {links.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {links.map(({ href, label, icon }) => (
            <Link key={href} href={href} className="dash-rise group flex items-center gap-3 rounded-[18px] bg-white p-4 ring-1 ring-line transition-[box-shadow,translate] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-22px_rgb(14_31_77/0.7)]">
              <span className="grid size-10 place-items-center rounded-xl bg-tile-sky text-tile-navy"><Icon name={icon} className="size-5" /></span>
              <span className="text-[13px] font-black text-ink">{label}</span>
              <Icon name="arrow-right" className="ml-auto size-4 text-brand" />
            </Link>
          ))}
        </div>
      )}

      {user.access.includes("orders") && (
        <Card icon="truck" title="Orders I'm handling" action={<Link href="/dashboard/orders" className="flex items-center gap-1 text-[12px] font-black text-brand hover:underline">Open board <Icon name="arrow-right" className="size-3.5" /></Link>}>
          {queue.length === 0 ? (
            <Empty>No orders assigned to you right now.</Empty>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {queue.slice(0, 9).map((o) => (
                <li key={o.id} className="flex items-center gap-3 rounded-2xl bg-soft/70 p-3">
                  <Avatar name={o.customer.name} size={32} />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[12.5px] text-ink">{o.customer.name}</b>
                    <span className="block truncate text-[11px] font-semibold text-subtle">{o.id} · {bdt(o.total)}</span>
                  </span>
                  <Pill tone={o.status}>{statusLabel[o.status]}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card icon="clipboard-check" title="My tasks">
        <TasksBoard tasks={mine} people={people(db)} me={user.id} isAdmin={false} today={today} />
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card icon="calendar-days" title="Calendar"><Calendar notes={db.notes.filter((n) => n.owner === user.id)} today={today} compact /></Card>
        <Card icon="bookmark" title="Pinned notes"><PinnedNotes notes={db.notes.filter((n) => n.owner === user.id)} /></Card>
        <Card icon="calendar-check-2" title="Leave"><LeaveCard leaves={db.leaves.filter((l) => l.employeeId === user.id)} /></Card>
      </div>
    </div>
  );
}
