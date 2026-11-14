"use client";

import { useEffect, useState } from "react";

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

export function Countdown() {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.floor((endOfMonthDhaka(Date.now()) - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <p className="mb-1.5 text-[10.5px] text-subtle">Sale ends in</p>
      <div className="inline-flex divide-x divide-line border border-line" role="timer" aria-live="off">
        {units.map(([label, size], i) => {
          const value = left === null ? null : i === 0 ? Math.floor(left / size) : Math.floor((left % units[i - 1][1]) / size);
          return (
            <span key={label} className="flex w-11 flex-col items-center py-1">
              <span className="text-[14px] font-bold text-sale tabular-nums">{value === null ? "--" : String(value).padStart(2, "0")}</span>
              <span className="text-[8.5px] tracking-wide text-subtle uppercase">{label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
