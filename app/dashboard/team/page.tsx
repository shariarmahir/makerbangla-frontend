import { TeamManager } from "@/components/dashboard/team-manager";
import { PageHeader } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";
import { sections } from "@/lib/admin/types";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  await requireUser("admin");
  const db = await readDb();
  // Never send password hashes or session versions to the browser.
  const members = db.employees.map((e) => ({
    id: e.id, username: e.username, name: e.name, designation: e.designation, email: e.email, phone: e.phone, photo: e.photo,
    access: e.access.filter((a) => a in sections), active: e.active, lastLogin: e.lastLogin, sample: e.sample,
    open: db.tasks.filter((t) => t.assignee === e.id && t.status !== "done").length,
    done: db.tasks.filter((t) => t.assignee === e.id && t.status === "done").length,
    waiting: db.tasks.filter((t) => t.assignee === e.id && t.response === "pending").length,
    declined: db.tasks.filter((t) => t.assignee === e.id && t.response === "declined" && t.status !== "done").length,
  }));
  const leaves = db.leaves
    .map((l) => {
      const e = db.employees.find((x) => x.id === l.employeeId);
      return { ...l, name: e?.name ?? "Former member", photo: e?.photo };
    })
    .sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending") || b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Team" />
      <TeamManager members={members} leaves={leaves} />
    </>
  );
}
