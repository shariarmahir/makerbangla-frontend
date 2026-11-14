"use client";

import Form from "next/form";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Cpu, RotateCcw } from "lucide-react";
import { MagicButton } from "@/components/ui/magic-button";
import { cn } from "@/lib/utils";

export type FinderField = { name: "category" | "voltage" | "interface" | "application"; label: string; options: (readonly [string, string])[] };
/** [category, voltages, interfaces, applications] */
export type FinderRow = [string, readonly string[], readonly string[], readonly string[]];

const col = { category: 0, voltage: 1, interface: 2, application: 3 } as const;
type Picks = Partial<Record<FinderField["name"], string>>;

function matches(row: FinderRow, picks: Picks) {
  return (Object.entries(picks) as [FinderField["name"], string][]).every(([k, v]) => {
    if (!v) return true;
    const cell = row[col[k]];
    return typeof cell === "string" ? cell === v : cell.includes(v);
  });
}

export function FinderForm({ fields, index }: { fields: FinderField[]; index: FinderRow[] }) {
  const [picks, setPicks] = useState<Picks>({});
  const count = useMemo(() => index.filter((r) => matches(r, picks)).length, [index, picks]);
  const active = Object.values(picks).some(Boolean);

  return (
    <Form action="/shop" className="container-x relative grid grid-cols-2 items-center gap-2.5 py-4 md:grid-cols-[auto_repeat(4,1fr)_auto] md:gap-3 md:py-5">
      <h2 id="finder-title" className="col-span-2 flex items-center gap-3 md:col-span-1 md:pr-2">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-accent-yellow">
          <Cpu className="size-5" strokeWidth={1.8} />
        </span>
        <span className="text-[14px] leading-tight font-extrabold">
          Find Your<br className="hidden md:block" /> Component
        </span>
        {active && (
          <button type="button" onClick={() => setPicks({})} className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold underline-offset-2 hover:underline md:hidden">
            <RotateCcw className="size-3" /> Reset
          </button>
        )}
      </h2>

      {fields.map((f, i) => {
        // An option stays enabled only if choosing it still leaves at least one product.
        const others = { ...picks, [f.name]: undefined };
        return (
          <label key={f.name} className="relative flex h-11 items-center rounded-md bg-white shadow-[0_2px_0_rgb(0_0_0/0.08)] ring-1 ring-ink/5 transition-shadow focus-within:ring-2 focus-within:ring-ink">
            <span className={cn("ml-2.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold", picks[f.name] ? "bg-brand text-white" : "bg-ink text-white")}>{i + 1}</span>
            <span className="sr-only">{f.label}</span>
            <select
              name={f.name}
              value={picks[f.name] ?? ""}
              onChange={(e) => setPicks((p) => ({ ...p, [f.name]: e.target.value || undefined }))}
              className="h-full w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent pr-8 pl-2 text-[12.5px] font-medium outline-none"
            >
              <option value="">{f.label}</option>
              {f.options.map(([value, text]) => {
                const n = index.filter((r) => matches(r, { ...others, [f.name]: value })).length;
                return (
                  <option key={value} value={value} disabled={n === 0}>
                    {text} ({n})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 size-4" />
          </label>
        );
      })}

      <MagicButton type="submit" disabled={count === 0} rainbow={active} className="col-span-2 md:col-span-1" faceClassName="h-11 uppercase tracking-wide">
        {active ? <>Show {count} <span className="normal-case">parts</span></> : "Go"} <ArrowRight className="size-4" />
      </MagicButton>
    </Form>
  );
}
