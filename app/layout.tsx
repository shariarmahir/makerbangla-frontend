import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { categories } from "@/lib/data/catalog";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Engineering Components, Lab Equipment & Project Kits in Bangladesh`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "Arduino Bangladesh", "ESP32 Bangladesh", "electronics components Dhaka", "engineering lab equipment",
    "sensors", "microcontrollers", "Raspberry Pi", "robotics parts", "EEE lab kit", "CSE project kit",
    "civil survey instruments", "architecture drafting tools", "circuit recipes", "Makerbangla",
    ...categories.map((c) => c.name),
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.builder,
  publisher: site.name,
  category: "Education & Electronics",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_BD",
    url: "/",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: `${site.name} — ${site.tagline}`, description: site.description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-dvh flex-col overflow-x-clip">
        {children}
      </body>
    </html>
  );
}
