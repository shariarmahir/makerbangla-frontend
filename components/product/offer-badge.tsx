import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "size-[3.4rem] sm:size-[3.8rem]", big: "text-[1rem] sm:text-[1.12rem]", small: "text-[0.52rem]" },
  md: { box: "size-16 sm:size-[4.4rem]", big: "text-[1.15rem] sm:text-[1.3rem]", small: "text-[0.56rem]" },
  lg: { box: "size-20 sm:size-24", big: "text-[1.5rem] sm:text-[1.85rem]", small: "text-[0.7rem] sm:text-[0.78rem]" },
} as const;

/**
 * Ad-style "xx% OFF" sticker: pops in, then gently sways while a light sweep crosses it and a dashed
 * ring turns around it. Coral on light surfaces, yellow on dark ones. Animations stop for reduced motion.
 */
export function OfferBadge({ off, dark = false, size = "sm", className }: { off: number; dark?: boolean; size?: keyof typeof sizes; className?: string }) {
  const s = sizes[size];
  return (
    <span
      role="img"
      aria-label={`${off}% off`}
      className={cn(
        "offer-badge pointer-events-none relative grid shrink-0 place-content-center rounded-full text-center leading-none shadow-[0_10px_22px_-8px_rgb(0_0_0/0.5)]",
        dark ? "bg-tile-yellow text-tile-navy" : "bg-tile-coral text-white",
        s.box,
        className,
      )}
    >
      <span aria-hidden className={cn("offer-badge-ring absolute -inset-[5px] rounded-full border-2 border-dashed", dark ? "border-tile-yellow/80" : "border-tile-coral/70")} />
      <span aria-hidden className="absolute inset-0 overflow-hidden rounded-full">
        <span className="offer-badge-shine absolute inset-y-[-20%] left-0 w-[45%] skew-x-[-20deg] bg-linear-to-r from-transparent via-white/60 to-transparent" />
      </span>
      <span aria-hidden className={cn("relative font-black tracking-tight tabular-nums", s.big)}>{off}%</span>
      <span aria-hidden className={cn("relative mt-0.5 font-black tracking-[0.22em] uppercase", s.small)}>Off</span>
    </span>
  );
}
