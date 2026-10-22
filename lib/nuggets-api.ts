import { API_URL } from "@/lib/api";
import type { Nugget } from "@/types/nugget";

type NuggetsApiResponse = {
  data?: Nugget[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

/* =========================================================
   TYPE CHECK
========================================================= */

function isNugget(value: unknown): value is Nugget {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const nugget = value as Partial<Nugget>;

  return (
    typeof nugget.id === "string" &&
    typeof nugget.slug === "string" &&
    typeof nugget.title === "string"
  );
}

/* =========================================================
   GET ALL PUBLISHED NUGGETS
========================================================= */

export async function getPublishedNuggets(): Promise<Nugget[]> {
  const response = await fetch(
    `${API_URL}/nuggets?limit=100`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Could not load nuggets: ${response.status}`,
    );
  }

  const result: unknown =
    await response.json();

  // Old response format:
  // [ {...}, {...} ]
  if (Array.isArray(result)) {
    return result.filter(isNugget);
  }

  // New response format:
  // { data: [...], pagination: {...} }
  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result
  ) {
    const data = (
      result as NuggetsApiResponse
    ).data;

    if (Array.isArray(data)) {
      return data.filter(isNugget);
    }
  }

  return [];
}

/* =========================================================
   GET ONE NUGGET BY SLUG / ID
========================================================= */

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
    throw new Error(
      `Could not load nugget: ${response.status}`,
    );
  }

  const result: unknown =
    await response.json();

  // Direct Nugget response
  if (isNugget(result)) {
    return result;
  }

  // Wrapped response:
  // { data: {...} }
  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result
  ) {
    const data = (
      result as { data?: unknown }
    ).data;

    if (isNugget(data)) {
      return data;
    }
  }

  return null;
}