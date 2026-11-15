import { Ring, Sparkline } from "@/components/dashboard/charts";
import { OrdersManager } from "@/components/dashboard/orders-manager";
import { palette } from "@/components/dashboard/palette";
import { Kpi, PageHeader } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";
import { DAY, dayKey, dueOf, paidOf, requestNow } from "@/lib/admin/metrics";
import { bdt } from "@/lib/utils";

export const metadata = { title: "Orders" };

const ago = (ms: number) => (ms < 3_600_000 ? `${Math.max(1, Math.round(ms / 60_000))} min` : ms < DAY ? `${Math.round(ms / 3_600_000)} h` : `${Math.round(ms / DAY)} day${Math.round(ms / DAY) === 1 ? "" : "s"}`);

export default async function OrdersPage() {
  const user = await requireUser("orders");
  const db = await readDb();
  const now = await requestNow();
  const today = dayKey(now);
  const live = db.orders.filter((o) => o.status !== "cancelled");
  const todays = db.orders.filter((o) => dayKey(Date.parse(o.createdAt)) === today);
  const perDay = Array.from({ length: 14 }, (_, i) => dayKey(now - (13 - i) * DAY)).map((d) => db.orders.filter((o) => dayKey(Date.parse(o.createdAt)) === d).length);
  const fresh = db.orders.filter((o) => o.status === "pending");
  const oldest = fresh.reduce((m, o) => Math.min(m, Date.parse(o.createdAt)), now);
  const packed = db.orders.filter((o) => o.status === "packed").length, onWay = db.orders.filter((o) => o.status === "shipped").length;
  const billed = live.reduce((n, o) => n + o.total, 0), collected = live.reduce((n, o) => n + paidOf(o), 0);
  const team = [{ id: "admin", name: db.profile.name, photo: db.profile.photo }, ...db.employees.filter((e) => e.active && e.access.includes("orders")).map((e) => ({ id: e.id, name: e.name, photo: e.photo }))];

  return (
    <>
      <PageHeader title="Orders" />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Kpi icon="cart" label="Orders today" value={String(todays.length)} tone="blue" foot={bdt(todays.reduce((n, o) => n + o.total, 0))}>
          <Sparkline values={perDay} className="h-12 w-24 sm:w-28" />
        </Kpi>
        <Kpi icon="bell" label="New · needs approval" value={String(fresh.length)} tone="yellow" foot={fresh.length ? `Oldest waiting ${ago(now - oldest)}` : "All caught up"} />
        <Kpi icon="truck" label="In fulfilment" value={String(db.orders.filter((o) => o.status === "confirmed").length + packed + onWay)} tone="navy" foot={`${packed} packed · ${onWay} on the way`} />
        <Kpi icon="circle-dollar-sign" label="Due to collect" value={bdt(db.orders.reduce((n, o) => n + dueOf(o), 0))} tone="coral" foot={`${bdt(collected)} collected`}>
          <Ring value={billed ? (collected / billed) * 100 : 0} color={palette.navy} size={50} label="Collected" />
        </Kpi>
      </div>
      <OrdersManager
        isAdmin={user.role === "admin"}
        me={user.id}
        team={team}
        orders={db.orders}
        quotes={db.quotes}
        products={db.products.filter((p) => p.active).map((p) => ({ slug: p.slug, name: p.name, sku: p.sku, price: p.price, stock: p.stock }))}
      />
    </>
  );
}
