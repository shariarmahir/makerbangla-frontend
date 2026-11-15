import { PromosManager } from "@/components/dashboard/promos-manager";
import { PageHeader } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";

export const metadata = { title: "Promotions" };

export default async function PromotionsPage() {
  await requireUser("promotions");
  const db = await readDb();
  return (
    <>
      <PageHeader title="Promotions" />
      <PromosManager promos={db.promos} products={db.products.filter((p) => p.active)} />
    </>
  );
}
