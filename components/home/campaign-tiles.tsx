import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MagicFace } from "@/components/ui/magic-button";
import { cn } from "@/lib/utils";

/** Two-line title: a lighter lead word over a heavy second line. */
function Headline({ lines, className, lead, strong }: { lines: [string, string]; className?: string; lead: string; strong: string }) {
  return (
    <h3 className={cn("tracking-tight", className)}>
      <span className={cn("block text-[0.62em] leading-tight font-semibold", lead)}>{lines[0]}</span>
      <span className={cn("block leading-[1.02] font-black", strong)}>{lines[1]}</span>
    </h3>
  );
}

function ProductTile({ lines, href, image, alt, tone }: { lines: [string, string]; href: string; image: string; alt: string; tone: "yellow" | "brand" }) {
  const yellow = tone === "yellow";
  return (
    <Link
      href={href}
      className={cn(
        "group relative isolate flex min-h-80 flex-col overflow-hidden rounded-[22px] p-6 shadow-[0_26px_36px_-28px_rgb(14_31_77/0.5)] sm:p-7 lg:min-h-full",
        yellow ? "bg-tile-yellow" : "bg-tile-blue",
      )}
    >
      <Headline
        lines={lines}
        className="relative z-10 text-[clamp(1.85rem,2.6vw,2.4rem)]"
        lead={yellow ? "text-tile-navy/75" : "text-white/85"}
        strong={yellow ? "text-tile-navy" : "text-white"}
      />

      {/* Product stage: lower-right, never under the title */}
      <div aria-hidden className="pointer-events-none absolute right-2 bottom-2 -z-10 aspect-square h-[64%] max-h-72 sm:right-4 sm:bottom-4">
        <span className={cn("absolute inset-[12%] rounded-full blur-2xl", yellow ? "bg-white/45" : "bg-white/25")} />
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width:1024px) 300px, 60vw"
          className="cutout-shadow object-contain p-[4%] transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-rotate-3"
        />
      </div>
      <span className="sr-only">{alt}</span>

      <MagicFace variant={yellow ? "default" : "accent"} size="sm" className="relative z-10 mt-auto w-fit">
        Shop now <ChevronRight className="size-3.5" />
      </MagicFace>
    </Link>
  );
}

function PhotoTile({ lines, href, image }: { lines: [string, string]; href: string; image: string }) {
  return (
    <Link href={href} className="group relative isolate flex min-h-44 items-end overflow-hidden rounded-[22px] bg-tile-midnight p-6 shadow-[0_26px_36px_-28px_rgb(14_31_77/0.5)] sm:p-7">
      <Image src={image} alt="" fill sizes="(min-width:1024px) 420px, 100vw" className="-z-10 object-cover opacity-75 transition-transform duration-700 ease-out group-hover:scale-105" />
      <div className="absolute inset-0 -z-10 bg-linear-to-tr from-tile-midnight via-tile-midnight/80 to-tile-navy/10" />
      <div className="flex w-full items-end justify-between gap-4">
        <Headline lines={lines} className="text-[clamp(1.45rem,2vw,1.8rem)]" lead="text-white/85" strong="text-tile-yellow" />
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tile-yellow text-tile-navy transition-transform duration-300 group-hover:translate-x-1">
          <ChevronRight className="size-5" strokeWidth={2.6} />
          <span className="sr-only">Shop now</span>
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
        <PhotoTile lines={["Robotics &", "Motion Parts"]} href="/shop?category=motors" image="/images/banners/robotics-lab.webp" />
      </div>
    </section>
  );
}
