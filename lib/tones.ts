/**
 * Colour tones built from the logo (teal + charcoal) with yellow as the accent and warm amber/coral used sparingly.
 * Literal class strings so Tailwind can see them.
 */
export type Tone = { bg: string; text: string; muted: string; glow: string; dark: boolean };

const t = (bg: string, glow: string, dark = false): Tone => ({
  bg,
  glow,
  dark,
  text: dark ? "text-white" : "text-ink",
  muted: dark ? "text-white/70" : "text-ink/60",
});

export const tones = {
  yellow: t("bg-tile-yellow", "from-tile-yellow"),
  butter: t("bg-tile-butter", "from-tile-butter"),
  amber: t("bg-tile-amber", "from-tile-amber"),
  teal: t("bg-tile-teal", "from-tile-teal"),
  aqua: t("bg-tile-aqua", "from-tile-aqua"),
  deep: t("bg-tile-deep", "from-tile-deep", true),
  ink: t("bg-tile-ink", "from-tile-ink", true),
  cloud: t("bg-tile-cloud", "from-tile-cloud"),
  coral: t("bg-tile-coral", "from-tile-coral", true),
} satisfies Record<string, Tone>;

export type ToneName = keyof typeof tones;

const byCategory: Record<string, ToneName> = {
  sensors: "aqua",
  microcontrollers: "yellow",
  motors: "teal",
  power: "amber",
  prototyping: "cloud",
  ics: "ink",
  "test-measurement": "deep",
  tools: "butter",
  kits: "yellow",
  civil: "aqua",
  architecture: "cloud",
  mechanical: "ink",
};

export const categoryTone = (slug: string): Tone => tones[byCategory[slug] ?? "cloud"];

export const levelTone = { Beginner: "bg-tile-aqua text-ink", Intermediate: "bg-tile-yellow text-ink", Advanced: "bg-tile-coral text-white" } as const;

export const deptTone: Record<string, ToneName> = { EEE: "yellow", CSE: "teal", CE: "amber", ARCH: "aqua", ME: "butter", BME: "deep" };
