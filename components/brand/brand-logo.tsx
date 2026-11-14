import Image from "next/image";
import { siArduino, siEspressif, siIntel, siRaspberrypi, siStmicroelectronics } from "simple-icons";
import { cn } from "@/lib/utils";

const icons: Record<string, { path: string; hex: string }> = {
  arduino: siArduino,
  espressif: siEspressif,
  intel: siIntel,
  "raspberry-pi": siRaspberrypi,
  stmicroelectronics: siStmicroelectronics,
};

/** Transparent brand mark: official glyph (Simple Icons) when available, otherwise a typeset wordmark. */
export function BrandLogo({ slug, name, className, mono }: { slug: string; name: string; className?: string; mono?: boolean }) {
  if (slug === "makerbangla") {
    return <Image src="/brand/mark.png" alt={name} width={64} height={64} className={cn("h-9 w-auto", className)} />;
  }
  const icon = icons[slug];
  if (icon) {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <svg role="img" aria-label={name} viewBox="0 0 24 24" className="size-8 shrink-0" fill={mono ? "currentColor" : `#${icon.hex}`}>
          <path d={icon.path} />
        </svg>
        <span className="text-[15px] font-extrabold tracking-tight">{name}</span>
      </span>
    );
  }
  return <span className={cn("text-[17px] font-black tracking-tight uppercase", className)}>{name}</span>;
}
