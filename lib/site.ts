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
  { label: "Brands", href: "/brands" },
  { label: "Learning Hub", href: "/learn" },
  { label: "Lab Guides", href: "/learn#lab-guides" },
  { label: "Tech Insights", href: "/blog" },
  { label: "Contact", href: "#contact" },
] as const;

/** Delivery options shown at checkout. Fees are placeholders until confirmed by the business. */
export const deliveryOptions = [
  { id: "inside-dhaka", label: "Inside Dhaka", fee: 70, note: "Home, hostel or office delivery in Dhaka city" },
  { id: "outside-dhaka", label: "Outside Dhaka", fee: 130, note: "Courier delivery to any district" },
  { id: "pickup", label: "Store pickup", fee: 0, note: "Collect from Adabor, Mohammadpur" },
] as const;

export type DeliveryId = (typeof deliveryOptions)[number]["id"];

export function whatsappLink(text: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}
