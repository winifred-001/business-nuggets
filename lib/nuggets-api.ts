import { withBibleGroup } from "@/lib/bible-books";
import { API_URL } from "@/lib/api";
import type { Nugget } from "@/types/nugget";

type NuggetsApiResponse = {
  data?: Nugget[];
  access?: {
    premium: boolean;
    freeLimit: number | null;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export class PremiumRequiredError extends Error {
  code = "PREMIUM_REQUIRED";

  constructor(
    message =
      "This Business Nugget is available to Premium members.",
  ) {
    super(message);
    this.name =
      "PremiumRequiredError";
  }
}

function resolveToken(
  token?: string | null,
) {
  if (token !== undefined) {
    return token;
  }

  if (
    typeof window !==
    "undefined"
  ) {
    return localStorage.getItem(
      "token",
    );
  }

  return null;
}

function authHeaders(
  token?: string | null,
) {
  const resolvedToken =
    resolveToken(token);

  return resolvedToken
    ? {
        Authorization:
          `Bearer ${resolvedToken}`,
      }
    : undefined;
}

function normalizeFeed(
  data: unknown[],
  premium: boolean,
) {
  return data
    .filter(isNugget)
    .map(withBibleGroup)
    .map(
      (nugget) =>
        premium
          ? {
              ...nugget,
              isGold: false,
              locked: false,
            }
          : nugget,
    );
}

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

export async function getPublishedNuggets(
  token?: string | null,
): Promise<Nugget[]> {
  const headers = authHeaders(token);
  const nuggets: Nugget[] = [];
  let page = 1;
  while (true) {
    const response = await fetch(`${API_URL}/nuggets?limit=100&page=${page}`, {
      cache: "no-store",
      headers,
    });
    if (!response.ok) throw new Error(`Could not load nuggets: ${response.status}`);
    const result: unknown = await response.json();
    if (Array.isArray(result)) return normalizeFeed(result, false);
    if (!result || typeof result !== "object" || !("data" in result)) return nuggets;
    const envelope = result as NuggetsApiResponse;
    if (!Array.isArray(envelope.data)) return nuggets;
    nuggets.push(...normalizeFeed(envelope.data, envelope.access?.premium === true));
    if (!envelope.pagination?.hasNextPage || page >= envelope.pagination.totalPages || !envelope.data.length) break;
    page += 1;
  }
  return nuggets;
}


/* =========================================================
   GET ONE NUGGET BY SLUG / ID
========================================================= */

export async function getNuggetBySlugFromApi(
  slug: string,
  token?: string | null,
): Promise<Nugget | null> {
  const response = await fetch(
    `${API_URL}/nuggets/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
      headers:
        authHeaders(token),
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (response.status === 403) {
    const data =
      await response
        .json()
        .catch(() => ({}));

    if (
      data?.code ===
      "PREMIUM_REQUIRED"
    ) {
      throw new PremiumRequiredError(
        data.message,
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      `Could not load nugget: ${response.status}`,
    );
  }

  const result: unknown =
    await response.json();

  if (isNugget(result)) {
    return withBibleGroup(result);
  }

  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result
  ) {
    const data = (
      result as { data?: unknown }
    ).data;

    if (isNugget(data)) {
      return withBibleGroup(data);
    }
  }

  return null;
}