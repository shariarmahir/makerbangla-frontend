export { cn } from "cn";

const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** Bangladeshi Taka with South-Asian digit grouping, e.g. BDT 1,25,000 */
export const bdt = (n: number) => `BDT ${fmt.format(n)}`;

export const discount = (price: number, old?: number) => (old && old > price ? Math.round((1 - price / old) * 100) : 0);

/** URL-safe slug, e.g. "Texas Instruments" → "texas-instruments" */
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
