import { MagicLink } from "@/components/ui/magic-button";

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[60vh] place-content-center py-16 text-center">
      <p className="text-6xl font-extrabold tracking-tight text-brand">404</p>
      <h1 className="mt-3 text-xl font-bold">This page took a wrong turn</h1>
      <p className="mt-2 text-[13px] text-subtle">The link may be outdated or the product is no longer listed.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <MagicLink href="/">Go home</MagicLink>
        <MagicLink href="/shop" variant="accent">Browse the shop</MagicLink>
      </div>
    </div>
  );
}
