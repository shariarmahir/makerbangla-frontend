import type { MagicButtonVariant } from "@/components/ui/magic-button";

/**
 * Colour tones from the brand palette — white, yellow, light blue, dark blue — each with its paired
 * font colour (white → light blue, yellow → dark blue, light blue → white, dark blue → yellow).
 * Literal class strings so Tailwind can see them.
 */
export type Tone = {
  bg: string;
  /** Main foreground (titles, prices). */
  text: string;
  /** Secondary copy. */
  muted: string;
  /** Discount / "New" callout colour on this surface. */
  offer: string;
  /** MagicButton variant that reads best on this surface. */
  button: MagicButtonVariant;
  glow: string;
  dark: boolean;
};

export const tones = {
  yellow: { bg: "bg-tile-yellow", text: "text-tile-navy", muted: "text-tile-navy/70", offer: "text-sale", button: "default", glow: "from-tile-yellow", dark: false },
  butter: { bg: "bg-tile-butter", text: "text-tile-navy", muted: "text-tile-navy/70", offer: "text-sale", button: "default", glow: "from-tile-butter", dark: false },
  blue: { bg: "bg-tile-blue", text: "text-white", muted: "text-white/85", offer: "text-white", button: "default", glow: "from-tile-blue", dark: true },
  sky: { bg: "bg-tile-sky", text: "text-tile-navy", muted: "text-tile-navy/70", offer: "text-sale", button: "default", glow: "from-tile-sky", dark: false },
  navy: { bg: "bg-tile-navy", text: "text-tile-yellow", muted: "text-white/75", offer: "text-tile-yellow", button: "accent", glow: "from-tile-navy", dark: true },
  midnight: { bg: "bg-tile-midnight", text: "text-tile-yellow", muted: "text-white/70", offer: "text-tile-yellow", button: "accent", glow: "from-tile-midnight", dark: true },
  white: { bg: "bg-tile-white ring-1 ring-line", text: "text-tile-blue", muted: "text-ink/60", offer: "text-sale", button: "brand", glow: "from-tile-white", dark: false },
  coral: { bg: "bg-tile-coral", text: "text-white", muted: "text-white/80", offer: "text-white", button: "default", glow: "from-tile-coral", dark: true },
} as const satisfies Record<string, Tone>;

export type ToneName = keyof typeof tones;

const byCategory: Record<string, ToneName> = {
  sensors: "sky",
  microcontrollers: "yellow",
  modules: "midnight",
  motors: "navy",
  robotics: "yellow",
  "3d-printing": "sky",
  power: "blue",
  prototyping: "white",
  ics: "midnight",
  "test-measurement": "blue",
  tools: "butter",
  kits: "yellow",
  civil: "sky",
  architecture: "white",
  mechanical: "navy",
};

export const categoryTone = (slug: string): Tone => tones[byCategory[slug] ?? "white"];

export const levelTone = { Beginner: "bg-tile-sky text-tile-navy", Intermediate: "bg-tile-yellow text-tile-navy", Advanced: "bg-tile-coral text-white" } as const;

export const deptTone: Record<string, ToneName> = { EEE: "yellow", CSE: "blue", CE: "white", ARCH: "sky", ME: "butter", BME: "coral" };
