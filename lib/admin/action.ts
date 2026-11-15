import "server-only";
import { refresh } from "next/cache";
import { z } from "zod";
import { assertUser } from "./auth";
import type { Section, User } from "./types";

export type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Wraps every dashboard mutation: re-checks the session and access, validates input with the schema,
 * runs the change, refreshes the router, and turns any failure into a friendly error (no stack traces leak).
 */
export async function run<S extends z.ZodType, T>(area: Section | "admin" | null, schema: S, input: unknown, fn: (data: z.infer<S>, user: User) => Promise<T> | T): Promise<Result<T>> {
  try {
    const user = await assertUser(area ?? undefined);
    const parsed = schema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
    const data = await fn(parsed.data, user);
    refresh();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof UserError || (e instanceof Error && e.message.startsWith("You don't have access")) ? e.message : "Something went wrong. Please try again." };
  }
}

/** An error whose message is safe to show to the user. */
export class UserError extends Error {}

// Shared field schemas
export const str = (max: number, min = 0, label = "This field") =>
  z.string().trim().max(max, `${label} is too long.`).min(min, min ? `${label} is required.` : undefined);
export const money = z.coerce.number().int("Use whole taka.").min(0, "Amount can't be negative.").max(100_000_000);
export const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");
export const idOf = z.string().regex(/^[\w-]{1,40}$/);
export const mediaOrPath = z.string().regex(/^\/(media|images)\/[\w./-]{1,160}$/, "Choose an image.").refine((s) => !s.includes(".."), "Invalid image path.");
