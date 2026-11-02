"use client";

import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getCurrentCategories } from "@/lib/personalization";
import type { Nugget } from "@/types/nugget";

type NuggetsEnvelope = {
  data?: Nugget[];
  pagination?: {
    hasNextPage?: boolean;
    totalPages?: number;
  };
};

type BusinessCategoryPreferencesProps = {
  variant?: "chips" | "cards";
  showSaveButton?: boolean;
};

async function loadPublishedNuggets() {
  const nuggets: Nugget[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `/api/member/proxy/nuggets?limit=100&page=${page}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error("Could not load the current business categories.");
    }

    const result: unknown = await response.json();

    if (Array.isArray(result)) {
      return result as Nugget[];
    }

    if (!result || typeof result !== "object") break;

    const envelope = result as NuggetsEnvelope;
    if (!Array.isArray(envelope.data)) break;

    nuggets.push(...envelope.data);

    if (
      !envelope.pagination?.hasNextPage ||
      page >= (envelope.pagination.totalPages ?? page)
    ) {
      break;
    }

    page += 1;
  }

  return nuggets;
}

export default function BusinessCategoryPreferences({
  variant = "chips",
  showSaveButton = true,
}: BusinessCategoryPreferencesProps) {
  const [nuggets, setNuggets] = useState<Nugget[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadCategoriesAndPreferences() {
      try {
        const [publishedNuggets, preferencesResponse] = await Promise.all([
          loadPublishedNuggets(),
          fetch("/api/member/proxy/users/me/preferences", {
            cache: "no-store",
          }),
        ]);

        const preferences = preferencesResponse.ok
          ? await preferencesResponse.json().catch(() => ({}))
          : {};

        setNuggets(publishedNuggets);
        setSelectedCategories(
          Array.isArray(preferences.interests) ? preferences.interests : [],
        );

        if (!preferencesResponse.ok) {
          setError(true);
          setMessage("Could not load your saved categories.");
        }
      } catch (loadError) {
        setError(true);
        setMessage(
          loadError instanceof Error
            ? loadError.message
            : "Could not load the current business categories.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCategoriesAndPreferences();
  }, []);

  const categories = useMemo(() => getCurrentCategories(nuggets), [nuggets]);

  function toggleCategory(category: string) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
    setMessage("");
    setError(false);
  }

  async function saveCategories() {
    setSaving(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch(
        "/api/member/proxy/users/me/preferences",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            interests: selectedCategories,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(true);
        setMessage(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Could not save your categories.",
        );
        return;
      }

      setMessage("Business categories saved.");
      window.dispatchEvent(new Event("preferences-change"));
    } catch {
      setError(true);
      setMessage("Could not save your categories.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-[12px] text-white/40">
        Loading current business categories...
      </p>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="text-[12px] text-white/40">
        No current published business categories are available yet.
      </p>
    );
  }

  return (
    <div>
      <div
        className={
          variant === "cards"
            ? "grid max-h-[360px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2"
            : "flex max-h-[260px] flex-wrap gap-2.5 overflow-y-auto pr-1"
        }
      >
        {categories.map((category) => {
          const selected = selectedCategories.includes(category);

          if (variant === "cards") {
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`flex items-center justify-between rounded-lg border p-4 text-left transition ${
                  selected
                    ? "border-[#C8A35A]/60 bg-[#C8A35A]/15"
                    : "border-white/10 bg-[#141414] hover:border-white/20"
                }`}
              >
                <span className="pr-3 text-[13px] text-white/75">
                  {category}
                </span>

                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    selected
                      ? "border-[#C8A35A] bg-[#C8A35A] text-black"
                      : "border-white/15"
                  }`}
                >
                  {selected && <Check size={12} />}
                </span>
              </button>
            );
          }

          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`rounded-full border px-4 py-2 text-[12px] transition ${
                selected
                  ? "border-[#C8A35A] bg-[#C8A35A]/15 text-[#E0C48A]"
                  : "border-white/10 text-white/45 hover:border-white/20 hover:text-white/70"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {message && (
        <p className={`mt-4 text-[12px] ${error ? "text-red-400" : "text-[#C8A35A]"}`}>
          {message}
        </p>
      )}

      {showSaveButton && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={saveCategories}
            disabled={saving}
            className="rounded-md bg-[#C8A35A] px-5 py-2.5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Categories"}
          </button>
        </div>
      )}
    </div>
  );
}
