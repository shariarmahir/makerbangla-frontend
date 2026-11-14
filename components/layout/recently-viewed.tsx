"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { bdt } from "@/lib/utils";

export function RecentlyViewed() {
  const items = useStore((s) => s.recent);
  if (items.length === 0) {
    return <p className="px-4 py-5 text-center text-[12px] text-subtle">Products you open will appear here.</p>;
  }
  return (
    <ul className="max-h-96 divide-y divide-line overflow-y-auto">
      {items.slice(0, 6).map((p) => (
        <li key={p.slug}>
          <Link href={`/products/${p.slug}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-soft">
            <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-soft">
              <Image src={p.image} alt="" fill sizes="44px" className="object-contain p-1" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 text-[12px] font-medium normal-case">{p.name}</span>
              <span className="text-[12px] font-bold tabular-nums">{bdt(p.price)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
