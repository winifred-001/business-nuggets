import { API_URL } from "@/lib/api";

export type PublicTopic = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  categoryId: number | null;
  nuggetCount: number;
};
export type PublicCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  nuggetCount: number;
};
export type TopicCatalog = { topics: PublicTopic[]; categories: PublicCategory[] };

export async function getTopicCatalog(): Promise<TopicCatalog> {
  const response = await fetch(`${API_URL}/topics/catalog`, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load topics and categories.");
  const data: TopicCatalog = await response.json();
  if (!Array.isArray(data.topics) || !Array.isArray(data.categories))
    throw new Error("Invalid topic catalog response.");
  return data;
}
