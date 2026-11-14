import Image from "next/image";
import { productVisual } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Product image on a colour stage. Cut-outs float with a soft shadow; the rare photo without a
 * cut-out fills the frame and dissolves into the stage colour — never a white plate or border.
 */
export function ProductVisual({ slug, alt, sizes, preload, className, inset = "p-[9%]", fade = false, position = "object-center" }: {
  slug: string;
  alt: string;
  sizes: string;
  preload?: boolean;
  className?: string;
  inset?: string;
  /** Dissolve the bottom edge into the surface colour (card style). */
  fade?: boolean;
  position?: string;
}) {
  const v = productVisual(slug);
  const mask = fade ? "[mask-image:linear-gradient(to_bottom,black_76%,transparent_100%)]" : "";
  if (v.cutout) {
    return <Image src={v.src} alt={alt} fill sizes={sizes} preload={preload} className={cn("cutout-shadow object-contain", position, inset, mask, className)} />;
  }
  return (
    <Image
      src={v.src}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      className={cn("object-cover [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_78%)]", className)}
    />
  );
}
