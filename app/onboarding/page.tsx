"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

import AuthRouteGuard from "@/components/AuthRouteGuard";
import Footer from "@/components/Footer";
import Navbar from "@/components/navbar";
import {
  getCurrentCategories,
  getOnboardingNuggetChoices,
} from "@/lib/personalization";
import type { Nugget } from "@/types/nugget";

type NuggetsEnvelope = {
  data?: Nugget[];
  pagination?: {
    hasNextPage?: boolean;
    totalPages?: number;
  };
};

type PopularNuggetResponse = {
  data?: Array<{
    nuggetId?: string;
  }>;
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
      throw new Error("Could not load published Nuggets.");
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

async function loadPopularNuggetIds() {
  try {
    const response = await fetch(
      "/api/member/proxy/discovery/popular-nuggets?limit=5&days=30",
      { cache: "no-store" },
    );

    if (!response.ok) return [];

    const result = (await response.json().catch(() => ({}))) as PopularNuggetResponse;

    return Array.isArray(result.data)
      ? result.data
          .map((item) => item.nuggetId)
          .filter((value): value is string => Boolean(value))
      : [];
  } catch {
    return [];
  }
}

export default function OnboardingPage() {
  const router = useRouter();

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedWisdom, setSelectedWisdom] = useState<string[]>([]);
  const [nuggets, setNuggets] = useState<Nugget[]>([]);
  const [popularNuggetIds, setPopularNuggetIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOnboarding() {
      try {
        const [preferencesResponse, publishedNuggets, popularIds] =
          await Promise.all([
            fetch("/api/member/proxy/users/me/preferences", {
              cache: "no-store",
            }),
            loadPublishedNuggets(),
            loadPopularNuggetIds(),
          ]);

        const preferencesData = preferencesResponse.ok
          ? await preferencesResponse.json().catch(() => ({}))
          : {};

        setNuggets(publishedNuggets);
        setPopularNuggetIds(popularIds);
        setSelectedInterests(
          Array.isArray(preferencesData.interests)
            ? preferencesData.interests
            : [],
        );
        setSelectedWisdom(
          Array.isArray(preferencesData.wisdomNeeds)
            ? preferencesData.wisdomNeeds
            : [],
        );

        if (!preferencesResponse.ok) {
          setError("Could not load your saved onboarding choices.");
        }
      } catch {
        setError("Could not load the current onboarding options.");
      } finally {
        setLoading(false);
      }
    }

    void loadOnboarding();
  }, []);

  const categories = useMemo(
    () => getCurrentCategories(nuggets),
    [nuggets],
  );

  const nuggetChoices = useMemo(
    () =>
      getOnboardingNuggetChoices(
        nuggets,
        selectedInterests,
        popularNuggetIds,
        5,
      ),
    [nuggets, selectedInterests, popularNuggetIds],
  );

  function toggleInterest(interest: string) {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
    setError("");
  }

  function toggleWisdom(title: string) {
    setSelectedWisdom((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title],
    );
    setError("");
  }

  async function savePreferences() {
    if (selectedInterests.length === 0) {
      setError("Choose at least one business category.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/member/proxy/users/me/preferences",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            interests: selectedInterests,
            wisdomNeeds: selectedWisdom,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Could not save your onboarding choices.",
        );
        return;
      }

      router.push("/onboarding-complete");
      router.refresh();
    } catch {
      setError("Could not save your onboarding choices.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="flex flex-wrap items-center justify-center gap-3 text-center">
            <span className="rounded-full bg-[#E28906] px-3 py-1 font-semibold text-[#080808]">
              STEP 2 OF 3
            </span>
            <span className="text-white/40">Customizing your wisdom stream</span>
          </div>

          <div className="mt-8 text-center">
            <h1 className="bn-hero-title font-serif leading-tight text-white">
              What interests you?
            </h1>
            <p className="mx-auto mt-3 max-w-[650px] text-white/45">
              Select the current Business Nuggets categories that match your work,
              leadership and marketplace interests.
            </p>
          </div>

          {loading ? (
            <p className="mt-10 text-white/35">Loading current categories and Nuggets...</p>
          ) : (
            <>
              <section className="mt-8 w-full max-w-[940px]">
                <h2 className="text-center font-serif">Choose Your Categories</h2>

                {categories.length > 0 ? (
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    {categories.map((interest) => {
                      const selected = selectedInterests.includes(interest);

                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2 transition ${
                            selected
                              ? "border-[#E28906] bg-[#E28906] text-[#080808]"
                              : "border-white/10 bg-[#151515] text-white/60 hover:border-[#E28906]/50 hover:text-white"
                          }`}
                        >
                          {selected && <Check size={14} strokeWidth={3} />}
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-5 text-center text-white/40">
                    No published Nugget categories are available yet.
                  </p>
                )}
              </section>

              <section className="mt-9 w-full max-w-[860px] rounded-[10px] border border-white/10 bg-[#111111] px-5 py-6 sm:px-7">
                <h2 className="font-serif">Choose Nuggets for Your Wisdom Stream</h2>
                <p className="mt-2 text-white/35">
                  These five options are refreshed from popular Nuggets, recent Nuggets
                  and Nuggets inside the categories you selected.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {nuggetChoices.map(({ nugget, source }) => {
                    const selected = selectedWisdom.includes(nugget.title);
                    const sourceLabel =
                      source === "category"
                        ? "From your categories"
                        : source === "popular"
                          ? "Popular"
                          : "Recent";

                    return (
                      <button
                        key={nugget.id}
                        type="button"
                        onClick={() => toggleWisdom(nugget.title)}
                        className={`flex min-h-[76px] items-start gap-3 rounded-lg border px-4 py-3 text-left transition ${
                          selected
                            ? "border-[#E28906] bg-[#E28906]/15 text-[#FAF9F6]"
                            : "border-white/10 bg-[#181818] text-white/65 hover:border-[#E28906]/40 hover:text-white"
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm border ${
                            selected
                              ? "border-[#E28906] bg-[#E28906] text-[#080808]"
                              : "border-white/20"
                          }`}
                        >
                          {selected && <Check size={12} strokeWidth={3} />}
                        </span>

                        <span className="min-w-0">
                          <span className="block font-medium text-white/90">
                            {nugget.title}
                          </span>
                          <span className="mt-1 block text-white/35">
                            {sourceLabel} · {nugget.topic}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {error && (
                <div className="mt-5 w-full max-w-[860px] rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                  <p className="text-center text-red-400">{error}</p>
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/onboarding-complete")}
                  className="min-h-10 px-4 text-white/55 transition hover:text-white"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  onClick={savePreferences}
                  disabled={saving || selectedInterests.length === 0}
                  className="min-h-10 rounded-md bg-[#E28906] px-7 font-semibold text-[#080808] transition hover:bg-[#E28906] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? "Saving..." : "Save & Continue"}
                </button>
              </div>
            </>
          )}
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}
