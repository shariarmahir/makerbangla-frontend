import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { whatsappLink } from "@/lib/site";
import { MagicFace } from "@/components/ui/magic-button";
import { cn } from "@/lib/utils";

const promos = [
  { lines: ["Student", "Project Kits"], cta: "Shop now", href: "/shop?category=kits", photo: "/images/banners/kit.webp", tone: "ink" },
  { lines: ["Bulk Orders", "For University Labs"], cta: "Request a quote", href: whatsappLink("Hello Makerbangla, I'd like a quotation for a bulk lab order."), tone: "sale" },
  { lines: ["Learn With", "Circuit Recipes"], cta: "Start learning", href: "/learn", photo: "/images/banners/bridge.webp", tone: "ink" },
] as const;

export function PromoBanners() {
  return (
    <section aria-label="Offers" className="container-x reveal grid gap-3 py-10 sm:py-12 md:grid-cols-3 lg:gap-4">
      {promos.map((p) => {
        const external = p.href.startsWith("http");
        const content = (
          <>
            {"photo" in p && (
              <>
                <Image src={p.photo} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover opacity-70 transition-transform duration-700 ease-out group-hover:scale-105" />
                <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/80 to-ink/20" />
              </>
            )}
            <div className={cn("relative z-10 flex flex-col gap-4", p.tone === "sale" && "items-center text-center")}>
              <h3 className="leading-none font-extrabold tracking-tight uppercase">
                <span className="block text-[clamp(1.35rem,2.3vw,1.75rem)] text-white">{p.lines[0]}</span>
                <span className={cn("block text-[clamp(1.35rem,2.3vw,1.75rem)]", p.tone === "sale" ? "text-white" : "text-accent-yellow")}>{p.lines[1]}</span>
              </h3>
              {p.tone === "sale" ? (
                <MagicFace variant="accent" size="sm">{p.cta}</MagicFace>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider text-white uppercase underline-offset-4 group-hover:underline">
                  {p.cta} <ChevronRight className="size-3.5" />
                </span>
              )}
            </div>
          </>
        );
        const className = cn(
          "group relative flex min-h-40 items-center overflow-hidden rounded-2xl p-6 sm:p-7",
          p.tone === "sale" ? "justify-center bg-tile-navy" : "bg-ink",
        );
        return external ? (
          <a key={p.cta} href={p.href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>
        ) : (
          <Link key={p.cta} href={p.href} className={className}>{content}</Link>
        );
      })}
    </section>
  );
}
