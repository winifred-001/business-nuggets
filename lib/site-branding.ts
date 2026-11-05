import { API_URL } from "@/lib/api";
export type SiteBranding = { logoUrl: string; faviconUrl: string; socialImageUrl: string };
export async function loadSiteBranding(): Promise<SiteBranding> {
  try {
    const response = await fetch(`${API_URL}/settings/branding`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error("Branding unavailable");
    const data = await response.json();
    const safe = (value: unknown) => typeof value === "string" && value.startsWith("https://") ? value : "";
    return { logoUrl: safe(data.logoUrl), faviconUrl: safe(data.faviconUrl), socialImageUrl: safe(data.socialImageUrl) };
  } catch { return { logoUrl: "", faviconUrl: "", socialImageUrl: "" }; }
}
