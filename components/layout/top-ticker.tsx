"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export type TickerItem = {
  icon: "featured" | "offer" | "delivery" | "new" | "deadline" | "equipment";
  text: string;
  /** Short bold lead-in, e.g. "22% OFF". */
  lead?: string;
  href: string;
};

/** Greeting by the hour in Dhaka, with a line of motivation for students and makers. */
function greeting(hour: number) {
  if (hour >= 5 && hour < 12) return { text: "Good morning, maker — a fresh day to build something new." };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon — keep going, your next project is one part away." };
  if (hour >= 17 && hour < 21) return { text: "Good evening — the perfect time to finish that circuit." };
  return { text: "Working late? Great engineers are made on nights like this." };
}

const dhakaHour = () => Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Dhaka" }).format(new Date()));
/** Re-read the hour once a minute; null on the server so the first paint is the plain welcome line. */
const subscribeHour = (cb: () => void) => {
  const t = setInterval(cb, 60_000);
  return () => clearInterval(t);
};
const serverHour = () => null;

/** End of the current month in Dhaka time (UTC+6) — when the monthly deals close. */
function monthEnd(now: number) {
  const d = new Date(now + 6 * 3600_000);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - 6 * 3600_000;
}

function useDeadline(active: boolean) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const s = Math.max(0, Math.floor((monthEnd(Date.now()) - Date.now()) / 1000));
      const p = (n: number) => String(n).padStart(2, "0");
      setLeft(`${Math.floor(s / 86400)}d ${p(Math.floor((s % 86400) / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [active]);
  return left;
}

export function TopTicker({ items, fallback }: { items: TickerItem[]; fallback: string }) {
  const hour = useSyncExternalStore(subscribeHour, dhakaHour, serverHour);
  const [i, setI] = useState(0);
  const paused = useRef(false);
  const total = items.length + 1; // greeting first, then the store messages

  useEffect(() => {
    const t = setInterval(() => {
      if (!paused.current && !document.hidden) setI((n) => (n + 1) % total);
    }, 4800);
    return () => clearInterval(t);
  }, [total]);

  const item = i === 0 ? null : items[i - 1];
  const deadline = useDeadline(item?.icon === "deadline");

  // Before hydration (and for crawlers) show the plain welcome line.
  if (hour === null) return <p className="truncate">{fallback}</p>;

  const g = greeting(hour);

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="relative h-full min-w-0 flex-1 overflow-hidden"
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => (paused.current = false)}
        onFocus={() => (paused.current = true)}
        onBlur={() => (paused.current = false)}
        aria-live="off"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={i}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center"
          >
            {item ? (
              <Link href={item.href} className="group flex min-w-0 items-center gap-2">
                {item.lead && <span className="shrink-0 rounded-md bg-tile-navy px-1.5 py-0.5 text-[10.5px] font-black tracking-wide text-tile-yellow uppercase">{item.lead}</span>}
                <span className="truncate">
                  {item.text}
                  {item.icon === "deadline" && deadline && <span className="ml-1.5 font-black tabular-nums">{deadline}</span>}
                </span>
                <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2.6} />
              </Link>
            ) : (
              <p className="truncate">{g.text}</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
