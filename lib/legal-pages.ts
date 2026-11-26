import defaults from "@/lib/legal-defaults.json";
import { API_URL } from "@/lib/api";

export type LegalSlug = keyof typeof defaults;
export type LegalDocument = {
  title: string;
  introduction: string;
  notice: string;
  sections: SiteSection[];
  isCustom?: boolean;
  published?: boolean;
  showInNavigation?: boolean;
  navLabel?: string;
  metaDescription?: string;
  updatedAt?: string;
};
export const legalDefaults: Record<LegalSlug, LegalDocument> = defaults;


export type SiteSection = {
  id: string;
  title: string;
  body: string;
  kind?:
    | "text"
    | "image"
    | "quote"
    | "callout"
    | "button"
    | "divider"
    | "faq"
    | "author";
  width?: "full" | "half";
  alignment?: "left" | "center";
  appearance?: "plain" | "card" | "accent";
  imageUrl?: string;
  imageAlt?: string;
  buttonText?: string;
  buttonHref?: string;
};


export async function getLegalDocument(slug: LegalSlug): Promise<LegalDocument> {
  try {
    const response = await fetch(`${API_URL}/settings/legal/${slug}`, {
      cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Legal page request failed (${response.status})`);
    const document = await response.json();
    return document ?? legalDefaults[slug];
  } catch (error) {
    console.error(`Could not load ${slug}; using original content`, error);
    return legalDefaults[slug];
  }
}
