import { LandedCostCalculator, MarginConverter, PricingCalculator, TargetCalculator } from "@/components/dashboard/calculators";
import { PageHeader } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";
import { DAY, requestNow, totals } from "@/lib/admin/metrics";

export const metadata = { title: "Business calculator" };

export default async function CalculatorPage() {
  await requireUser("finance");
  const db = await readDb();
  const now = await requestNow();
  const last30 = totals(db, now - 30 * DAY, now + DAY);
  return (
    <>
      <PageHeader title="Business calculator" />
      <div className="grid gap-4 xl:grid-cols-2">
        <PricingCalculator />
        <LandedCostCalculator />
        <TargetCalculator avgOrder={last30.avg} monthlyFixed={last30.expenses} />
        <MarginConverter />
      </div>
    </>
  );
}
