import { Boxes, PackageX, Percent, Warehouse } from "lucide-react";
import { ProductsManager } from "@/components/dashboard/products-manager";
import { Kpi, PageHeader } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";
import { categories } from "@/lib/data/catalog";
import { bdt } from "@/lib/utils";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const user = await requireUser("products");
  const db = await readDb();
  const p = db.products;
  return (
    <>
      <PageHeader title="Products & inventory" />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={Boxes} label="Products" value={String(p.length)} tone="blue" foot={`${p.filter((x) => x.active).length} live on the store`} />
        <Kpi icon={Warehouse} label="Stock value" value={bdt(p.reduce((n, x) => n + x.price * x.stock, 0))} tone="yellow" foot={`${p.reduce((n, x) => n + x.stock, 0).toLocaleString("en-IN")} units`} />
        <Kpi icon={PackageX} label="Low or out of stock" value={String(p.filter((x) => x.stock <= 5).length)} tone="coral" />
        <Kpi icon={Percent} label="On offer" value={String(p.filter((x) => x.oldPrice).length)} tone="navy" />
      </div>
      <ProductsManager products={p} categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} isAdmin={user.role === "admin"} />
    </>
  );
}
