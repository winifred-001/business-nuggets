import { API_URL } from "@/lib/api";
export type PublicCollection = {
  id: string; title: string; slug: string; description: string; image: string;
  nuggetIds: string[]; nuggetSlugs: string[];
};
export async function getCollections(): Promise<PublicCollection[]> {
  const response = await fetch(`${API_URL}/collections`, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load collections.");
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Invalid collections response.");
  return data;
}
export async function getCollection(slug: string): Promise<PublicCollection | null> {
  const response = await fetch(`${API_URL}/collections/${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Could not load this collection.");
  return response.json();
}
