"use client";

import { useActionState, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { CircleCheck, LoaderCircle, PenLine, Send, Star, X } from "lucide-react";
import { submitReview, type ReviewState } from "@/app/actions";
import { MagicButton } from "@/components/ui/magic-button";
import { cn } from "@/lib/utils";

const field = "h-12 w-full rounded-xl bg-soft px-4 text-[14px] font-semibold text-ink ring-1 ring-line outline-none transition-shadow placeholder:font-medium placeholder:text-subtle/70 focus:bg-white focus:ring-2 focus:ring-brand";
const words = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** "Write a review" dialog: star rating, name, optional role, text. Reviews wait for moderation before they appear. */
export function ReviewComposer() {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || rating || Number(state?.fields?.rating ?? 0);
  const f = state?.fields;

  return (
    <Dialog.Root>
      <Dialog.Trigger render={<MagicButton type="button" variant="accent" faceClassName="w-full" className="w-full" />}>
        <PenLine className="size-4" /> Write a review
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-tile-midnight/45 backdrop-blur-[2px] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-[61] max-h-[90dvh] w-[min(94vw,520px)] -translate-1/2 overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl transition-[opacity,scale] duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Dialog.Title className="text-[19px] font-black tracking-tight text-tile-navy">Write a review</Dialog.Title>
            <Dialog.Close aria-label="Close" className="grid size-9 place-items-center rounded-full text-subtle hover:bg-soft hover:text-ink"><X className="size-5" /></Dialog.Close>
          </div>
          {state?.ok ? (
            <div role="status" className="grid place-items-center gap-3 rounded-2xl bg-tile-sky/40 p-8 text-center">
              <CircleCheck className="size-10 text-tile-navy" />
              <p className="text-[14.5px] font-bold text-tile-navy">{state.message}</p>
            </div>
          ) : (
            <form action={action} className="space-y-4" noValidate>
              <fieldset>
                <legend className="mb-2 text-[12.5px] font-bold text-ink">Your rating</legend>
                <div className="flex items-center gap-3">
                  <div role="radiogroup" aria-label="Rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} className="rounded-lg p-0.5 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
                        <Star className={cn("size-8 transition-colors", i <= shown ? "fill-tile-yellow text-tile-yellow drop-shadow-[0_2px_0_rgb(26_73_175/0.35)]" : "text-line")} />
                      </button>
                    ))}
                  </div>
                  <span className="text-[13px] font-black text-tile-navy">{words[shown]}</span>
                </div>
                <input type="hidden" name="rating" value={rating || f?.rating || ""} />
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-bold text-ink">Name</span>
                  <input name="name" required maxLength={60} defaultValue={f?.name} autoComplete="name" className={field} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-bold text-ink">Study or work <span className="font-medium text-subtle">(optional)</span></span>
                  <input name="role" maxLength={60} defaultValue={f?.role} placeholder="e.g. EEE student, UAP" className={field} />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-bold text-ink">Your review</span>
                <textarea name="text" required minLength={15} maxLength={800} rows={4} defaultValue={f?.text} placeholder="What did you buy or build, and how was it?" className={cn(field, "h-auto py-3 leading-relaxed")} />
              </label>
              <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />
              <p role="alert" aria-live="polite" className="min-h-5 text-[12.5px] font-bold text-sale">{state?.message}</p>
              <MagicButton type="submit" disabled={pending} faceClassName="w-full" className="w-full">
                {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                {pending ? "Sending…" : "Submit review"}
              </MagicButton>
              <p className="text-center text-[11.5px] text-subtle">Reviews appear after a quick check by our team.</p>
            </form>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
