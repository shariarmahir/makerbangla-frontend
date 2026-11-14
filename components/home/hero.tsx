import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
  button: string;
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
    button: "bg-sale hover:shadow-[0_12px_24px_-8px_var(--color-sale)]",
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
    button: "bg-tile-violet hover:shadow-[0_12px_24px_-8px_var(--color-tile-violet)]",
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
    button: "bg-brand-strong hover:shadow-[0_12px_24px_-8px_var(--color-brand)]",
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
    button: "bg-tile-blue hover:shadow-[0_12px_24px_-8px_var(--color-tile-blue)]",
    description: "0.01 mm resolution for the machine shop, metrology lab and every project fit check.",
  },
];

function SlideView({ s, first }: { s: Slide; first: boolean }) {
  return (
    <div className="relative isolate grid h-full min-h-[460px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_58%_38%,var(--color-hero-a)_0%,var(--color-hero-b)_78%)] p-6 sm:min-h-[420px] sm:p-10 lg:aspect-[16/6.2] lg:min-h-0 lg:p-14">
      {/* Giant watermark word behind the product */}
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[52%] -z-10 -translate-y-1/2 text-center text-[clamp(3.6rem,14.5vw,12.5rem)] leading-none font-black tracking-tight whitespace-nowrap text-white uppercase select-none sm:top-1/2"
      >
        {s.watermark}
      </p>

      {/* Product with ground shadow */}
      <div className="pointer-events-none absolute top-[54%] left-1/2 aspect-square w-[78%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 sm:top-1/2 sm:w-[48%] lg:w-[36%]">
        <span aria-hidden className="absolute bottom-[4%] left-1/2 h-[9%] w-[62%] -translate-x-1/2 rounded-[50%] bg-ink/30 blur-xl" />
        <div className="relative size-full motion-safe:animate-float">
          <Image src={productVisual(s.product).src} alt={s.alt} fill sizes="(min-width:1024px) 440px, 80vw" preload={first} className="cutout-shadow object-contain" />
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-[clamp(0.95rem,1.4vw,1.15rem)] font-semibold text-ink-2">{s.kicker}</p>
        <h2 className="mt-1 max-w-[12ch] text-[clamp(2.2rem,5.4vw,4.6rem)] leading-[0.95] font-extrabold tracking-tight text-ink">{s.title}</h2>
      </div>

      <div />

      <div className="relative z-10 flex items-end justify-between gap-6 pb-4 sm:pb-2">
        <Link href={s.href} className={cn("btn-pill h-11 px-7 text-white", s.button)}>
          {s.cta} <ChevronRight className="size-4" />
        </Link>
        <div className="hidden max-w-64 text-right md:block">
          <p className="text-[13px] font-extrabold text-ink">Description</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{s.description}</p>
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
