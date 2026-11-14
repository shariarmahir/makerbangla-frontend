import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { MagicLink, type MagicButtonVariant } from "@/components/ui/magic-button";
import { productVisual } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { Carousel } from "./carousel";

type Slide = {
  product: string;
  alt: string;
  kicker: string;
  title: string;
  watermark: string;
  cta: string;
  href: string;
  bg: string;
  /** Font colour paired with the background (yellow → dark blue, dark blue → yellow, light blue → white). */
  fg: string;
  watermarkTone: string;
  button: MagicButtonVariant;
  description: string;
};

const slides: Slide[] = [
  {
    product: "arduino-uno-r3",
    alt: "Arduino Uno R3 development board",
    kicker: "Arduino Uno R3",
    title: "Maker Board",
    watermark: "Arduino",
    cta: "Shop Boards",
    href: "/shop?category=microcontrollers",
    bg: "bg-[radial-gradient(ellipse_at_62%_42%,color-mix(in_srgb,var(--color-tile-yellow)_25%,white)_0%,var(--color-tile-butter)_22%,var(--color-tile-yellow)_62%,color-mix(in_oklab,var(--color-tile-yellow)_88%,var(--color-sale))_100%)]",
    fg: "text-tile-navy",
    watermarkTone: "text-white/60",
    button: "default",
    description: "The ATmega328P board behind most microprocessor sessionals, robots and first IoT builds.",
  },
  {
    product: "raspberry-pi-4",
    alt: "Raspberry Pi 4 Model B",
    kicker: "Raspberry Pi 4",
    title: "Edge Computer",
    watermark: "Raspberry",
    cta: "Explore Pi 4",
    href: "/products/raspberry-pi-4",
    bg: "bg-[radial-gradient(ellipse_at_62%_40%,color-mix(in_srgb,var(--color-tile-blue)_45%,var(--color-tile-navy))_0%,var(--color-tile-navy)_42%,var(--color-tile-midnight)_100%)]",
    fg: "text-tile-yellow",
    watermarkTone: "text-white/[0.08]",
    button: "accent",
    description: "Quad-core Linux computer for computer vision, ML inference and campus IoT gateways.",
  },
  {
    product: "nema17-stepper-motor",
    alt: "NEMA 17 stepper motor",
    kicker: "NEMA 17 Stepper",
    title: "Motion Control",
    watermark: "Robotics",
    cta: "Shop Motors",
    href: "/shop?category=motors",
    bg: "bg-[radial-gradient(ellipse_at_62%_42%,color-mix(in_srgb,var(--color-tile-blue)_50%,white)_0%,var(--color-tile-blue)_55%,color-mix(in_srgb,var(--color-tile-blue)_80%,var(--color-tile-navy))_100%)]",
    fg: "text-white",
    watermarkTone: "text-white/25",
    button: "default",
    description: "200 precise steps per revolution for CNC plotters, 3D printers and camera sliders.",
  },
  {
    product: "vernier-caliper",
    alt: "Digital vernier caliper",
    kicker: "Digital Vernier Caliper",
    title: "Measure Precisely",
    watermark: "Precision",
    cta: "Shop Workshop",
    href: "/shop?category=mechanical",
    bg: "bg-[radial-gradient(ellipse_at_62%_42%,white_0%,color-mix(in_srgb,var(--color-tile-sky)_35%,white)_35%,var(--color-tile-sky)_100%)]",
    fg: "text-tile-blue",
    watermarkTone: "text-tile-blue/[0.09]",
    button: "brand",
    description: "0.01 mm resolution for the machine shop, metrology lab and every project fit check.",
  },
];

function SlideView({ s, first }: { s: Slide; first: boolean }) {
  return (
    <div className={cn("relative isolate grid h-full min-h-[460px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-[26px] p-6 sm:min-h-[420px] sm:p-10 lg:aspect-[16/6.2] lg:min-h-0 lg:p-14", s.bg, s.fg)}>
      <span aria-hidden className="absolute -top-1/3 -left-1/4 -z-20 size-[70%] rounded-full bg-white/10 blur-3xl" />
      {/* Giant watermark word behind the product */}
      <p
        aria-hidden
        className={cn("pointer-events-none absolute inset-x-0 top-[52%] -z-10 -translate-y-1/2 text-center text-[clamp(3.6rem,14.5vw,12.5rem)] leading-none font-black tracking-tight whitespace-nowrap uppercase select-none sm:top-1/2", s.watermarkTone)}
      >
        {s.watermark}
      </p>

      {/* Product with ground shadow */}
      <div className="pointer-events-none absolute top-[56%] left-1/2 aspect-square w-[78%] max-w-[460px] -translate-x-1/2 -translate-y-1/2 sm:top-1/2 sm:left-[58%] sm:w-[44%] lg:left-[60%] lg:w-[34%]">
        <span aria-hidden className="absolute bottom-[4%] left-1/2 h-[9%] w-[62%] -translate-x-1/2 rounded-[50%] bg-black/35 blur-xl" />
        <div className="relative size-full motion-safe:animate-float">
          <Image src={productVisual(s.product).src} alt={s.alt} fill sizes="(min-width:1024px) 560px, 90vw" quality={85} preload={first} className="cutout-shadow object-contain" />
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-[clamp(0.95rem,1.4vw,1.15rem)] font-bold opacity-80">{s.kicker}</p>
        <h2 className="mt-1 max-w-[12ch] text-[clamp(2.2rem,5.4vw,4.6rem)] leading-[0.95] font-black tracking-tight">{s.title}</h2>
      </div>

      <div />

      <div className="relative z-10 flex items-end justify-between gap-6 pb-4 sm:pb-2">
        <MagicLink href={s.href} variant={s.button} size="lg" rainbow>
          {s.cta} <ChevronRight className="size-4" />
        </MagicLink>
        <div className="hidden max-w-64 text-right md:block">
          <p className="text-[13px] font-black">Description</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed opacity-85">{s.description}</p>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section aria-label="Featured" className="container-x pt-4 sm:pt-6">
      <Carousel label="Featured products" item="basis-full" arrows="none" dots autoplay={6500}>
        {slides.map((s, i) => (
          <SlideView key={s.product} s={s} first={i === 0} />
        ))}
      </Carousel>
    </section>
  );
}
