"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { deleteReviews, replyReview, setReviewStatus } from "@/lib/admin/actions/reviews";
import type { Review } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { Btn, ConfirmButton, textarea, useAction } from "./kit";
import { Avatar, Card, Empty, Pill } from "./ui";

/** Review moderation: nothing reaches the store until it's published here. Sample reviews can't be published. */
export function ReviewsAdmin({ reviews }: { reviews: Review[] }) {
  const { pending, exec } = useAction();
  const [folder, setFolder] = useState<Review["status"] | "all">(reviews.some((r) => r.status === "pending") ? "pending" : "all");
  const [reply, setReply] = useState<string | null>(null);
  const [text, setText] = useState("");
  const shown = reviews.filter((r) => folder === "all" || r.status === folder);
  const live = reviews.filter((r) => r.status === "approved" && !r.sample);
  const avg = live.length ? live.reduce((n, r) => n + r.rating, 0) / live.length : 0;
  const set = (ids: string[], status: Review["status"], msg: string) => exec(() => setReviewStatus({ ids, status }), msg);

  return (
    <Card
      icon="sparkles"
      title="Customer reviews"
      action={<span className="flex items-center gap-1.5 text-[12.5px] font-black text-ink">{live.length ? <><Star className="size-4 fill-tile-yellow text-tile-yellow" />{avg.toFixed(1)} · {live.length} on the store</> : "None on the store yet"}</span>}
    >
      <div className="mb-4 flex flex-wrap gap-1.5">
        {([["pending", "Waiting"], ["approved", "Published"], ["hidden", "Hidden"], ["all", "All"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFolder(k)} className={cn("h-8 rounded-full px-3 text-[12px] font-black", folder === k ? "bg-tile-navy text-tile-yellow" : "bg-soft text-subtle hover:text-ink")}>
            {l} <span className="tabular-nums opacity-70">{k === "all" ? reviews.length : reviews.filter((r) => r.status === k).length}</span>
          </button>
        ))}
        {folder === "pending" && shown.filter((r) => !r.sample).length > 1 && (
          <Btn size="sm" tone="primary" className="ml-auto" disabled={pending} onClick={() => set(shown.filter((r) => !r.sample).map((r) => r.id), "approved", "Published")}><Icon name="check-check" className="size-3.5" /> Publish all</Btn>
        )}
      </div>
      {shown.length === 0 ? (
        <Empty>No reviews here. Customers write them from the home page.</Empty>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {shown.map((r) => (
            <li key={r.id} className="flex flex-col rounded-2xl bg-soft/70 p-4 ring-1 ring-line">
              <div className="flex items-start gap-3">
                <Avatar name={r.name} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-black text-ink">{r.name}</p>
                  <p className="truncate text-[11.5px] font-semibold text-subtle">{r.role ? `${r.role} · ` : ""}{new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}</p>
                </div>
                <span className="flex gap-0.5 text-tile-yellow" role="img" aria-label={`${r.rating} out of 5`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} aria-hidden className={cn("size-3.5", i <= r.rating ? "fill-current" : "text-line")} />)}</span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-ink">{r.text}</p>
              {r.reply && reply !== r.id && <p className="mt-2 rounded-xl bg-white px-3 py-2 text-[12px] text-subtle ring-1 ring-line"><b className="text-brand-strong">Your reply:</b> {r.reply}</p>}
              {reply === r.id && (
                <form
                  className="mt-3 space-y-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if ((await exec(() => replyReview({ id: r.id, reply: text }), text ? "Reply saved" : "Reply removed")).ok) setReply(null);
                  }}
                >
                  <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={400} rows={3} placeholder="Thank the customer or answer their point — shown under the review." aria-label="Reply" className={cn(textarea, "bg-white")} />
                  <div className="flex justify-end gap-2"><Btn size="sm" onClick={() => setReply(null)}>Cancel</Btn><Btn size="sm" type="submit" tone="primary" disabled={pending}>Save reply</Btn></div>
                </form>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                <Pill tone={r.status === "approved" ? "delivered" : r.status === "hidden" ? "neutral" : "pending"}>{r.status === "approved" ? "On the store" : r.status === "hidden" ? "Hidden" : "Waiting"}</Pill>
                {r.sample && <Pill>Sample</Pill>}
                <span className="ml-auto flex flex-wrap gap-1.5">
                  {r.status !== "approved" && <Btn size="sm" tone="primary" disabled={pending || r.sample} title={r.sample ? "Sample reviews can't be published" : undefined} onClick={() => set([r.id], "approved", "Published on the store")}><Icon name="check" className="size-3.5" /> Publish</Btn>}
                  {r.status !== "hidden" && <Btn size="sm" tone="soft" disabled={pending} onClick={() => set([r.id], "hidden", "Hidden")}><Icon name="eye-off" className="size-3.5" /> Hide</Btn>}
                  <Btn size="sm" tone="soft" onClick={() => (setReply(r.id), setText(r.reply ?? ""))}><Icon name="message-circle" className="size-3.5" /> Reply</Btn>
                  <ConfirmButton size="icon" label="Delete review" onConfirm={() => exec(() => deleteReviews({ ids: [r.id] }), "Review deleted")} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
