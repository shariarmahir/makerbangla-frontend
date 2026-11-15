import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FlaskConical } from "lucide-react";
import { Shell, type Alert } from "@/components/dashboard/shell";
import { canAccess, requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh animate-pulse bg-soft" />}>
      <Frame>{children}</Frame>
    </Suspense>
  );
}

async function Frame({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const db = await readDb();

  const alerts: Alert[] = [];
  const pending = db.orders.filter((o) => o.status === "pending").length;
  if (pending && canAccess(user, "orders")) alerts.push({ text: `${pending} new order${pending > 1 ? "s" : ""} waiting for confirmation`, href: "/dashboard/orders?status=pending", tone: "warn" });
  const urgent = db.tasks.filter((t) => t.priority === "emergency" && t.status !== "done" && (user.role === "admin" || t.assignee === user.id)).length;
  if (urgent) alerts.push({ text: `${urgent} emergency task${urgent > 1 ? "s" : ""} open`, href: "/dashboard/tasks", tone: "warn" });
  const leaves = db.leaves.filter((l) => l.status === "pending").length;
  if (leaves && user.role === "admin") alerts.push({ text: `${leaves} leave request${leaves > 1 ? "s" : ""} to review`, href: "/dashboard/team", tone: "info" });
  const low = db.products.filter((p) => p.active && p.stock <= 5).length;
  if (low && canAccess(user, "products")) alerts.push({ text: `${low} product${low > 1 ? "s are" : " is"} low on stock`, href: "/dashboard/products?stock=low", tone: "info" });
  const leads = db.leads.filter((l) => !l.approved && l.status === "new").length;
  if (leads && canAccess(user, "clients")) alerts.push({ text: `${leads} new lead${leads > 1 ? "s" : ""} to approve`, href: "/dashboard/clients", tone: "info" });

  const hasSample = db.orders.some((o) => o.sample) || Object.keys(db.sampleVisits).length > 0;

  return (
    <Shell user={user} alerts={alerts}>
      {hasSample && user.role === "admin" && (
        <p className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl bg-tile-butter/70 px-4 py-2.5 text-[12.5px] font-semibold text-tile-navy ring-1 ring-tile-yellow">
          <FlaskConical className="size-4 shrink-0" />
          Sample orders, expenses, leads and traffic are shown so you can explore.
          <Link href="/dashboard/settings#data" className="font-black underline underline-offset-2">Clear sample data</Link>
        </p>
      )}
      {children}
    </Shell>
  );
}
