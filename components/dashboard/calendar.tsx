"use client";

import { useState } from "react";
import { Icon } from "./icon";
import { deleteNote, saveNote, toggleNotePin } from "@/lib/admin/actions/work";
import { noteColors, type Note } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { Btn, ConfirmButton, Field, input, useAction } from "./kit";

export const noteTone: Record<Note["color"], string> = {
  yellow: "bg-tile-yellow text-tile-navy",
  blue: "bg-brand text-white",
  navy: "bg-tile-navy text-tile-yellow",
  coral: "bg-tile-coral text-white",
  sky: "bg-tile-sky text-tile-navy",
};

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Opens Google Calendar with the note pre-filled, so it can be saved with Google's own reminders. */
export function googleLink(n: Pick<Note, "title" | "date" | "time">) {
  const d = n.date.replace(/-/g, "");
  let dates: string;
  if (n.time) {
    const [h, m] = n.time.split(":").map(Number);
    const end = `${pad(Math.min(23, h + 1))}${pad(m)}00`;
    dates = `${d}T${pad(h)}${pad(m)}00/${d}T${end}`;
  } else {
    const next = new Date(`${n.date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    dates = `${d}/${next.toISOString().slice(0, 10).replace(/-/g, "")}`;
  }
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: "TEMPLATE", text: n.title, dates, ctz: "Asia/Dhaka", details: "From the Makerbangla dashboard" })}`;
}

/** Colourful month calendar with notes. Click a day to see, add, pin or remove its notes. */
export function Calendar({ notes, today, compact }: { notes: Note[]; today: string; compact?: boolean }) {
  const [ty, tm] = today.split("-").map(Number);
  const [view, setView] = useState({ y: ty, m: tm - 1 });
  const [selected, setSelected] = useState(today);
  const [adding, setAdding] = useState(false);
  const { pending, exec } = useAction();

  const first = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay(); // 0 = Sunday
  const daysIn = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((first + daysIn) / 7) * 7 }, (_, i) => i - first + 1);
  const byDay = new Map<string, Note[]>();
  notes.forEach((n) => byDay.set(n.date, [...(byDay.get(n.date) ?? []), n]));
  const dayNotes = (byDay.get(selected) ?? []).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const step = (d: number) => setView((v) => ({ y: v.m + d < 0 ? v.y - 1 : v.m + d > 11 ? v.y + 1 : v.y, m: (v.m + d + 12) % 12 }));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[14px] font-black text-ink">{new Date(Date.UTC(view.y, view.m, 1)).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}</p>
        <div className="flex gap-1">
          <Btn size="icon" tone="soft" aria-label="Previous month" onClick={() => step(-1)}><Icon name="chevron-left" className="size-4" /></Btn>
          <Btn size="icon" tone="soft" aria-label="Next month" onClick={() => step(1)}><Icon name="chevron-right" className="size-4" /></Btn>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] font-black text-subtle uppercase">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <span key={d} className="pb-1">{d}</span>)}
        {cells.map((d, i) => {
          if (d < 1 || d > daysIn) return <span key={i} />;
          const k = keyOf(view.y, view.m, d);
          const list = byDay.get(k) ?? [];
          return (
            <button
              key={i}
              onClick={() => setSelected(k)}
              aria-label={`${k}${list.length ? `, ${list.length} note${list.length > 1 ? "s" : ""}` : ""}`}
              aria-pressed={selected === k}
              className={cn(
                "relative flex flex-col items-center justify-start gap-1 rounded-xl text-[12.5px] font-bold text-ink transition-colors",
                compact ? "h-10 pt-1.5" : "h-14 pt-2",
                selected === k ? "bg-tile-navy text-tile-yellow" : k === today ? "bg-tile-yellow text-tile-navy" : "hover:bg-soft",
              )}
            >
              {d}
              <span className="flex gap-0.5">
                {list.slice(0, 3).map((n) => <span key={n.id} className={cn("size-1.5 rounded-full ring-1 ring-white/60", noteTone[n.color].split(" ")[0])} />)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-[12.5px] font-black text-ink">{new Date(`${selected}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</p>
          <Btn size="sm" tone="accent" onClick={() => setAdding((a) => !a)}><Icon name="plus" className="size-3.5" /> Note</Btn>
        </div>
        {adding && (
          <form
            className="mb-3 grid grid-cols-[1fr_auto] gap-2 rounded-2xl bg-soft p-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const r = await exec(() => saveNote({ date: selected, title: String(f.get("title")), time: String(f.get("time") ?? ""), color: String(f.get("color")), pinned: f.get("pinned") === "on" }), "Note added");
              if (r.ok) setAdding(false);
            }}
          >
            <Field label="Note" className="col-span-2"><input name="title" required maxLength={120} className={cn(input, "bg-white")} placeholder="e.g. Supplier call" /></Field>
            <Field label="Time"><input name="time" type="time" className={cn(input, "bg-white")} /></Field>
            <label className="mt-6 flex items-center gap-1.5 text-[12px] font-bold text-ink"><input name="pinned" type="checkbox" className="size-4 accent-[var(--color-tile-navy)]" /> Pin</label>
            <fieldset className="col-span-2 flex items-center gap-2">
              <legend className="sr-only">Colour</legend>
              {noteColors.map((c, i) => (
                <label key={c} className="cursor-pointer">
                  <input type="radio" name="color" value={c} defaultChecked={i === 0} className="peer sr-only" />
                  <span className={cn("block size-7 rounded-full ring-2 ring-transparent ring-offset-2 peer-checked:ring-tile-navy peer-focus-visible:ring-brand", noteTone[c].split(" ")[0])} title={c} />
                </label>
              ))}
              <Btn type="submit" tone="primary" size="sm" disabled={pending} className="ml-auto">Save</Btn>
            </fieldset>
          </form>
        )}
        <ul className="space-y-2">
          {dayNotes.length === 0 && !adding && <li className="text-[12.5px] font-semibold text-subtle">No notes for this day.</li>}
          {dayNotes.map((n) => (
            <li key={n.id} className={cn("flex items-center gap-2 rounded-xl px-3 py-2", noteTone[n.color])}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-black">{n.title}</span>
                {n.time && <span className="text-[11px] font-bold opacity-80">{n.time}</span>}
              </span>
              <a href={googleLink(n)} target="_blank" rel="noopener noreferrer" title="Add to Google Calendar with a reminder" aria-label="Add to Google Calendar" className="grid size-7 place-items-center rounded-lg hover:bg-black/10"><Icon name="bell" className="size-3.5" /></a>
              <button onClick={() => exec(() => toggleNotePin({ id: n.id }))} aria-label={n.pinned ? "Unpin" : "Pin"} className="grid size-7 place-items-center rounded-lg hover:bg-black/10">{n.pinned ? <Icon name="bookmark-minus" className="size-3.5" /> : <Icon name="bookmark" className="size-3.5" />}</button>
              <ConfirmButton size="icon" label="Delete note" confirm="Delete" onConfirm={() => exec(() => deleteNote({ id: n.id }), "Note deleted")} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PinnedNotes({ notes }: { notes: Note[] }) {
  const pinned = notes.filter((n) => n.pinned).sort((a, b) => a.date.localeCompare(b.date));
  if (!pinned.length) return <p className="text-[12.5px] font-semibold text-subtle">Pin a note from the calendar to keep it here.</p>;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {pinned.map((n) => (
        <li key={n.id} className={cn("relative rounded-2xl p-3.5 pr-9 shadow-[0_12px_24px_-18px_rgb(14_31_77/0.7)]", noteTone[n.color])}>
          <Icon name="bookmark" className="absolute top-3 right-3 size-3.5 rotate-45" />
          <p className="text-[13px] leading-snug font-black">{n.title}</p>
          <p className="mt-1 text-[11px] font-bold opacity-80">
            {new Date(`${n.date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
            {n.time && ` · ${n.time}`}
          </p>
          <a href={googleLink(n)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] font-black underline underline-offset-2">
            <Icon name="bell" className="size-3" /> Google reminder
          </a>
        </li>
      ))}
    </ul>
  );
}
