"use client";

import Link from "next/link";
import { useRef } from "react";
import { RocketIcon, type RocketIconHandle } from "@/components/ui/rocket";
import { SparklesIcon, type SparklesIconHandle } from "@/components/ui/sparkles";

const icons = { rocket: RocketIcon, sparkles: SparklesIcon };

/** Link whose animated icon plays while the link is hovered or focused. */
export function AnimatedLink({ href, icon, className, children }: { href: string; icon: keyof typeof icons; className?: string; children: React.ReactNode }) {
  const ref = useRef<RocketIconHandle & SparklesIconHandle>(null);
  const Icon = icons[icon];
  const start = () => ref.current?.startAnimation();
  const stop = () => ref.current?.stopAnimation();
  return (
    <Link href={href} onPointerEnter={start} onPointerLeave={stop} onFocus={start} onBlur={stop} className={className}>
      {children}
      <Icon ref={ref} size={18} aria-hidden />
    </Link>
  );
}
