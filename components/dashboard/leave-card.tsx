"use client";

import { useState } from "react";
import { Icon } from "./icon";
import { requestLeave } from "@/lib/admin/actions/people";
import type { Leave } from "@/lib/admin/types";
import { Btn, Field, input, textarea, useAction } from "./kit";
import { Pill } from "./ui";

const tone = { pending: "pending", approved: "delivered", rejected: "cancelled" } as const;
const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** Employee leave: request form + status of past requests. */
export function LeaveCard({ leaves }: { leaves: Leave[] }) {
  const [open, setOpen] = useState(false);
  const { pending, exec } = useAction();
  return (
    <div>
      {open ? (
        <form
          className="mb-4 grid grid-cols-2 gap-2.5 rounded-2xl bg-soft p-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await exec(() => requestLeave(Object.fromEntries(new FormData(e.currentTarget))), "Leave request sent");
            if (r.ok) setOpen(false);
          }}
        >
          <Field label="From"><input name="from" type="date" required className={input} /></Field>
          <Field label="To"><input name="to" type="date" required className={input} /></Field>
          <Field label="Reason" className="col-span-2"><textarea name="reason" required maxLength={200} className={textarea} /></Field>
          <div className="col-span-2 flex justify-end gap-2">
            <Btn size="sm" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn size="sm" type="submit" tone="primary" disabled={pending}>Send request</Btn>
          </div>
        </form>
      ) : (
        <Btn tone="accent" className="mb-4 w-full" onClick={() => setOpen(true)}><Icon name="send" className="size-4" /> Request leave</Btn>
      )}
      <ul className="space-y-2">
        {leaves.length === 0 && <li className="text-[12.5px] font-semibold text-subtle">No leave requests yet.</li>}
        {leaves.map((l) => (
          <li key={l.id} className="flex items-center gap-3 rounded-xl bg-soft px-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-black text-ink">{fmt(l.from)}{l.to !== l.from && ` → ${fmt(l.to)}`}</span>
              <span className="block truncate text-[11.5px] text-subtle">{l.reason}</span>
            </span>
            <Pill tone={tone[l.status]}>{l.status}</Pill>
          </li>
        ))}
      </ul>
    </div>
  );
}
