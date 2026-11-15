"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { idOf, run, str, UserError } from "../action";
import { log, mutate } from "../db";

const ids = z.array(idOf).min(1).max(500);

/** Approve (show on the store), hide, or send back to pending. Expires the home page's "reviews" cache. */
export async function setReviewStatus(input: { ids: string[]; status: string }) {
  return run("clients", z.object({ ids, status: z.enum(["pending", "approved", "hidden"]) }), input, ({ ids, status }, user) =>
    mutate((db) => {
      const hit = db.reviews.filter((r) => ids.includes(r.id));
      if (status === "approved" && hit.some((r) => r.sample)) throw new UserError("Sample reviews can't be published — they're only here to try the tools.");
      hit.forEach((r) => (r.status = status));
      log(db, user.name, `${status === "approved" ? "published" : `set to ${status}`} ${hit.length} review${hit.length === 1 ? "" : "s"}`);
      updateTag("reviews");
      return null;
    }),
  );
}

export async function replyReview(input: { id: string; reply: string }) {
  return run("clients", z.object({ id: idOf, reply: str(400) }), input, ({ id, reply }, user) =>
    mutate((db) => {
      const r = db.reviews.find((x) => x.id === id);
      if (!r) throw new UserError("That review no longer exists.");
      r.reply = reply || undefined;
      log(db, user.name, `${reply ? "replied to" : "removed the reply on"} ${r.name}'s review`);
      updateTag("reviews");
      return null;
    }),
  );
}

export async function deleteReviews(input: { ids: string[] }) {
  return run("clients", z.object({ ids }), input, ({ ids }, user) =>
    mutate((db) => {
      const before = db.reviews.length;
      db.reviews = db.reviews.filter((r) => !ids.includes(r.id));
      log(db, user.name, `deleted ${before - db.reviews.length} review(s)`);
      updateTag("reviews");
      return null;
    }),
  );
}
