"use client";

import { useEffect, useRef, useState } from "react";
import { MessagesSquare, SendHorizontal, X } from "lucide-react";
import { getMessages, sendMessage } from "@/lib/admin/actions/work";
import type { Message } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { toast } from "./kit";
import { Avatar } from "./ui";

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" });

/** Team chat popup for quick office talk. Polls every 4 s while open, every 20 s for the unread badge. */
export function Chat({ me }: { me: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [seen, setSeen] = useState("");
  const [text, setText] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const last = msgs.at(-1)?.at ?? "";

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      if (document.hidden) return;
      try {
        const fresh = await getMessages(last);
        if (!alive || !fresh.length) return;
        setMsgs((m) => [...m, ...fresh.filter((f) => !m.some((x) => x.id === f.id))].slice(-200));
        if (!last) setSeen((s) => s || fresh.at(-1)!.at); // history from before this visit isn't "new"
      } catch {}
    };
    pull();
    const t = setInterval(pull, open ? 4000 : 20000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [open, last]);

  useEffect(() => {
    if (open) list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [open, msgs.length]);

  const unread = open ? 0 : msgs.filter((m) => m.at > seen && m.from !== me).length;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    const r = await sendMessage({ text: t });
    if (r.ok) setMsgs((m) => (m.some((x) => x.id === r.data.id) ? m : [...m, r.data]));
    else toast(r.error, false);
  };

  return (
    <>
      {open && (
        <section aria-label="Team chat" className="dash-rise fixed right-3 bottom-24 z-50 flex h-[min(520px,70dvh)] w-[min(92vw,370px)] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_30px_70px_-20px_rgb(14_31_77/0.5)] ring-1 ring-line sm:right-6">
          <header className="flex items-center justify-between bg-tile-navy px-4 py-3.5 text-tile-yellow">
            <p className="flex items-center gap-2 text-[14px] font-black"><MessagesSquare className="size-4.5" /> Team chat</p>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="grid size-8 place-items-center rounded-full hover:bg-white/10"><X className="size-4.5" /></button>
          </header>
          <div ref={list} className="flex-1 space-y-3 overflow-y-auto bg-soft/60 px-3 py-4">
            {msgs.length === 0 && <p className="pt-10 text-center text-[12.5px] font-semibold text-subtle">No messages yet. Say hello to the team.</p>}
            {msgs.map((m) => {
              const mine = m.from === me;
              return (
                <div key={m.id} className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                  {!mine && <Avatar name={m.name} size={26} />}
                  <div className={cn("max-w-[78%] rounded-2xl px-3 py-2 text-[13px] leading-snug", mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-white text-ink ring-1 ring-line")}>
                    {!mine && <p className="mb-0.5 text-[11px] font-black text-brand-strong">{m.name}</p>}
                    <p className="break-words whitespace-pre-wrap">{m.text}</p>
                    <p className={cn("mt-1 text-right text-[10px] font-semibold", mine ? "text-white/70" : "text-subtle")}>{time(m.at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <form onSubmit={send} className="flex items-center gap-2 border-t border-line p-2.5">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={600} placeholder="Write a message…" aria-label="Message" className="h-10 min-w-0 flex-1 rounded-xl bg-soft px-3 text-[13px] font-semibold outline-none focus:ring-2 focus:ring-brand" />
            <button aria-label="Send" className="grid size-10 shrink-0 place-items-center rounded-xl bg-tile-yellow text-tile-navy hover:brightness-105"><SendHorizontal className="size-4.5" /></button>
          </form>
        </section>
      )}
      <button
        onClick={() => {
          setOpen((o) => !o);
          setSeen(last);
        }}
        aria-label={open ? "Close team chat" : `Open team chat${unread ? ` (${unread} new)` : ""}`}
        className="fixed right-3 bottom-5 z-50 grid size-14 place-items-center rounded-full bg-tile-navy text-tile-yellow shadow-[0_18px_30px_-12px_rgb(26_73_175/0.8)] transition-transform hover:scale-105 sm:right-6"
      >
        {open ? <X className="size-6" /> : <MessagesSquare className="size-6" />}
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-sale px-1 text-[11px] leading-5 font-black text-white ring-2 ring-white">{unread}</span>}
      </button>
    </>
  );
}
