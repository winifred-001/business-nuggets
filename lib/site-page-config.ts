import defaults from "@/lib/site-page-defaults.json";
import legalDefaults from "@/lib/legal-defaults.json";
import type { LegalDocument, LegalSlug } from "@/lib/legal-pages";

export type InformationSlug = keyof typeof defaults;
export type SiteSlug = InformationSlug | LegalSlug;
export const siteDefaults: Record<SiteSlug, LegalDocument> = { ...defaults, ...legalDefaults };
export const sitePageLinks: Record<SiteSlug, { label: string; href: string }> = {
  about: { label: "About", href: "/philosophy" },
  contact: { label: "Contact", href: "/contact" },
  faqs: { label: "FAQs", href: "/faqs" },
  "privacy-policy": { label: "Privacy Policy", href: "/privacy-policy" },
  "terms-of-use": { label: "Terms of Use", href: "/terms-of-use" },
};

