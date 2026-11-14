export const site = {
  name: "Makerbangla",
  domain: "makerbangla.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://makerbangla.com",
  tagline: "Let's Make a Better World",
  description:
    "Engineering components, lab equipment and project kits for EEE, CSE, Civil, Mechanical and Architecture students in Bangladesh — with circuit recipes and lab guides to learn what you build.",
  owner: "Md. Khairul Alam",
  phone: "01711-991079",
  phoneIntl: "+8801711991079",
  whatsapp: "8801711991079",
  email: "info.makerbangla@gmail.com",
  address: { street: "Adabor 10, Mohammadpur", city: "Dhaka", country: "BD" },
  builder: "Kandari Lab",
} as const;

export const mainNav = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Learning Hub", href: "/learn" },
  { label: "Lab Guides", href: "/learn#lab-guides" },
  { label: "Contact", href: "#contact" },
] as const;

export function whatsappLink(text: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}
