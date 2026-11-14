import Image from "next/image";
import { productVisual } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Product image for a colourful stage: transparent cut-outs float with a soft shadow,
 * photos with their own background sit on a white rounded plate.
 */
export function ProductVisual({ slug, alt, sizes, preload, className, inset = "p-[9%]", plate = "inset-[11%]" }: {
  slug: string;
  alt: string;
  sizes: string;
  preload?: boolean;
  className?: string;
  inset?: string;
  plate?: string;
}) {
  const v = productVisual(slug);
  if (v.cutout) {
    return <Image src={v.src} alt={alt} fill sizes={sizes} preload={preload} className={cn("cutout-shadow object-contain", inset, className)} />;
  }
  return (
    <span className={cn("absolute overflow-hidden rounded-xl bg-white shadow-[0_14px_28px_-12px_rgb(0_0_0/0.45)] ring-4 ring-white", plate, className)}>
      <Image src={v.src} alt={alt} fill sizes={sizes} preload={preload} className="object-cover" />
    </span>
  );
}
