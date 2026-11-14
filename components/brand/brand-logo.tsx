import Image from "next/image";
import { siArduino, siEspressif, siIntel, siRaspberrypi, siStmicroelectronics } from "simple-icons";
import { cn } from "@/lib/utils";

const icons: Record<string, { path: string; hex: string; glyphOnly?: boolean }> = {
  arduino: siArduino,
  espressif: siEspressif,
  intel: { ...siIntel, glyphOnly: true },
  "raspberry-pi": siRaspberrypi,
  stmicroelectronics: siStmicroelectronics,
};

// Brands without an open-licensed glyph are typeset in a colour from the site palette (not the brand's own artwork).
const wordTone = ["text-brand-strong", "text-tile-blue", "text-ink", "text-tile-navy", "text-brand", "text-tile-midnight"];

/** Transparent brand mark: official glyph (Simple Icons, brand colour) when available, otherwise a typeset wordmark. */
export function BrandLogo({ slug, name, className, size = "md", index = 0 }: { slug: string; name: string; className?: string; size?: "md" | "lg"; index?: number }) {
  const lg = size === "lg";
  if (slug === "makerbangla") {
    return <Image src="/brand/logo.png" alt={name} width={416} height={144} className={cn(lg ? "h-14 w-auto" : "h-10 w-auto", className)} />;
  }
  const icon = icons[slug];
  if (icon) {
    return (
      <span className={cn("inline-flex items-center gap-2.5", className)} style={{ color: `#${icon.hex}` }}>
        <svg role="img" aria-label={name} viewBox="0 0 24 24" className={cn("shrink-0", icon.glyphOnly ? (lg ? "h-14 w-20" : "h-10 w-14") : lg ? "size-14" : "size-10")} fill="currentColor">
          <path d={icon.path} />
        </svg>
        {!icon.glyphOnly && <span className={cn("font-black tracking-tight", lg ? "text-[26px]" : "text-[19px]")}>{name}</span>}
      </span>
    );
  }
  return <span className={cn("font-black tracking-tight uppercase", lg ? "text-[28px]" : "text-[21px]", wordTone[index % wordTone.length], className)}>{name}</span>;
}
