import { CircleDollarSign, Clock, ShoppingBag, Truck } from "lucide-react";
import { OrdersManager } from "@/components/dashboard/orders-manager";
import { Kpi, PageHeader } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";
import { dayKey, dueOf, paidOf, requestNow } from "@/lib/admin/metrics";
import { bdt } from "@/lib/utils";

export const metadata = { title: "Orders & invoices" };

export default async function OrdersPage() {
  const user = await requireUser("orders");
  const db = await readDb();
  const today = dayKey(await requestNow());
  const todays = db.orders.filter((o) => dayKey(Date.parse(o.createdAt)) === today);
  return (
    <>
      <PageHeader title="Orders & invoices" />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={ShoppingBag} label="Orders today" value={String(todays.length)} tone="blue" foot={bdt(todays.reduce((n, o) => n + o.total, 0))} />
        <Kpi icon={Clock} label="Waiting to confirm" value={String(db.orders.filter((o) => o.status === "pending").length)} tone="yellow" />
        <Kpi icon={Truck} label="Packed & on the way" value={String(db.orders.filter((o) => o.status === "packed" || o.status === "shipped").length)} tone="navy" />
        <Kpi icon={CircleDollarSign} label="Due to collect" value={bdt(db.orders.reduce((n, o) => n + dueOf(o), 0))} tone="coral" foot={`${bdt(db.orders.reduce((n, o) => n + paidOf(o), 0))} collected in total`} />
      </div>
      <OrdersManager
        isAdmin={user.role === "admin"}
        orders={db.orders}
        quotes={db.quotes}
        products={db.products.filter((p) => p.active).map((p) => ({ slug: p.slug, name: p.name, sku: p.sku, price: p.price }))}
      />
    </>
  );
}
