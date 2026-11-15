import { InvoicesManager } from "@/components/dashboard/invoices-manager";
import { Kpi, PageHeader } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";
import { dayKey, dueOf, knownCustomers, paidOf, requestNow } from "@/lib/admin/metrics";
import { bdt } from "@/lib/utils";

export const metadata = { title: "Invoices & receipts" };

export default async function InvoicesPage() {
  await requireUser("orders");
  const db = await readDb();
  const month = dayKey(await requestNow()).slice(0, 7);
  const thisMonth = db.orders.filter((o) => o.status !== "cancelled" && dayKey(Date.parse(o.createdAt)).startsWith(month));
  const collected = db.orders.flatMap((o) => o.payments).filter((p) => dayKey(Date.parse(p.at)).startsWith(month)).reduce((n, p) => n + p.amount, 0);
  const open = db.orders.filter((o) => dueOf(o) > 0);
  return (
    <>
      <PageHeader title="Invoices & receipts" />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon="file-text" label="Invoiced this month" value={bdt(thisMonth.reduce((n, o) => n + o.total, 0))} tone="blue" foot={`${thisMonth.length} invoices`} />
        <Kpi icon="circle-dollar-sign" label="Collected this month" value={bdt(collected)} tone="yellow" />
        <Kpi icon="hand-coins" label="Outstanding" value={bdt(open.reduce((n, o) => n + dueOf(o), 0))} tone="coral" foot={`${open.length} invoices with a balance`} />
        <Kpi icon="circle-check" label="Paid in full" value={String(db.orders.filter((o) => o.status !== "cancelled" && paidOf(o) >= o.total).length)} tone="navy" foot="all time" />
      </div>
      <InvoicesManager
        orders={db.orders}
        products={db.products.filter((p) => p.active).map((p) => ({ slug: p.slug, name: p.name, sku: p.sku, price: p.price, stock: p.stock }))}
        customers={knownCustomers(db)}
      />
    </>
  );
}
