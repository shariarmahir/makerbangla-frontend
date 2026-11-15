"use client";

import Link from "next/link";
import { useState } from "react";
import { approveOrders } from "@/lib/admin/actions/orders";
import { decideLeave, updateLead } from "@/lib/admin/actions/people";
import { bdt, cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";
import { Btn, useAction } from "./kit";
import { Avatar, Empty } from "./ui";

export type Decision =
  | { kind: "order"; id: string; title: string; sub: string; amount: number; at: string }
  | { kind: "leave"; id: string; title: string; sub: string; at: string }
  | { kind: "lead"; id: string; title: string; sub: string; amount?: number; at: string };

const tabs: { kind: Decision["kind"]; label: string; icon: IconName; href: string }[] = [
  { kind: "order", label: "New orders", icon: "cart", href: "/dashboard/orders" },
  { kind: "leave", label: "Leave", icon: "calendar-days", href: "/dashboard/team" },
  { kind: "lead", label: "Contacts & leads", icon: "user-round-check", href: "/dashboard/clients" },
];

/** The owner's inbox: everything that waits on a yes or no, decided in one click. */
export function Approvals({ items }: { items: Decision[] }) {
  const [kind, setKind] = useState<Decision["kind"]>(items.find((i) => i.kind === "order") ? "order" : (items[0]?.kind ?? "order"));
  const { pending, exec } = useAction();
  const shown = items.filter((i) => i.kind === kind);
  const tab = tabs.find((t) => t.kind === kind)!;

  const yes = (d: Decision) =>
    d.kind === "order" ? exec(() => approveOrders({ ids: [d.id] }), "Order approved and assigned") : d.kind === "leave" ? exec(() => decideLeave({ id: d.id, status: "approved" }), "Leave approved") : exec(() => updateLead({ id: d.id, approved: true }), "Contact approved");
  const no = (d: Decision) => (d.kind === "leave" ? exec(() => decideLeave({ id: d.id, status: "rejected" }), "Leave declined") : exec(() => updateLead({ id: d.id, status: "lost" }), "Lead closed"));

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const n = items.filter((i) => i.kind === t.kind).length;
          return (
            <button key={t.kind} onClick={() => setKind(t.kind)} aria-pressed={kind === t.kind} className={cn("flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-black transition-colors", kind === t.kind ? "bg-tile-navy text-tile-yellow" : "bg-soft text-subtle hover:text-ink")}>
              <Icon name={t.icon} className="size-4" /> {t.label}
              <span className={cn("rounded-full px-1.5 text-[10.5px] tabular-nums", n ? (kind === t.kind ? "bg-tile-yellow text-tile-navy" : "bg-tile-coral text-white") : "bg-white/60")}>{n}</span>
            </button>
          );
        })}
      </div>
      {shown.length === 0 ? (
        <Empty>Nothing waiting. Nice.</Empty>
      ) : (
        <ul className="space-y-2">
          {shown.slice(0, 6).map((d) => (
            <li key={d.id} data-anim className="dash-rise flex items-center gap-3 rounded-2xl bg-soft/70 p-2.5 pr-3 ring-1 ring-transparent transition-shadow hover:bg-white hover:ring-line">
              <Avatar name={d.title} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-black text-ink">{d.title}</p>
                <p className="truncate text-[11.5px] font-semibold text-subtle">{d.sub}</p>
              </div>
              {"amount" in d && d.amount ? <b className="hidden text-[13px] text-ink tabular-nums sm:block">{bdt(d.amount)}</b> : null}
              <span className="flex shrink-0 gap-1">
                {d.kind === "order" ? (
                  <Link href={`/dashboard/orders?tab=board`} aria-label={`Review ${d.id}`} className="grid size-8 place-items-center rounded-xl bg-white text-tile-navy ring-1 ring-line hover:bg-tile-sky/60"><Icon name="eye" className="size-4" /></Link>
                ) : (
                  <Btn size="icon" tone="danger" aria-label={`Decline ${d.title}`} disabled={pending} onClick={() => no(d)}><Icon name="ban" className="size-3.5" /></Btn>
                )}
                <Btn size="sm" tone="primary" disabled={pending} onClick={() => yes(d)}><Icon name="check" className="size-3.5" /> Approve</Btn>
              </span>
            </li>
          ))}
        </ul>
      )}
      {shown.length > 6 && <Link href={tab.href} className="mt-3 inline-flex items-center gap-1 text-[12px] font-black text-brand hover:underline">All {shown.length} <Icon name="arrow-right" className="size-3.5" /></Link>}
    </div>
  );
}
