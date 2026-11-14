import { NextResponse, type NextRequest } from "next/server";
import { articles } from "@/lib/data/articles";
import { products } from "@/lib/data/catalog";
import { recipes } from "@/lib/data/learning";

const known: Record<string, Set<string>> = {
  products: new Set(products.map((p) => p.slug)),
  learn: new Set(recipes.map((r) => r.slug)),
  blog: new Set(articles.map((a) => a.slug)),
};

/** Unknown detail URLs get a real 404 status (the pages stream under Suspense, so status can't change later). */
export function proxy(request: NextRequest) {
  const [, section = "", slug = "", ...rest] = request.nextUrl.pathname.split("/");
  if (rest.length || !known[section]?.has(slug)) {
    return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  }
}

export const config = { matcher: ["/products/:slug+", "/learn/:slug+", "/blog/:slug+"] };
