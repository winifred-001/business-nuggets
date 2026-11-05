import { API_URL } from "@/lib/api";
import { siteDefaults, type InformationSlug } from "@/lib/site-page-config";
import type { LegalDocument } from "@/lib/legal-pages";

export async function getSitePage(slug: InformationSlug): Promise<LegalDocument> {
  try {
    const response = await fetch(`${API_URL}/settings/pages/${slug}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Page request failed (${response.status})`);
    return (await response.json()) ?? siteDefaults[slug];
  } catch (error) {
    console.error(`Could not load ${slug}; using original content`, error);
    return siteDefaults[slug];
  }
}
