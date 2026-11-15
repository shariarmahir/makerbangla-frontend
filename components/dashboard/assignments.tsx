"use client";

import { useState } from "react";
import type { Task } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { Modal, useAction } from "./kit";
import { DeclineForm, priorityTone, TaskAnswer } from "./tasks-board";
import { Pill } from "./ui";

/** Employee home: tasks the owner just assigned, each waiting for Accept or Decline (with a reason). */
export function Assignments({ tasks, from }: { tasks: Task[]; from: Record<string, string> }) {
  const { pending, exec } = useAction();
  const [decline, setDecline] = useState<Task | null>(null);
  if (!tasks.length) return null;
  return (
    <section aria-label="New task assignments" className="dash-rise overflow-hidden rounded-[24px] bg-tile-butter/60 p-4 ring-2 ring-tile-yellow sm:p-5">
      <h2 className="mb-3 flex items-center gap-2.5 text-[15px] font-black text-tile-navy">
        <span className="relative grid size-9 place-items-center rounded-xl bg-tile-yellow text-tile-navy">
          <Icon name="bell" className="size-4.5" />
          <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-tile-coral px-1 text-[10.5px] leading-5 text-white">{tasks.length}</span>
        </span>
        New task{tasks.length === 1 ? "" : "s"} for you
      </h2>
      <ul className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {tasks.map((t) => (
          <li key={t.id} data-anim className={cn("flex flex-col rounded-2xl bg-white p-3.5 shadow-[0_12px_26px_-22px_rgb(14_31_77/0.8)] ring-1 ring-line", t.priority === "emergency" && "ring-2 ring-tile-coral/60")}>
            <div className="flex items-center gap-1.5">
              <Pill tone={priorityTone[t.priority]}>{t.priority === "emergency" && <Icon name="flame" className="size-3" />}{t.priority}</Pill>
              {t.due && <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-subtle"><Icon name="calendar-days" className="size-3" />Due {t.due.slice(5).replace("-", "/")}</span>}
            </div>
            <p className="mt-2 text-[13.5px] leading-snug font-black text-ink">{t.title}</p>
            {t.detail && <p className="mt-1 line-clamp-3 text-[12px] leading-snug text-subtle">{t.detail}</p>}
            {t.orderId && <p className="mt-1.5 flex items-center gap-1 text-[11.5px] font-black text-tile-navy"><Icon name="cart" className="size-3.5 text-brand" />{t.orderId}</p>}
            <p className="mt-2 text-[11px] font-semibold text-subtle">From {from[t.createdBy] ?? "the owner"}</p>
            <TaskAnswer task={t} exec={exec} pending={pending} onDecline={() => setDecline(t)} className="mt-auto pt-3" />
          </li>
        ))}
      </ul>
      <Modal open={!!decline} onOpenChange={(o) => !o && setDecline(null)} title="Decline task">
        {decline && <DeclineForm task={decline} onDone={() => setDecline(null)} />}
      </Modal>
    </section>
  );
}
