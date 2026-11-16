import { cacheTag } from "next/cache";
import { Star } from "lucide-react";
import { readDb } from "@/lib/admin/db";
import { cn } from "@/lib/utils";
import { ReviewComposer } from "./review-composer";

/** Approved customer reviews only (moderated in Dashboard → Inbox & email → Reviews; approving expires "reviews"). */
export async function publishedReviews() {
  "use cache";
  cacheTag("reviews");
  const db = await readDb();
  return db.reviews.filter((r) => r.status === "approved" && !r.sample).map(({ id, createdAt, name, role, rating, text, reply }) => ({ id, createdAt, name, role, rating, text, reply }));
}

const tones = ["bg-tile-yellow text-tile-navy", "bg-brand text-white", "bg-tile-navy text-tile-yellow", "bg-tile-sky text-tile-navy"];

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex gap-0.5", className)} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} aria-hidden className={cn("size-4", i <= Math.round(value) ? "fill-current" : "opacity-30")} />)}
    </span>
  );
}

export async function Reviews() {
  const all = await publishedReviews();
  const avg = all.length ? all.reduce((n, r) => n + r.rating, 0) / all.length : 0;
  const latest = all.slice(0, 6);
  return (
    <section aria-labelledby="reviews-title" className="bg-white">
      <div className="container-x reveal py-12 sm:py-16">
        <div className="grid gap-5 lg:grid-cols-[minmax(280px,340px)_1fr]">
          <aside className="relative isolate flex flex-col overflow-hidden rounded-[26px] bg-tile-navy p-7 text-white">
            <span aria-hidden className="absolute -top-20 -right-16 -z-10 size-56 rounded-full bg-brand/50 blur-3xl" />
            <span aria-hidden className="absolute -bottom-24 -left-10 -z-10 size-52 rounded-full bg-tile-yellow/20 blur-3xl" />
            <h2 id="reviews-title" className="text-[clamp(1.5rem,2.6vw,2rem)] leading-tight font-black tracking-tight text-tile-yellow">What makers say</h2>
            {all.length ? (
              <>
                <p className="mt-5 flex items-end gap-3">
                  <span className="text-[3.4rem] leading-none font-black text-white tabular-nums">{avg.toFixed(1)}</span>
                  <span className="pb-1.5">
                    <Stars value={avg} className="text-tile-yellow" />
                    <span className="mt-1 block text-[12.5px] text-white/75">from {all.length} review{all.length === 1 ? "" : "s"}</span>
                  </span>
                </p>
                <ul className="mt-5 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const n = all.filter((r) => r.rating === s).length;
                    return (
                      <li key={s} className="flex items-center gap-2.5 text-[12px] font-bold text-white/80">
                        <span className="w-3 tabular-nums">{s}</span>
                        <Star aria-hidden className="size-3.5 fill-current text-tile-yellow" />
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/12"><span className="block h-full rounded-full bg-tile-yellow" style={{ width: `${(n / all.length) * 100}%` }} /></span>
                        <span className="w-6 text-right tabular-nums">{n}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="mt-4 text-[13.5px] leading-relaxed text-white/80">Bought parts or a kit from us? Tell other students and makers how it went.</p>
            )}
            <div className="mt-auto pt-7">
              <ReviewComposer />
            </div>
          </aside>

          {latest.length ? (
            <ul className="grid auto-rows-min content-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {latest.map((r, i) => (
                <li key={r.id} className="flex flex-col rounded-[22px] bg-soft p-5 ring-1 ring-line transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-30px_rgb(14_31_77/0.6)]">
                  <Stars value={r.rating} className="text-tile-yellow drop-shadow-[0_1px_0_rgb(26_73_175/0.35)]" />
                  <blockquote className="mt-3 line-clamp-6 text-[13.5px] leading-relaxed text-ink">&ldquo;{r.text}&rdquo;</blockquote>
                  {r.reply && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-[12px] leading-snug text-subtle ring-1 ring-line"><b className="text-brand-strong">Makerbangla:</b> {r.reply}</p>}
                  <p className="mt-auto flex items-center gap-3 pt-4">
                    <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-black", tones[i % tones.length])}>{r.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
                    <span className="min-w-0">
                      <b className="block truncate text-[13px] text-ink">{r.name}</b>
                      <span className="block truncate text-[11.5px] text-subtle">{r.role ? `${r.role} · ` : ""}{new Date(r.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}</span>
                    </span>
                  </p>
                </li>
              ))}
              {latest.length < 3 && (
                <li className="grid place-content-center gap-2 rounded-[22px] border-2 border-dashed border-line p-6 text-center">
                  <span className="mx-auto flex gap-0.5 text-tile-yellow">{[0, 1, 2, 3, 4].map((i) => <Star key={i} aria-hidden className="size-5 fill-current" />)}</span>
                  <p className="text-[14px] font-black text-ink">Built something with our parts?</p>
                  <p className="text-[12.5px] text-subtle">Share how it went — it helps the next student choose.</p>
                </li>
              )}
            </ul>
          ) : (
            <div className="grid place-content-center rounded-[26px] border-2 border-dashed border-line p-10 text-center">
              <span className="mx-auto flex gap-1 text-tile-yellow">{[0, 1, 2, 3, 4].map((i) => <Star key={i} aria-hidden className="size-7 fill-current" />)}</span>
              <p className="mt-3 text-[15px] font-black text-ink">No reviews yet</p>
              <p className="mt-1 max-w-sm text-[13px] text-subtle">Reviews from real customers show up here once our team has checked them.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
