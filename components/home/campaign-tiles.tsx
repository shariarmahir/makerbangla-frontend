import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MagicFace } from "@/components/ui/magic-button";
import { cn } from "@/lib/utils";

function Headline({ lines, className }: { lines: [string, string]; className?: string }) {
  return (
    <h3 className={cn("leading-[0.95] font-extrabold tracking-tight uppercase", className)}>
      <span className="block">{lines[0]}</span>
      <span className="block">{lines[1]}</span>
    </h3>
  );
}

function ProductTile({ lines, href, image, alt, tone }: { lines: [string, string]; href: string; image: string; alt: string; tone: "yellow" | "brand" }) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-56 overflow-hidden rounded-2xl p-6 sm:min-h-64 sm:p-8 lg:min-h-full",
        tone === "yellow" ? "bg-accent-yellow" : "bg-brand",
      )}
    >
      <div className="relative z-10 flex max-w-[55%] flex-col justify-between gap-6">
        <Headline lines={lines} className="text-[clamp(1.6rem,3vw,2.4rem)] text-ink" />
        <MagicFace variant={tone === "yellow" ? "default" : "light"} size="sm" className="w-fit">
          Shop now <ChevronRight className="size-3.5" />
        </MagicFace>
      </div>
      <Image
        src={image}
        alt={alt}
        width={420}
        height={420}
        sizes="(min-width:1024px) 260px, 45vw"
        className="cutout-shadow absolute top-1/2 -right-4 w-[58%] max-w-80 -translate-y-1/2 -rotate-6 object-contain transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-rotate-2"
      />
    </Link>
  );
}

function PhotoTile({ lines, href, image, accent }: { lines: [string, string]; href: string; image: string; accent?: boolean }) {
  return (
    <Link href={href} className="group relative flex min-h-40 items-center overflow-hidden rounded-2xl bg-ink p-6 sm:p-7">
      <Image src={image} alt="" fill sizes="(min-width:1024px) 420px, 100vw" className="object-cover opacity-80 transition-transform duration-700 ease-out group-hover:scale-105" />
      <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/75 to-ink/10" />
      <div className="relative z-10 space-y-4">
        <Headline lines={lines} className={cn("text-[clamp(1.25rem,2.2vw,1.65rem)] text-white", accent && "[&>span:last-child]:text-accent-yellow")} />
        <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider text-white uppercase transition-colors group-hover:text-accent-yellow">
          Shop now <ChevronRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

export function CampaignTiles() {
  return (
    <section aria-label="Campaigns" className="container-x reveal grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
      <ProductTile lines={["Genuine", "Components"]} href="/shop?category=microcontrollers" image="/images/cutouts/arduino-uno-r3.webp" alt="Arduino Uno R3" tone="yellow" />
      <ProductTile lines={["Maker", "Essentials"]} href="/shop?category=prototyping" image="/images/cutouts/resistor-kit.webp" alt="Resistor assortment" tone="brand" />
      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1 lg:gap-4">
        <PhotoTile lines={["Lab & Test", "Equipment"]} href="/shop?category=test-measurement" image="/images/banners/lab.webp" />
        <PhotoTile lines={["Robotics &", "Motion Parts"]} href="/shop?category=motors" image="/images/banners/robotics-lab.webp" accent />
      </div>
    </section>
  );
}
