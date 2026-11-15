/** Chart colours (brand tokens). Kept out of the "use client" chart module so server pages can import real values. */
export const palette = {
  blue: "var(--color-brand)",
  yellow: "var(--color-tile-yellow)",
  navy: "var(--color-tile-navy)",
  coral: "var(--color-tile-coral)",
  sky: "color-mix(in srgb, var(--color-brand) 45%, white)",
  midnight: "var(--color-tile-midnight)",
  butter: "var(--color-tile-butter)",
} as const;

export const seriesColors = [palette.blue, palette.yellow, palette.navy, palette.coral, palette.sky, palette.midnight, palette.butter];
