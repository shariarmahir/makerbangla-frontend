import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Icon } from "@/components/dashboard/icon";
import { Shell, type Alert } from "@/components/dashboard/shell";
import { canAccess, requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard" },
  robots: { index: false, follow: false },
};

/**
 * Entering the dashboard needs the session (read per request), so that navigation may block here.
 * Moving between dashboard pages stays instant: `loading.tsx` streams each page behind the shared frame.
 */
export const instant = false;

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
  if (pending && canAccess(user, "orders")) alerts.push({ text: `${pending} new order${pending > 1 ? "s" : ""} waiting for ${user.role === "admin" ? "your" : "the owner's"} approval`, href: "/dashboard/orders?status=pending", tone: "warn" });
  const urgent = db.tasks.filter((t) => t.priority === "emergency" && t.status !== "done" && (user.role === "admin" || t.assignee === user.id)).length;
  if (urgent) alerts.push({ text: `${urgent} emergency task${urgent > 1 ? "s" : ""} open`, href: "/dashboard/tasks", tone: "warn" });
  const leaves = db.leaves.filter((l) => l.status === "pending").length;
  if (leaves && user.role === "admin") alerts.push({ text: `${leaves} leave request${leaves > 1 ? "s" : ""} to review`, href: "/dashboard/team", tone: "info" });
  const low = db.products.filter((p) => p.active && p.stock <= 5).length;
  if (low && canAccess(user, "products")) alerts.push({ text: `${low} product${low > 1 ? "s are" : " is"} low on stock`, href: "/dashboard/products?stock=low", tone: "info" });
  const leads = db.leads.filter((l) => !l.approved && l.status === "new").length;
  if (leads && canAccess(user, "clients")) alerts.push({ text: `${leads} new lead${leads > 1 ? "s" : ""} to approve`, href: "/dashboard/clients", tone: "info" });

  const isAdmin = user.role === "admin";
  const assigned = db.tasks.filter((t) => t.assignee === user.id && t.response === "pending").length;
  if (assigned) alerts.unshift({ text: `${assigned} new task${assigned > 1 ? "s" : ""} assigned to you — accept or decline`, href: "/dashboard", tone: "warn" });
  const declined = isAdmin ? db.tasks.filter((t) => t.response === "declined" && t.status !== "done").length : 0;
  if (declined) alerts.push({ text: `${declined} task${declined > 1 ? "s were" : " was"} declined — reassign`, href: "/dashboard/tasks", tone: "warn" });
  const inbox = canAccess(user, "clients") ? db.contacts.filter((c) => c.status === "new").length : 0;
  if (inbox) alerts.push({ text: `${inbox} website message${inbox > 1 ? "s" : ""} to approve`, href: "/dashboard/inbox", tone: "info" });
  const reviews = canAccess(user, "clients") ? db.reviews.filter((r) => r.status === "pending" && !r.sample).length : 0;
  if (reviews) alerts.push({ text: `${reviews} customer review${reviews > 1 ? "s" : ""} waiting to be published`, href: "/dashboard/inbox?tab=reviews", tone: "info" });
  const badges: Record<string, number> = {
    "/dashboard/orders": canAccess(user, "orders") ? (isAdmin ? pending : db.orders.filter((o) => o.assignee === user.id && ["confirmed", "packed"].includes(o.status)).length) : 0,
    "/dashboard": assigned,
    "/dashboard/tasks": isAdmin ? declined + db.tasks.filter((t) => t.status === "review").length : db.tasks.filter((t) => t.assignee === user.id && t.status !== "done" && t.priority === "emergency").length,
    "/dashboard/inbox": inbox + reviews,
    "/dashboard/team": isAdmin ? leaves : 0,
    "/dashboard/clients": canAccess(user, "clients") ? leads : 0,
  };

  const hasSample = db.orders.some((o) => o.sample) || Object.keys(db.sampleVisits).length > 0;

  return (
    <Shell user={user} alerts={alerts} badges={badges}>
      {hasSample && user.role === "admin" && (
        <p className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl bg-tile-butter/70 px-4 py-2.5 text-[12.5px] font-semibold text-tile-navy ring-1 ring-tile-yellow">
          <Icon name="zap" className="size-4 shrink-0" />
          Sample orders, expenses, leads and traffic are shown so you can explore.
          <Link href="/dashboard/settings#data" className="font-black underline underline-offset-2">Clear sample data</Link>
        </p>
      )}
      {children}
    </Shell>
  );
}
