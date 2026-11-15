import { InboxManager } from "@/components/dashboard/inbox-manager";
import { Kpi, PageHeader } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";
import { mailReady } from "@/lib/admin/mail";
import { DAY, requestNow } from "@/lib/admin/metrics";

export const metadata = { title: "Inbox & email" };

export default async function InboxPage() {
  const user = await requireUser("clients");
  const db = await readDb();
  const now = await requestNow();
  const month = db.mails.filter((m) => Date.parse(m.at) > now - 30 * DAY);
  // Everyone the team may want to write to: customers with an email, then leads.
  const seen = new Set<string>();
  const recipients = [...db.orders.map((o) => ({ email: o.customer.email, name: o.customer.name })), ...db.leads.map((l) => ({ email: l.email, name: l.name }))]
    .filter((r): r is { email: string; name: string } => !!r.email && !seen.has(r.email.toLowerCase()) && !!seen.add(r.email.toLowerCase()))
    .slice(0, 400);
  const answered = db.contacts.filter((c) => c.replies.length);
  const hours = answered.length ? answered.reduce((n, c) => n + (Date.parse(c.replies[0].at) - Date.parse(c.createdAt)), 0) / answered.length / 3_600_000 : 0;

  return (
    <>
      <PageHeader title="Inbox & email" />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Kpi icon="hourglass" label="Needs approval" value={String(db.contacts.filter((c) => c.status === "new").length)} tone="yellow" foot={`${db.contacts.filter((c) => c.status === "spam").length} in spam`} />
        <Kpi icon="mail-check" label="Approved, not replied" value={String(db.contacts.filter((c) => c.status === "approved").length)} tone="blue" />
        <Kpi icon="clock" label="Average first reply" value={answered.length ? `${hours < 1 ? "<1" : Math.round(hours)} h` : "—"} tone="navy" foot={`${answered.length} conversation${answered.length === 1 ? "" : "s"}`} />
        <Kpi icon="send" label="Emails · 30 days" value={String(month.length)} tone="coral" foot={`${month.filter((m) => m.sent).length} sent from here`} />
      </div>
      <InboxManager contacts={db.contacts} mails={db.mails} recipients={recipients} mailReady={mailReady()} isAdmin={user.role === "admin"} />
    </>
  );
}
