import { API_URL } from "./api";
import type { Nugget } from "@/types/nugget";

export async function getPublishedNuggets(): Promise<Nugget[]> {
  const response = await fetch(`${API_URL}/nuggets`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load Nuggets");
  }

  return response.json();
}

export async function getNuggetBySlugFromApi(
  slug: string,
): Promise<Nugget | null> {
  const response = await fetch(
    `${API_URL}/nuggets/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load Nugget");
  }

  return response.json();
}