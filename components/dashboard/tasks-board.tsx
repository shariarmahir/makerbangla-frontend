"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { deleteTasks, moveTask, respondTask, saveTask } from "@/lib/admin/actions/work";
import { priorities, taskStatuses, type Task, type TaskStatus } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { Btn, ConfirmButton, Field, input, Modal, textarea, useAction } from "./kit";
import { Avatar, Pill, type PillTone } from "./ui";

export type Person = { id: string; name: string; photo?: string };
type Exec = ReturnType<typeof useAction>["exec"];

const columns: Record<TaskStatus, { label: string; dot: string; head: string }> = {
  todo: { label: "To do", dot: "bg-subtle", head: "bg-soft" },
  doing: { label: "In progress", dot: "bg-brand", head: "bg-tile-sky/60" },
  review: { label: "Review", dot: "bg-tile-yellow", head: "bg-tile-butter/70" },
  done: { label: "Done", dot: "bg-tile-navy", head: "bg-tile-navy/10" },
};
export const priorityTone: Record<Task["priority"], PillTone> = { low: "neutral", normal: "confirmed", important: "pending", emergency: "warn" };

/** Kanban board. Staff accept what they're given, move their own tasks and submit them for review; the super admin assigns and approves. */
export function TasksBoard({ tasks, people, me, isAdmin, today }: { tasks: Task[]; people: Person[]; me: string; isAdmin: boolean; today: string }) {
  const { pending, exec } = useAction();
  const [edit, setEdit] = useState<Partial<Task> | null>(null);
  const [submit, setSubmit] = useState<Task | null>(null);
  const [decline, setDecline] = useState<Task | null>(null);
  const [who, setWho] = useState("all");
  const person = (id: string) => people.find((p) => p.id === id) ?? { id, name: "Unassigned" };
  const shown = tasks.filter((t) => who === "all" || t.assignee === who);
  const declined = shown.filter((t) => t.response === "declined");

  const move = (t: Task, dir: number) => {
    const next = taskStatuses[taskStatuses.indexOf(t.status) + dir];
    if (!next) return;
    if (next === "review" && !isAdmin) return setSubmit(t);
    exec(() => moveTask({ id: t.id, status: next }));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Btn tone="primary" onClick={() => setEdit({ priority: "normal", assignee: isAdmin ? "admin" : me })}><Icon name="plus" className="size-4" /> {isAdmin ? "Assign task" : "New task"}</Btn>
        {isAdmin && (
          <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Filter by person" className={cn(input, "w-auto min-w-44 bg-white")}>
            <option value="all">Everyone</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        {isAdmin && declined.length > 0 && <span className="rounded-full bg-tile-coral px-3 py-1.5 text-[12px] font-black text-white">{declined.length} declined — reassign them</span>}
        {shown.some((t) => t.status === "done") && isAdmin && (
          <ConfirmButton label="Clear done" confirm="Clear all done" onConfirm={() => exec(() => deleteTasks({ ids: shown.filter((t) => t.status === "done").map((t) => t.id) }), "Done tasks cleared")} className="ml-auto" />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {taskStatuses.map((s) => {
          const list = shown.filter((t) => t.status === s).sort((a, b) => Number(b.response === "declined") - Number(a.response === "declined") || priorities.indexOf(b.priority) - priorities.indexOf(a.priority));
          return (
            <section key={s} className="flex min-w-0 flex-col rounded-[22px] bg-white p-3 ring-1 ring-line">
              <header className={cn("mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-black text-ink", columns[s].head)}>
                <span className={cn("size-2.5 rounded-full", columns[s].dot)} />
                {columns[s].label}
                <span className="ml-auto rounded-full bg-white px-2 text-[11px] tabular-nums">{list.length}</span>
              </header>
              <ul className="flex flex-1 flex-col gap-2.5">
                {list.length === 0 && <li className="rounded-xl border border-dashed border-line py-6 text-center text-[12px] font-semibold text-subtle">Nothing here</li>}
                {list.map((t) => {
                  const p = person(t.assignee);
                  const late = t.due && t.due < today && t.status !== "done";
                  const mine = isAdmin || t.assignee === me;
                  const waiting = t.response === "pending";
                  const answer = !isAdmin && waiting && t.assignee === me;
                  const canDelete = isAdmin || t.createdBy === me;
                  return (
                    <li key={t.id} data-anim className={cn("dash-rise rounded-2xl bg-white p-3 ring-1 ring-line transition-shadow hover:shadow-[0_14px_28px_-20px_rgb(14_31_77/0.6)]", t.priority === "emergency" && "ring-2 ring-tile-coral/60", t.response === "declined" && "bg-tile-coral/5 ring-tile-coral/50")}>
                      <div className="flex items-center gap-1.5">
                        <Pill tone={priorityTone[t.priority]}>{t.priority === "emergency" && <Icon name="flame" className="size-3" />}{t.priority}</Pill>
                        {waiting && <Pill tone="confirmed">{answer ? "New for you" : "Awaiting answer"}</Pill>}
                        {t.response === "declined" && <Pill tone="cancelled">Declined</Pill>}
                        {mine && !answer && <button onClick={() => setEdit(t)} aria-label="Edit task" className="ml-auto grid size-7 place-items-center rounded-lg text-subtle hover:bg-soft hover:text-ink"><Icon name="file-pen-line" className="size-3.5" /></button>}
                      </div>
                      <p className="mt-2 text-[13px] leading-snug font-black text-ink">{t.title}</p>
                      {t.detail && <p className="mt-1 line-clamp-3 text-[12px] leading-snug text-subtle">{t.detail}</p>}
                      {t.orderId && <p className="mt-1.5 flex items-center gap-1 text-[11.5px] font-black text-tile-navy"><Icon name="cart" className="size-3.5 text-brand" />{t.orderId}</p>}
                      {t.response === "declined" && t.declineReason && <p className="mt-2 rounded-lg bg-tile-coral/10 px-2 py-1.5 text-[11.5px] leading-snug text-sale"><b>Reason:</b> {t.declineReason}</p>}
                      {t.submission && <p className="mt-2 rounded-lg bg-tile-butter/50 px-2 py-1.5 text-[11.5px] leading-snug text-tile-navy"><b>Submitted:</b> {t.submission}</p>}
                      <div className="mt-3 flex items-center gap-2">
                        <Avatar name={p.name} photo={"photo" in p ? p.photo : undefined} size={24} />
                        <span className="min-w-0 flex-1 truncate text-[11.5px] font-bold text-subtle">{p.name}</span>
                        {t.due && <span className={cn("flex items-center gap-1 text-[11px] font-bold", late ? "text-sale" : "text-subtle")}><Icon name="calendar-days" className="size-3" />{t.due.slice(5).replace("-", "/")}</span>}
                      </div>
                      {answer ? (
                        <TaskAnswer task={t} exec={exec} pending={pending} onDecline={() => setDecline(t)} className="mt-2.5 border-t border-line pt-2.5" />
                      ) : (
                        mine && (
                          <div className="mt-2.5 flex items-center gap-1 border-t border-line pt-2.5">
                            <Btn size="icon" tone="soft" aria-label="Move back" disabled={pending || s === "todo" || (!isAdmin && t.response === "declined")} onClick={() => move(t, -1)}><Icon name="chevron-left" className="size-4" /></Btn>
                            {s === "doing" && !isAdmin ? (
                              <Btn size="sm" tone="accent" onClick={() => setSubmit(t)} className="flex-1"><Icon name="send" className="size-3.5" /> Submit</Btn>
                            ) : (
                              <Btn size="icon" tone="soft" aria-label="Move forward" disabled={pending || s === "done" || (s === "review" && !isAdmin && t.createdBy !== me) || (!isAdmin && t.response === "declined")} onClick={() => move(t, 1)}><Icon name="chevron-right" className="size-4" /></Btn>
                            )}
                            {canDelete && <ConfirmButton size="icon" label="Delete task" onConfirm={() => exec(() => deleteTasks({ ids: [t.id] }), "Task deleted")} className="ml-auto" />}
                          </div>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? "Edit task" : isAdmin ? "Assign a task" : "New task"}>
        {edit && <TaskForm task={edit} people={people} isAdmin={isAdmin} me={me} onDone={() => setEdit(null)} />}
      </Modal>
      <Modal open={!!decline} onOpenChange={(o) => !o && setDecline(null)} title="Decline task">
        {decline && <DeclineForm task={decline} onDone={() => setDecline(null)} />}
      </Modal>

      <Modal open={!!submit} onOpenChange={(o) => !o && setSubmit(null)} title="Submit for review">
        {submit && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const note = String(new FormData(e.currentTarget).get("submission") ?? "");
              const r = await exec(() => moveTask({ id: submit.id, status: "review", submission: note }), "Sent for review");
              if (r.ok) setSubmit(null);
            }}
          >
            <p className="text-[13px] font-bold text-ink">{submit.title}</p>
            <Field label="What did you do?"><textarea name="submission" required maxLength={600} className={textarea} placeholder="e.g. Packed 12 orders, handed to Pathao at 4 pm." /></Field>
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setSubmit(null)}>Cancel</Btn>
              <Btn type="submit" tone="accent" disabled={pending}><Icon name="send" className="size-4" /> Submit</Btn>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

/** Create or edit a task. Used by the board, Team (assign to a member) and order details (task about an order). */
export function TaskForm({ task, people, isAdmin, me, onDone }: { task: Partial<Task>; people: Person[]; isAdmin: boolean; me: string; onDone: () => void }) {
  const { pending, exec } = useAction();
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget));
        const r = await exec(() => saveTask({ ...f, id: task.id, orderId: task.orderId ?? "" }), task.id ? "Task updated" : f.assignee === me ? "Task created" : "Task sent — waiting for them to accept");
        if (r.ok) onDone();
      }}
    >
      <Field label="Task" className="sm:col-span-2"><input name="title" required maxLength={140} defaultValue={task.title} className={input} /></Field>
      <Field label="Details" className="sm:col-span-2"><textarea name="detail" maxLength={600} defaultValue={task.detail} className={textarea} /></Field>
      <Field label="Priority">
        <select name="priority" defaultValue={task.priority ?? "normal"} className={input}>
          {priorities.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
        </select>
      </Field>
      <Field label="Due date"><input name="due" type="date" defaultValue={task.due} className={input} /></Field>
      {isAdmin ? (
        <Field label="Assign to" className="sm:col-span-2" hint="Team members get a notification and accept or decline with a reason.">
          <select name="assignee" defaultValue={task.assignee} className={input}>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
      ) : (
        <input type="hidden" name="assignee" value={me} />
      )}
      {task.orderId && <p className="flex items-center gap-1.5 text-[12px] font-bold text-tile-navy sm:col-span-2"><Icon name="cart" className="size-3.5 text-brand" /> Linked to order {task.orderId}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Btn onClick={onDone}>Cancel</Btn>
        <Btn type="submit" tone="primary" disabled={pending}><Icon name="send" className="size-4" /> {task.id ? "Save task" : "Send task"}</Btn>
      </div>
    </form>
  );
}

/** Accept / decline buttons for a newly assigned task. */
export function TaskAnswer({ task, exec, pending, onDecline, className }: { task: Task; exec: Exec; pending: boolean; onDecline: () => void; className?: string }) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      <Btn size="sm" tone="danger" disabled={pending} onClick={onDecline}><X className="size-3.5" /> Decline</Btn>
      <Btn size="sm" tone="primary" className="flex-1" disabled={pending} onClick={() => exec(() => respondTask({ id: task.id, accept: true }), "Task accepted — it's in progress")}><Icon name="check" className="size-3.5" /> Accept</Btn>
    </div>
  );
}

const reasons = ["On leave that day", "Already at full workload", "Not my area — needs someone else", "Need more details first", "Can't meet the due date"];

export function DeclineForm({ task, onDone }: { task: Task; onDone: () => void }) {
  const { pending, exec } = useAction();
  const [reason, setReason] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await exec(() => respondTask({ id: task.id, accept: false, reason }), "Declined — the owner can see your reason");
        if (r.ok) onDone();
      }}
    >
      <p className="text-[13px] font-bold text-ink">{task.title}</p>
      <div className="flex flex-wrap gap-1.5">
        {reasons.map((r) => (
          <button key={r} type="button" onClick={() => setReason(r)} className={cn("h-8 rounded-full px-3 text-[12px] font-bold", reason === r ? "bg-tile-navy text-tile-yellow" : "bg-soft text-ink hover:bg-tile-sky/60")}>{r}</button>
        ))}
      </div>
      <Field label="Reason (required)"><textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} maxLength={300} className={textarea} /></Field>
      <div className="flex justify-end gap-2">
        <Btn onClick={onDone}>Back</Btn>
        <Btn type="submit" tone="danger" disabled={pending || reason.trim().length < 3}><X className="size-4" /> Decline task</Btn>
      </div>
    </form>
  );
}
