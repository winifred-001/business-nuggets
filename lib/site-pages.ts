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

export type PublicSitePage = {
  slug: string;
  title: string;
  navLabel: string;
  href: string;
  published: boolean;
  showInNavigation: boolean;
  metaDescription: string;
};

export async function getCustomSitePage(slug: string): Promise<LegalDocument | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  try {
    const response = await fetch(API_URL + "/settings/pages/" + encodeURIComponent(slug), {
      cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Page request failed (" + response.status + ")");
    const page = await response.json() as LegalDocument;
    return page.isCustom && page.published ? page : null;
  } catch (error) {
    console.error("Could not load custom site page", error);
    return null;
  }
}

export async function getPublicCustomPages(): Promise<PublicSitePage[]> {
  try {
    const response = await fetch(API_URL + "/settings/site-pages", {
      cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Page list failed (" + response.status + ")");
    const pages: PublicSitePage[] = await response.json();
    return Array.isArray(pages) ? pages.filter(page => page.published && /^\/pages\/[a-z0-9-]+$/.test(page.href)) : [];
  } catch (error) {
    console.error("Could not load public site navigation", error);
    return [];
  }
}
