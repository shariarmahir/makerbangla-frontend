"use client";

import { useState } from "react";
import { Icon } from "./icon";
import { deleteTasks, moveTask, saveTask } from "@/lib/admin/actions/work";
import { priorities, taskStatuses, type Task, type TaskStatus } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { Btn, ConfirmButton, Field, input, Modal, textarea, useAction } from "./kit";
import { Avatar, Pill, type PillTone } from "./ui";

type Person = { id: string; name: string; photo?: string };

const columns: Record<TaskStatus, { label: string; dot: string; head: string }> = {
  todo: { label: "To do", dot: "bg-subtle", head: "bg-soft" },
  doing: { label: "In progress", dot: "bg-brand", head: "bg-tile-sky/60" },
  review: { label: "Review", dot: "bg-tile-yellow", head: "bg-tile-butter/70" },
  done: { label: "Done", dot: "bg-tile-navy", head: "bg-tile-navy/10" },
};
const priorityTone: Record<Task["priority"], PillTone> = { low: "neutral", normal: "confirmed", important: "pending", emergency: "warn" };

/** Kanban board. Staff see and move their own tasks and submit them for review; the super admin assigns and approves. */
export function TasksBoard({ tasks, people, me, isAdmin, today }: { tasks: Task[]; people: Person[]; me: string; isAdmin: boolean; today: string }) {
  const { pending, exec } = useAction();
  const [edit, setEdit] = useState<Partial<Task> | null>(null);
  const [submit, setSubmit] = useState<Task | null>(null);
  const [who, setWho] = useState("all");
  const person = (id: string) => people.find((p) => p.id === id) ?? { id, name: "Unassigned" };
  const shown = tasks.filter((t) => who === "all" || t.assignee === who);

  const move = (t: Task, dir: number) => {
    const next = taskStatuses[taskStatuses.indexOf(t.status) + dir];
    if (!next) return;
    if (next === "review" && !isAdmin) return setSubmit(t);
    exec(() => moveTask({ id: t.id, status: next }));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Btn tone="primary" onClick={() => setEdit({ priority: "normal", assignee: isAdmin ? "admin" : me })}><Icon name="plus" className="size-4" /> New task</Btn>
        {isAdmin && (
          <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Filter by person" className={cn(input, "w-auto min-w-44 bg-white")}>
            <option value="all">Everyone</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        {shown.some((t) => t.status === "done") && (
          <ConfirmButton label="Clear done" confirm="Clear all done" onConfirm={() => exec(() => deleteTasks({ ids: shown.filter((t) => t.status === "done").map((t) => t.id) }), "Done tasks cleared")} className="ml-auto" />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {taskStatuses.map((s) => {
          const list = shown.filter((t) => t.status === s).sort((a, b) => priorities.indexOf(b.priority) - priorities.indexOf(a.priority));
          return (
            <section key={s} className="flex min-w-0 flex-col rounded-[20px] bg-white p-3 ring-1 ring-line">
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
                  return (
                    <li key={t.id} className={cn("dash-rise rounded-2xl bg-white p-3 ring-1 ring-line transition-shadow hover:shadow-[0_14px_28px_-20px_rgb(14_31_77/0.6)]", t.priority === "emergency" && "ring-2 ring-tile-coral/60")}>
                      <div className="flex items-center gap-1.5">
                        <Pill tone={priorityTone[t.priority]}>{t.priority === "emergency" && <Icon name="flame" className="size-3" />}{t.priority}</Pill>
                        {mine && <button onClick={() => setEdit(t)} aria-label="Edit task" className="ml-auto grid size-7 place-items-center rounded-lg text-subtle hover:bg-soft hover:text-ink"><Icon name="file-pen-line" className="size-3.5" /></button>}
                      </div>
                      <p className="mt-2 text-[13px] leading-snug font-black text-ink">{t.title}</p>
                      {t.detail && <p className="mt-1 line-clamp-3 text-[12px] leading-snug text-subtle">{t.detail}</p>}
                      {t.submission && <p className="mt-2 rounded-lg bg-tile-butter/50 px-2 py-1.5 text-[11.5px] leading-snug text-tile-navy"><b>Submitted:</b> {t.submission}</p>}
                      <div className="mt-3 flex items-center gap-2">
                        <Avatar name={p.name} photo={"photo" in p ? p.photo : undefined} size={24} />
                        <span className="min-w-0 flex-1 truncate text-[11.5px] font-bold text-subtle">{p.name}</span>
                        {t.due && <span className={cn("flex items-center gap-1 text-[11px] font-bold", late ? "text-sale" : "text-subtle")}><Icon name="calendar-days" className="size-3" />{t.due.slice(5).replace("-", "/")}</span>}
                      </div>
                      {mine && (
                        <div className="mt-2.5 flex items-center gap-1 border-t border-line pt-2.5">
                          <Btn size="icon" tone="soft" aria-label="Move back" disabled={pending || s === "todo"} onClick={() => move(t, -1)}><Icon name="chevron-left" className="size-4" /></Btn>
                          {s === "doing" && !isAdmin ? (
                            <Btn size="sm" tone="accent" onClick={() => setSubmit(t)} className="flex-1"><Icon name="send" className="size-3.5" /> Submit</Btn>
                          ) : (
                            <Btn size="icon" tone="soft" aria-label="Move forward" disabled={pending || s === "done" || (s === "review" && !isAdmin && t.createdBy !== me)} onClick={() => move(t, 1)}><Icon name="chevron-right" className="size-4" /></Btn>
                          )}
                          <ConfirmButton size="icon" label="Delete task" onConfirm={() => exec(() => deleteTasks({ ids: [t.id] }), "Task deleted")} className="ml-auto" />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? "Edit task" : "New task"}>
        {edit && (
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              const r = await exec(() => saveTask({ ...f, id: edit.id }), edit.id ? "Task updated" : "Task created");
              if (r.ok) setEdit(null);
            }}
          >
            <Field label="Task" className="sm:col-span-2"><input name="title" required maxLength={140} defaultValue={edit.title} className={input} /></Field>
            <Field label="Details" className="sm:col-span-2"><textarea name="detail" maxLength={600} defaultValue={edit.detail} className={textarea} /></Field>
            <Field label="Priority">
              <select name="priority" defaultValue={edit.priority} className={input}>
                {priorities.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
              </select>
            </Field>
            <Field label="Due date"><input name="due" type="date" defaultValue={edit.due} className={input} /></Field>
            {isAdmin ? (
              <Field label="Assign to" className="sm:col-span-2">
                <select name="assignee" defaultValue={edit.assignee} className={input}>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            ) : (
              <input type="hidden" name="assignee" value={me} />
            )}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Btn onClick={() => setEdit(null)}>Cancel</Btn>
              <Btn type="submit" tone="primary" disabled={pending}>Save task</Btn>
            </div>
          </form>
        )}
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
