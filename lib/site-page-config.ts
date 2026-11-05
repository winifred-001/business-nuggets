import { authors } from "@/lib/authors";
import defaults from "@/lib/site-page-defaults.json";
import legalDefaults from "@/lib/legal-defaults.json";
import type { LegalDocument, LegalSlug } from "@/lib/legal-pages";

export type InformationSlug = keyof typeof defaults | "authors";
export type SiteSlug = InformationSlug | LegalSlug;
export const siteDefaults: Record<SiteSlug, LegalDocument> = {
  ...defaults,
  ...legalDefaults,
  authors: {
    title: "Authors & Creators",
    introduction: "Discover the named creators behind the platform’s cinematic wisdom works.",
    notice: "",
    sections: authors.map(author => ({ id: author.slug, title: author.name, body: author.bio })),
  },
};
export const sitePageLinks: Record<SiteSlug, { label: string; href: string }> = {
  authors: { label: "Authors", href: "/authors" },
  about: { label: "About", href: "/philosophy" },
  contact: { label: "Contact", href: "/contact" },
  faqs: { label: "FAQs", href: "/faqs" },
  "privacy-policy": { label: "Privacy Policy", href: "/privacy-policy" },
  "terms-of-use": { label: "Terms of Use", href: "/terms-of-use" },
};

