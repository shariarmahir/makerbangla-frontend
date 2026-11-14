"use client";

import Link from "next/link";
import * as React from "react";

export type MagicButtonVariant = "default" | "secondary" | "brand" | "accent" | "light";
export type MagicButtonSize = "sm" | "md" | "lg";

type Common = {
  variant?: MagicButtonVariant;
  size?: MagicButtonSize;
  /** Animate the 3D edge and shadow with a flowing gradient in the brand colours */
  rainbow?: boolean;
  /** Extra classes for the front face (e.g. width or justification) */
  faceClassName?: string;
};

export type MagicButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & Common;
export type MagicLinkProps = Omit<React.ComponentProps<typeof Link>, "children"> & Common & { children: React.ReactNode };

// 3D push button: a static shadow + edge sit behind a front face that lifts on
// hover and dips on press. `group-*` variants drive the layered motion from the
// element's interaction state; variant/rainbow colors are resolved per-render.
const BUTTON_CLASS =
  "group relative inline-block cursor-pointer select-none border-none bg-transparent p-0 font-bold [outline-offset:4px] [-webkit-tap-highlight-color:transparent] [transition:filter_600ms] hover:brightness-110 hover:[transition:filter_250ms] focus:outline-none focus-visible:brightness-110 focus-visible:[transition:filter_250ms] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:filter-none aria-disabled:pointer-events-none aria-disabled:opacity-50";

const SHADOW_BASE =
  "absolute inset-0 rounded-xl translate-y-[2px] [will-change:translate] [transition:translate_600ms_cubic-bezier(0.3,0.7,0.4,1)] group-hover:translate-y-[4px] group-hover:[transition:translate_250ms_cubic-bezier(0.3,0.7,0.4,1.5)] group-focus-visible:translate-y-[4px] group-focus-visible:[transition:translate_250ms_cubic-bezier(0.3,0.7,0.4,1.5)] group-active:translate-y-[1px] group-active:[transition:translate_34ms] group-data-[pressed=true]:translate-y-[1px] group-data-[pressed=true]:[transition:translate_34ms] group-disabled:hidden";

const EDGE_BASE = "absolute inset-0 rounded-xl group-disabled:hidden";

const FRONT_BASE =
  "relative flex items-center justify-center gap-2 rounded-xl whitespace-nowrap [will-change:translate] -translate-y-[4px] [transition:translate_600ms_cubic-bezier(0.3,0.7,0.4,1)] group-hover:-translate-y-[6px] group-hover:[transition:translate_250ms_cubic-bezier(0.3,0.7,0.4,1.5)] group-focus-visible:-translate-y-[6px] group-focus-visible:[transition:translate_250ms_cubic-bezier(0.3,0.7,0.4,1.5)] group-active:-translate-y-[2px] group-active:[transition:translate_34ms] group-data-[pressed=true]:-translate-y-[2px] group-data-[pressed=true]:[transition:translate_34ms] group-disabled:translate-y-0 group-disabled:[transition:none]";

const RAINBOW_FILL =
  "[background-image:linear-gradient(90deg,var(--rainbow-1),var(--rainbow-5),var(--rainbow-3),var(--rainbow-4),var(--rainbow-2))] [background-size:200%_100%] animate-magic-rainbow motion-reduce:animate-none";

const SOLID_SHADOW = "bg-[hsl(0deg_0%_0%_/_0.25)] blur-[4px]";
const RAINBOW_SHADOW = `${RAINBOW_FILL} blur-[12px] opacity-70`;

// Literal strings so Tailwind generates every class.
const edgeBg: Record<MagicButtonVariant, string> = {
  default:
    "[background:linear-gradient(to_left,color-mix(in_srgb,var(--primary)_50%,black)_0%,color-mix(in_srgb,var(--primary)_75%,black)_8%,color-mix(in_srgb,var(--primary)_75%,black)_92%,color-mix(in_srgb,var(--primary)_50%,black)_100%)]",
  secondary:
    "[background:linear-gradient(to_left,color-mix(in_srgb,var(--secondary)_50%,black)_0%,color-mix(in_srgb,var(--secondary)_75%,black)_8%,color-mix(in_srgb,var(--secondary)_75%,black)_92%,color-mix(in_srgb,var(--secondary)_50%,black)_100%)]",
  brand:
    "[background:linear-gradient(to_left,color-mix(in_srgb,var(--color-brand)_50%,black)_0%,color-mix(in_srgb,var(--color-brand)_75%,black)_8%,color-mix(in_srgb,var(--color-brand)_75%,black)_92%,color-mix(in_srgb,var(--color-brand)_50%,black)_100%)]",
  accent:
    "[background:linear-gradient(to_left,color-mix(in_srgb,var(--color-accent-yellow)_50%,black)_0%,color-mix(in_srgb,var(--color-accent-yellow)_75%,black)_8%,color-mix(in_srgb,var(--color-accent-yellow)_75%,black)_92%,color-mix(in_srgb,var(--color-accent-yellow)_50%,black)_100%)]",
  light:
    "[background:linear-gradient(to_left,color-mix(in_srgb,white_55%,black)_0%,color-mix(in_srgb,white_75%,black)_8%,color-mix(in_srgb,white_75%,black)_92%,color-mix(in_srgb,white_55%,black)_100%)]",
};

