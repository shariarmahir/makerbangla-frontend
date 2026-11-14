/** Colourful stage per category. Literal class strings so Tailwind can see them. */
export type Tone = { bg: string; text: string; soft: string; dark: boolean };

const t = (bg: string, soft: string, dark = false): Tone => ({ bg, soft, dark, text: dark ? "text-white" : "text-ink" });

export const tones = {
  yellow: t("bg-tile-yellow", "bg-tile-yellow/15"),
  teal: t("bg-tile-teal", "bg-tile-teal/15"),
  red: t("bg-tile-red", "bg-tile-red/12", true),
  blue: t("bg-tile-blue", "bg-tile-blue/12", true),
  green: t("bg-tile-green", "bg-tile-green/12"),
  violet: t("bg-tile-violet", "bg-tile-violet/12", true),
  orange: t("bg-tile-orange", "bg-tile-orange/15"),
  pink: t("bg-tile-pink", "bg-tile-pink/15"),
  sky: t("bg-tile-sky", "bg-tile-sky/15"),
  lime: t("bg-tile-lime", "bg-tile-lime/20"),
  ink: t("bg-tile-ink", "bg-tile-ink/8", true),
  cloud: t("bg-tile-cloud", "bg-tile-cloud/60"),
} satisfies Record<string, Tone>;

export type ToneName = keyof typeof tones;

const byCategory: Record<string, ToneName> = {
  sensors: "sky",
  microcontrollers: "yellow",
  motors: "teal",
  power: "green",
  prototyping: "violet",
  ics: "orange",
  "test-measurement": "blue",
  tools: "pink",
  kits: "red",
  civil: "lime",
  architecture: "cloud",
  mechanical: "ink",
};

export const categoryTone = (slug: string): Tone => tones[byCategory[slug] ?? "cloud"];

export const levelTone = { Beginner: "bg-tile-green text-ink", Intermediate: "bg-tile-yellow text-ink", Advanced: "bg-tile-red text-white" } as const;
