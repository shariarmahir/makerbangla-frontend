"use client";

import { useRef } from "react";
import { MagicLink, type MagicButtonSize, type MagicButtonVariant } from "@/components/ui/magic-button";
import { RocketIcon, type RocketIconHandle } from "@/components/ui/rocket";
import { SparklesIcon, type SparklesIconHandle } from "@/components/ui/sparkles";

const icons = { rocket: RocketIcon, sparkles: SparklesIcon };

/** 3D MagicLink whose animated icon plays while hovered or focused. */
export function AnimatedLink({ href, icon, variant = "default", size = "md", rainbow, className, children }: {
  href: string;
  icon: keyof typeof icons;
  variant?: MagicButtonVariant;
  size?: MagicButtonSize;
  rainbow?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<RocketIconHandle & SparklesIconHandle>(null);
  const Icon = icons[icon];
  const start = () => ref.current?.startAnimation();
  const stop = () => ref.current?.stopAnimation();
  return (
    <MagicLink href={href} variant={variant} size={size} rainbow={rainbow} onPointerEnter={start} onPointerLeave={stop} onFocus={start} onBlur={stop} className={className}>
      {children}
      <Icon ref={ref} size={18} aria-hidden />
    </MagicLink>
  );
}
