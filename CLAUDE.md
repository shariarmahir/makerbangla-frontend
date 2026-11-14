# Makerbangla Frontend

Makerbangla.com — "Let's Make a Better World". An education-first e-commerce store for engineering students, engineers and makers in Bangladesh: lab equipment, components and project kits (EEE, CSE, CE, Architecture, ME and more), plus a learning hub (circuit recipes, lab guides). Owner: Md. Khairul Alam (EEE, UAP). Built by Kandari Lab; all rights makerbangla.com.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict)
- Tailwind CSS v4 (CSS-first config in `app/globals.css`), shadcn/ui (`components/ui`)
- Backend (planned, separate repo `../makerbangla-backend`): FastAPI or Fastify. Set `API_URL` to enable server integrations.

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint

## Structure (no `src/`)

- `app/` — routes only: `/`, `/shop`, `/products/[slug]`, `/brands`, `/learn`, `/learn/[slug]` (recipes), `/blog`, `/blog/[slug]`, `/checkout`, `/checkout/success`, `/wishlist`, `/privacy`, `/terms`, plus `sitemap.ts`, `robots.ts`, `manifest.ts`, `actions.ts` (newsletter) and `checkout/actions.ts` (place order)
- `proxy.ts` — returns a real 404 for unknown `/products/*`, `/learn/*` and `/blog/*` slugs (detail pages stream inside Suspense, so status can't change later)
- `components/layout` — top bar, header, nav, footer, cart sheet
- `components/home` — landing page sections, one file per section, in page order
- `components/product` — product card, `ProductVisual` (cut-out or framed photo on a colourful stage), product actions (Buy Now, Add all to cart)
- `components/brand` — `BrandLogo` (Simple Icons glyph or typeset wordmark)
- `components/ui` — shadcn primitives and lucide-animated icons (added via the shadcn CLI from lucide-animated.com; do not hand-edit beyond theming)
- `lib/data` — catalog (categories, products), recipes + lab guides, Tech Insights articles, `cutouts.json` (slugs that have a transparent cut-out). Sample data until the backend exists.
- `lib/tones.ts` — colour tone per category / level (literal Tailwind classes)
- `lib/order.ts`, `lib/orders-store.ts`, `lib/receipt-pdf.ts` — order types, on-device receipt history, PDF receipt (jsPDF, loaded on click)
- `lib/catalog.ts` — query/filter/search helpers (server side)
- `lib/store.ts` — client cart/wishlist/recently-viewed store (`useSyncExternalStore` + localStorage)
- `lib/site.ts` — brand, contact and navigation config
- `public/brand` — logo assets; `public/images` — optimized WebP product and banner images

## Next.js 16 notes

- `cacheComponents` + `partialPrefetching` are on. Read `params`/`searchParams` only inside a `<Suspense>`-wrapped child (see `app/shop/page.tsx`, `app/products/[slug]/page.tsx`), otherwise the dev overlay reports "URL data outside of Suspense". `dynamicParams`/`dynamic`/`revalidate` segment configs are not allowed. Page files may only export Next's page fields.
- No `new Date()` in server components outside a `"use cache"` function (see footer year).
- `next/image` uses `preload` (not `priority`); allowed `quality` values are set in `next.config.ts`.
- Docs for this exact version live in `node_modules/next/dist/docs/`.

## Design rules

- Visual reference: AUTOZPRO-style dense retail layout, colourful Gen-Z tiles. Section order on `/` must stay: top bar → header → nav → component finder (yellow) → hero (watermark style) → category rail → campaign tiles → animated feature strip → deals + newsletter → promo rotator → category showcase rows → closing promos → brand strip → Education Hub + Make Your Recipe → two more category rows → Tech Insights → contact CTA → footer.
- Tokens live in `app/globals.css` (`--color-brand`, `--color-accent-yellow`, `--color-ink`, `--color-sale`, `--color-tile-*`, `--color-soft`, `--color-line`). Never hard-code hex values in components (Simple Icons brand colours are data, not styling).
- Palette is logo-led: teal (`tile-teal`, `tile-aqua`, `tile-deep`) + charcoal (`tile-ink`) with yellow as the main accent (`tile-yellow`, `tile-butter`, `tile-amber`); coral only for sale/advanced highlights. No greens, pinks, violets or blues. Tones per category/level/department live in `lib/tones.ts`.
- Product cards (`components/product/product-card.tsx`): solid tone card, product cut-out breaking out of the top edge and fading into the card, uppercase category label, bold title, two-line summary, price, Buy Now. No chip/background behind the heart, the discount or any text. Wrap cards in `productGrid` (extra top padding/row gap for the overflow) — never `overflow-hidden` on a card grid.
- All buttons use `components/ui/magic-button.tsx` (3D push button): `MagicButton` (button), `MagicLink` (Next link), `MagicAnchor` (tel/mailto/hash), `MagicFace` (visual only, inside an already-clickable card). `rainbow` (brand-colour animated edge) only on primary CTAs; small icon buttons (heart, quick-add, qty, carousel arrows) stay plain.
- Prices are shown as "BDT 1,250" via `bdt()` — never the ৳ glyph.
- Font: Inter via `next/font`; prices use tabular numerals (`tabular-nums`).
- Copy: no eyebrow labels above headings and no filler sub-notes under them. Keep it clean.
- Product images use `ProductVisual`: transparent cut-outs (`public/images/cutouts`, made from the hi-res photos with an ML background-removal model, max 1400px) float with `.cutout-shadow`. Never put a white plate or border behind a product image.
- Motion: CSS for hover/reveal/marquee; `motion` only for lucide-animated icons, the promo rotator and the order-success check. Everything respects `prefers-reduced-motion`.

## Data honesty

- Never invent ratings, reviews, stock or compatibility claims. Specs must be factual for the named part.
- Prices in `lib/data/catalog.ts` are placeholder sample prices (BDT) until the backend supplies live data.
- Product photos are from Wikimedia Commons (credited per product via `imageCredit`) and must be replaced by owned photography before launch.
- Checkout (`/checkout`) re-prices every line from the catalog on the server and POSTs the order to `${API_URL}/orders`. Without `API_URL` it works as a marked preview in development and refuses in production (asks the customer to call) so no order is silently lost. Payment is cash on delivery / pay at pickup only.
- Delivery fees in `lib/site.ts` (`deliveryOptions`) and the "Cash On Delivery" feature claim are placeholders until confirmed by the business.
- The newsletter action only forwards to `API_URL` when set.

## Security

- Security headers + CSP in `next.config.ts`. Keep `img-src` to `'self'` (all images are local).
- Validate every external input (search params, server action payloads, localStorage) — see `lib/catalog.ts` and `lib/store.ts`.
- No secrets in client code; only `NEXT_PUBLIC_*` env vars reach the browser.

## SEO

- Root metadata in `app/layout.tsx` (title template, OG, Twitter, canonical via `metadataBase`).
- JSON-LD: Organization + WebSite SearchAction on `/`, Product on product pages.
- `sitemap.ts` lists every product; `public/llms.txt` summarizes the site for LLM crawlers.
