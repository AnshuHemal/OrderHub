export const siteConfig = {
  name: "OrderHub",
  tagline: "Take orders. Fire tickets. Close tabs.",
  description:
    "OrderHub is a modern Cafe & Restaurant POS system. Floor plans, kitchen display, bill splitting, and real-time analytics — built for fast-moving cafes.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export type SiteConfig = typeof siteConfig;
