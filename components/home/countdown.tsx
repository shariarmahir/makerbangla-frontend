"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Counts down to the end of the current month in Dhaka time (UTC+6). */
function endOfMonthDhaka(now: number) {
  const d = new Date(now + 6 * 3600_000);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - 6 * 3600_000;
}

const units = [
  ["Days", 86400],
  ["Hours", 3600],
  ["Min", 60],
  ["Sec", 1],
] as const;

export function Countdown({ dark = false }: { dark?: boolean }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.floor((endOfMonthDhaka(Date.now()) - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <p className="mb-1.5 text-[10px] font-extrabold tracking-[0.16em] uppercase opacity-75">Sale ends in</p>
      <div className="inline-flex gap-1.5" role="timer" aria-live="off">
        {units.map(([label, size], i) => {
          const value = left === null ? null : i === 0 ? Math.floor(left / size) : Math.floor((left % units[i - 1][1]) / size);
          return (
            <span key={label} className={cn("flex w-11 flex-col items-center rounded-xl py-1.5 sm:w-12", dark ? "bg-white/12 ring-1 ring-white/15" : "bg-white/55 ring-1 ring-white/70")}>
              <span className="text-[16px] leading-tight font-black tabular-nums">{value === null ? "--" : String(value).padStart(2, "0")}</span>
              <span className="text-[8px] font-bold tracking-wide uppercase opacity-70">{label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
