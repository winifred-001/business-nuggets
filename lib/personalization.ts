import type { Nugget } from "@/types/nugget";

export type UserPreferences = {
  interests: string[];
  wisdomNeeds: string[];
};

export type OnboardingChoice = {
  nugget: Nugget;
  source: "category" | "popular" | "recent";
};

function normalized(value: string) {
  return value.trim().toLowerCase();
}

function searchableText(nugget: Nugget) {
  return [
    nugget.title,
    nugget.topic,
    nugget.tag,
    nugget.keyPrinciple,
    nugget.marketplaceApplication,
    nugget.scriptureRef,
    nugget.scriptureText,
    ...(nugget.challenges ?? []),
    ...(nugget.practicalActionPlan ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function newestFirst(a: Nugget, b: Nugget) {
  const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
  const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;

  if (aTime !== bTime) return bTime - aTime;
  return b.number - a.number;
}

export function getCurrentCategories(nuggets: Nugget[]) {
  const categories = nuggets
    .map((nugget) => nugget.topic?.trim())
    .filter((value): value is string => Boolean(value));

  return [...new Set(categories)].sort((a, b) => a.localeCompare(b));
}

export function getOnboardingNuggetChoices(
  nuggets: Nugget[],
  selectedCategories: string[],
  limit = 5,
): OnboardingChoice[] {
  const result: OnboardingChoice[] = [];
  const used = new Set<string>();
  const selected = new Set(selectedCategories.map(normalized));
  const recent = [...nuggets].sort(newestFirst);

  const add = (nugget: Nugget, source: OnboardingChoice["source"]) => {
    if (result.length >= limit || used.has(nugget.id)) return;
    used.add(nugget.id);
    result.push({ nugget, source });
  };

  if (selected.size > 0) {
    recent
      .filter((nugget) => selected.has(normalized(nugget.topic || "")))
      .slice(0, 2)
      .forEach((nugget) => add(nugget, "category"));
  }

  const featured = recent.filter(
    (nugget) => Boolean((nugget as Nugget & { featured?: boolean }).featured),
  );

  const popularPool = featured.length > 0 ? featured : recent;
  popularPool.slice(0, 2).forEach((nugget) => add(nugget, "popular"));

  recent.forEach((nugget) => add(nugget, "recent"));

  return result.slice(0, limit);
}

export function rankPersonalizedNuggets(
  nuggets: Nugget[],
  preferences: UserPreferences,
  followedTopics: string[] = [],
  limit = 4,
) {
  const signals = [
    ...preferences.wisdomNeeds.map((value) => ({ value, weight: 4 })),
    ...preferences.interests.map((value) => ({ value, weight: 3 })),
    ...followedTopics.map((value) => ({ value, weight: 2 })),
  ];

  if (signals.length === 0) {
    return [...nuggets].sort(newestFirst).slice(0, limit);
  }

  const scored = nuggets.map((nugget) => {
    const searchable = searchableText(nugget);
    let score = 0;

    for (const signal of signals) {
      const value = normalized(signal.value);
      if (!value) continue;

      if (searchable.includes(value)) {
        score += signal.weight * 3;
        continue;
      }

      const words = value
        .split(/[\s&,/]+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 3);

      for (const word of words) {
        if (searchable.includes(word)) score += signal.weight;
      }
    }

    return { nugget, score };
  });

  const matches = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || newestFirst(a.nugget, b.nugget))
    .slice(0, limit)
    .map((item) => item.nugget);

  return matches.length > 0
    ? matches
    : [...nuggets].sort(newestFirst).slice(0, limit);
}
