import { BarChart, Bars } from "@/components/dashboard/charts";
import { palette, seriesColors } from "@/components/dashboard/palette";
import { LeadsManager, TrafficPanel } from "@/components/dashboard/clients-tools";
import { Avatar, Card, Kpi, PageHeader, Table } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";
import { bySource, customers, DAY, requestNow, sourceLabel, traffic } from "@/lib/admin/metrics";
import { leadSources, leadStatuses } from "@/lib/admin/types";
import { bdt } from "@/lib/utils";

export const metadata = { title: "Clients & leads" };

export default async function ClientsPage() {
  await requireUser("clients");
  const db = await readDb();
  const now = await requestNow();
  const strip = ({ labels, visits, views, totalVisits, totalViews, returning, sources, countries }: ReturnType<typeof traffic>) => ({ labels, visits, views, totalVisits, totalViews, returning, sources, countries });
  const ranges = { "7": strip(traffic(db, now, 7)), "30": strip(traffic(db, now, 30)), "90": strip(traffic(db, now, 90)) };
  const people = customers(db);
  const leads = db.leads;
  const won = leads.filter((l) => l.status === "won");
  const t30 = ranges["30"];
  const channels = bySource(db, now - 90 * DAY);
  const leadBySource = leadSources.map((s) => leads.filter((l) => l.source === s).length);

  return (
    <>
      <PageHeader title="Clients & leads" />
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi icon="user-round-check" label="Customers" value={String(people.length)} tone="blue" foot={`${people.filter((p) => p.orders > 1).length} ordered more than once`} />
          <Kpi icon="circle-gauge" label="Open leads" value={String(leads.filter((l) => !["won", "lost"].includes(l.status)).length)} tone="yellow" foot={`${leads.filter((l) => !l.approved).length} waiting for approval`} />
          <Kpi icon="sparkles" label="Lead win rate" value={`${leads.length ? Math.round((won.length / leads.length) * 100) : 0}%`} tone="navy" foot={`${bdt(won.reduce((n, l) => n + (l.value ?? 0), 0))} won`} />
          <Kpi icon="map-pin" label="Visit → order" value={`${t30.totalVisits ? ((db.orders.filter((o) => Date.parse(o.createdAt) > now - 30 * DAY).length / t30.totalVisits) * 100).toFixed(1) : "0"}%`} tone="coral" foot="last 30 days" />
        </div>

        <TrafficPanel ranges={ranges} />

        <div className="grid gap-4 xl:grid-cols-3">
          <Card title="Leads by platform">
            <BarChart labels={leadSources.map((s) => sourceLabel(s))} series={[{ name: "Leads", color: palette.blue, values: leadBySource }]} height={220} />
          </Card>
          <Card title="Lead funnel">
            <Bars items={leadStatuses.map((s, i) => ({ label: s[0].toUpperCase() + s.slice(1), value: leads.filter((l) => l.status === s).length, max: leads.length, color: seriesColors[i % seriesColors.length] }))} />
          </Card>
          <Card title="Sales by channel · 90 days">
            <Bars items={channels.map(([s, v], i) => ({ label: sourceLabel(s), value: v.value, note: `${v.orders} orders · ${bdt(v.value)}`, color: seriesColors[i % seriesColors.length] }))} />
          </Card>
        </div>

        <LeadsManager leads={leads} />

        <Card title="Top customers">
          <Table head={["Customer", "Phone", "City", "Orders", "Spent", "Last order"]}>
            {people.slice(0, 12).map((c) => (
              <tr key={c.phone}>
                <td><span className="flex items-center gap-2 font-bold text-ink"><Avatar name={c.name} size={30} />{c.name}</span></td>
                <td className="text-subtle tabular-nums">{c.phone}</td>
                <td className="text-subtle">{c.city ?? "Pickup"}</td>
                <td className="font-bold tabular-nums">{c.orders}</td>
                <td className="font-black text-ink tabular-nums">{bdt(c.spend)}</td>
                <td className="text-subtle">{new Date(c.last).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
