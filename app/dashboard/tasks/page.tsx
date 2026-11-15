import { Calendar, PinnedNotes } from "@/components/dashboard/calendar";
import { TasksBoard } from "@/components/dashboard/tasks-board";
import { Card, Kpi, PageHeader } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/admin/auth";
import { readDb } from "@/lib/admin/db";
import { dayKey, requestNow } from "@/lib/admin/metrics";

export const metadata = { title: "Tasks & calendar" };

export default async function TasksPage() {
  const user = await requireUser();
  const db = await readDb();
  const today = dayKey(await requestNow());
  const isAdmin = user.role === "admin";
  const tasks = isAdmin ? db.tasks : db.tasks.filter((t) => t.assignee === user.id);
  const people = [{ id: "admin", name: db.profile.name, photo: db.profile.photo }, ...db.employees.filter((e) => e.active).map((e) => ({ id: e.id, name: e.name, photo: e.photo }))];
  const notes = db.notes.filter((n) => n.owner === user.id);
  const open = tasks.filter((t) => t.status !== "done");

  return (
    <>
      <PageHeader title="Tasks & calendar" />
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi icon="clipboard-check" label="Open tasks" value={String(open.length)} tone="blue" />
          <Kpi icon="alarm-clock" label="Due today" value={String(open.filter((t) => t.due === today).length)} tone="yellow" foot={`${open.filter((t) => t.due && t.due < today).length} overdue`} />
          <Kpi icon="flame" label="Emergency" value={String(open.filter((t) => t.priority === "emergency").length)} tone="coral" foot={`${open.filter((t) => t.priority === "important").length} important`} />
          <Kpi icon="circle-check" label="Waiting for review" value={String(tasks.filter((t) => t.status === "review").length)} tone="navy" />
        </div>
        <TasksBoard tasks={tasks} people={people} me={user.id} isAdmin={isAdmin} today={today} />
        <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
          <Card title="Calendar"><Calendar notes={notes} today={today} /></Card>
          <Card title="Pinned & emergency notes"><PinnedNotes notes={notes} /></Card>
        </div>
      </div>
    </>
  );
}
