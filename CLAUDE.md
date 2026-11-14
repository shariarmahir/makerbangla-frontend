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

- `app/` — routes only: `/`, `/shop`, `/products/[slug]`, `/learn`, `/wishlist`, `/privacy`, `/terms`, plus `sitemap.ts`, `robots.ts`, `manifest.ts`, `actions.ts` (server actions)
- `components/layout` — top bar, header, nav, footer, cart sheet
- `components/home` — landing page sections, one file per section, in page order
- `components/product` — product card and product actions
- `components/ui` — shadcn primitives (do not hand-edit beyond theming)
- `lib/data` — catalog (categories, products, recipes, lab guides). Sample data until the backend exists.
- `lib/catalog.ts` — query/filter/search helpers (server side)
- `lib/store.ts` — client cart/wishlist/recently-viewed store (`useSyncExternalStore` + localStorage)
- `lib/site.ts` — brand, contact and navigation config
- `public/brand` — logo assets; `public/images` — optimized WebP product and banner images

## Design rules

- Visual reference: AUTOZPRO-style dense retail layout. Section order on `/` must stay: top bar → header → nav → component finder → hero → category rail → campaign tiles → deals + newsletter → category showcase rows → closing promos → footer.
- Tokens live in `app/globals.css` (`--color-brand`, `--color-accent` yellow CTA, `--color-ink` charcoal, `--color-sale` red, `--color-soft`, `--color-line`). Never hard-code hex values in components.
- Font: Inter via `next/font`; prices use tabular numerals (`tabular-nums`).
- Copy: no eyebrow labels above headings and no filler sub-notes under them. Keep it clean.
- Product images sit on white/soft stages with `mix-blend-multiply` so white backgrounds disappear.
- Animations are CSS only (hover transitions, scroll-driven reveal via `.reveal`) and respect `prefers-reduced-motion`.

## Data honesty

- Never invent ratings, reviews, stock or compatibility claims. Specs must be factual for the named part.
- Prices in `lib/data/products.ts` are placeholder sample prices (BDT) until the backend supplies live data.
- Product photos are from Wikimedia Commons (credited per product via `imageCredit`) and must be replaced by owned photography before launch.
- Ordering goes through WhatsApp (`lib/site.ts`); there is no payment, account or email integration yet. The newsletter action only forwards to `API_URL` when set.

## Security

- Security headers + CSP in `next.config.ts`. Keep `img-src` to `'self'` (all images are local).
- Validate every external input (search params, server action payloads, localStorage) — see `lib/catalog.ts` and `lib/store.ts`.
- No secrets in client code; only `NEXT_PUBLIC_*` env vars reach the browser.

## SEO

- Root metadata in `app/layout.tsx` (title template, OG, Twitter, canonical via `metadataBase`).
- JSON-LD: Organization + WebSite SearchAction on `/`, Product on product pages.
- `sitemap.ts` lists every product; `public/llms.txt` summarizes the site for LLM crawlers.