const frontVariant: Record<MagicButtonVariant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  brand: "bg-brand text-white",
  accent: "bg-accent-yellow text-tile-navy",
  light: "bg-white text-brand",
};

const frontSize: Record<MagicButtonSize, string> = {
  sm: "px-[var(--button-px-sm)] py-[var(--button-py-sm)] text-[length:var(--button-text-sm)] leading-[var(--button-leading-sm)]",
  md: "px-[var(--button-px-md)] py-[var(--button-py-md)] text-[length:var(--button-text-md)] leading-[var(--button-leading-md)]",
  lg: "px-[var(--button-px-lg)] py-[var(--button-py-lg)] text-[length:var(--button-text-lg)] leading-[var(--button-leading-lg)]",
};

/** The rainbow edge runs an infinite paint animation — pause it while off screen. */
function useRainbowPause<T extends HTMLElement>(rainbow: boolean) {
  const rootRef = React.useRef<T | null>(null);
  React.useEffect(() => {
    const root = rootRef.current;
    if (!rainbow || !root) return;
    const view = root.ownerDocument.defaultView ?? window;
    if (typeof view.IntersectionObserver === "undefined") return;
    const io = new view.IntersectionObserver(
      ([entry]) => {
        for (const layer of root.querySelectorAll<HTMLElement>(".animate-magic-rainbow"))
          layer.style.animationPlayState = entry.isIntersecting ? "" : "paused";
      },
      { rootMargin: "128px" },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [rainbow]);
  return rootRef;
}

function Layers({ variant, size, rainbow, faceClassName, children }: Required<Pick<Common, "variant" | "size" | "rainbow">> & { faceClassName?: string; children: React.ReactNode }) {
  return (
    <>
      <span className={`${SHADOW_BASE} ${rainbow ? RAINBOW_SHADOW : SOLID_SHADOW}`} aria-hidden="true" />
      <span className={`${EDGE_BASE} ${rainbow ? RAINBOW_FILL : edgeBg[variant]}`} aria-hidden="true" />
      <span data-size={size} className={`${FRONT_BASE} ${frontVariant[variant]} ${frontSize[size]} ${faceClassName ?? ""}`}>
        {children}
      </span>
    </>
  );
}

const MagicButton = React.forwardRef<HTMLButtonElement, MagicButtonProps>(
  ({ className, variant = "default", size = "md", rainbow = true, faceClassName, children, onKeyDown, onKeyUp, ...props }, ref) => {
    const [pressed, setPressed] = React.useState(false);
    const rootRef = useRainbowPause<HTMLButtonElement>(rainbow);
    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        rootRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      },
      [ref, rootRef],
    );

    return (
      <button
        ref={setRefs}
        data-variant={variant}
        data-rainbow={rainbow ? "true" : undefined}
        data-pressed={pressed ? "true" : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setPressed(true);
          onKeyDown?.(e);
        }}
        onKeyUp={(e) => {
          if (e.key === "Enter" || e.key === " ") setPressed(false);
          onKeyUp?.(e);
        }}
        className={`${BUTTON_CLASS} ${className ?? ""}`}
        {...props}
      >
        <Layers variant={variant} size={size} rainbow={rainbow} faceClassName={faceClassName}>{children}</Layers>
      </button>
    );
  },
);
MagicButton.displayName = "MagicButton";

/** Same 3D push design for navigation. */
function MagicLink({ className, variant = "default", size = "md", rainbow = false, faceClassName, children, ...props }: MagicLinkProps) {
  const rootRef = useRainbowPause<HTMLAnchorElement>(rainbow);
  return (
    <Link ref={rootRef} data-variant={variant} className={`${BUTTON_CLASS} ${className ?? ""}`} {...props}>
      <Layers variant={variant} size={size} rainbow={rainbow} faceClassName={faceClassName}>{children}</Layers>
    </Link>
  );
}

/** For external links (tel:, mailto:, wa.me). */
function MagicAnchor({ className, variant = "default", size = "md", rainbow = false, faceClassName, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & Common) {
  const rootRef = useRainbowPause<HTMLAnchorElement>(rainbow);
  return (
    <a ref={rootRef} data-variant={variant} className={`${BUTTON_CLASS} ${className ?? ""}`} {...props}>
      <Layers variant={variant} size={size} rainbow={rainbow} faceClassName={faceClassName}>{children}</Layers>
    </a>
  );
}

/** Static button face for use inside an already-clickable card (avoids nested links). Lifts when the card is hovered. */
function MagicFace({ className, variant = "default", size = "md", rainbow = false, faceClassName, children }: Common & { className?: string; children: React.ReactNode }) {
  return (
    <span data-variant={variant} className={`${BUTTON_CLASS} ${className ?? ""}`}>
      <Layers variant={variant} size={size} rainbow={rainbow} faceClassName={faceClassName}>{children}</Layers>
    </span>
  );
}

export { MagicAnchor, MagicButton, MagicFace, MagicLink };

export default MagicButton;
