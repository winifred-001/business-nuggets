import defaults from "@/lib/legal-defaults.json";
import { API_URL } from "@/lib/api";

export type LegalSlug = keyof typeof defaults;
export type LegalDocument = {
  title: string;
  introduction: string;
  notice: string;
  sections: { id: string; title: string; body: string }[];
  updatedAt?: string;
};
export const legalDefaults: Record<LegalSlug, LegalDocument> = defaults;

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
