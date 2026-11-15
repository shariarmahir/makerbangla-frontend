import { randomBytes } from "node:crypto";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_SERVER } from "next/constants";

const isDev = process.env.NODE_ENV !== "production";

// All images and fonts are self-hosted, so the policy can stay tight.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = (phase: string): NextConfig => ({
  // Session signing key for deploys without SESSION_SECRET: random per build, inlined into server code only
  // (lib/admin/session.ts, marked server-only). `next start` keeps the key the build inlined.
  env: phase === PHASE_PRODUCTION_SERVER || process.env.SESSION_SECRET ? {} : { MB_SESSION_KEY: randomBytes(32).toString("base64url") },
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Dashboard image uploads (max 4 MB) go through a server action.
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
});

export default nextConfig;
