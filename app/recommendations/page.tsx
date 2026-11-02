"use client";

import Link from "next/link";
import { Check, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AuthRouteGuard from "@/components/AuthRouteGuard";
import Footer from "@/components/Footer";
import Navbar from "@/components/navbar";
import NuggetCard from "@/components/NuggetCard";
import {
  rankPersonalizedNuggets,
  type UserPreferences,
} from "@/lib/personalization";
import type { Nugget } from "@/types/nugget";

type FollowedTopic = {
  topic?: string;
};

type NuggetsEnvelope = {
  data?: Nugget[];
  pagination?: {
    hasNextPage?: boolean;
    totalPages?: number;
  };
};

async function loadPublishedNuggets() {
  const nuggets: Nugget[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `/api/member/proxy/nuggets?limit=100&page=${page}`,
      { cache: "no-store" },
    );

    if (!response.ok) throw new Error("Could not load published Nuggets.");

    const result: unknown = await response.json();

    if (Array.isArray(result)) return result as Nugget[];
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

export default function RecommendationsPage() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    interests: [],
    wisdomNeeds: [],
  });
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [nuggets, setNuggets] = useState<Nugget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const [preferencesResponse, topicsResponse, publishedNuggets] =
          await Promise.all([
            fetch("/api/member/proxy/users/me/preferences", {
              cache: "no-store",
            }),
            fetch("/api/member/proxy/following/topics", {
              cache: "no-store",
            }),
            loadPublishedNuggets(),
          ]);

        const preferencesData = preferencesResponse.ok
          ? await preferencesResponse.json().catch(() => ({}))
          : {};
        const topicsData = topicsResponse.ok
          ? await topicsResponse.json().catch(() => [])
          : [];

        setPreferences({
          interests: Array.isArray(preferencesData.interests)
            ? preferencesData.interests
            : [],
          wisdomNeeds: Array.isArray(preferencesData.wisdomNeeds)
            ? preferencesData.wisdomNeeds
            : [],
        });

        setFollowedTopics(
          Array.isArray(topicsData)
            ? topicsData
                .map((item: string | FollowedTopic) =>
                  typeof item === "string" ? item : item.topic,
                )
                .filter((value): value is string => Boolean(value))
            : [],
        );

        setNuggets(publishedNuggets);

        if (!preferencesResponse.ok && !topicsResponse.ok) {
          setError("Could not load your saved recommendation choices.");
        }
      } catch {
        setError("Could not load your Recommendation Guide.");
      } finally {
        setLoading(false);
      }
    }

    void loadRecommendations();
  }, []);

  const recommendations = useMemo(
    () =>
      rankPersonalizedNuggets(
        nuggets,
        preferences,
        followedTopics,
        4,
      ),
    [nuggets, preferences, followedTopics],
  );

  const signalCount =
    preferences.interests.length +
    preferences.wisdomNeeds.length +
    followedTopics.length;

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
          <Link
            href="/home"
            className="font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
          >
            ← My Homepage
          </Link>

          <section className="mt-4">
            <h1 className="bn-hero-title font-serif leading-tight">
              Your Recommendation Guide
            </h1>
            <p className="mt-3 max-w-[720px] text-white/45">
              These recommendations are generated from the categories and Nuggets you
              selected during onboarding, plus topics you follow later.
            </p>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
              <h2 className="font-serif">Your Onboarding Categories</h2>
              <p className="mt-2 text-white/35">
                These are your current saved category choices from onboarding.
              </p>

              {loading ? (
                <p className="mt-5 text-white/35">Loading your choices...</p>
              ) : preferences.interests.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {preferences.interests.map((interest) => (
                    <div
                      key={interest}
                      className="flex items-start gap-3 rounded-md border border-[#C8A35A]/35 bg-[#C8A35A]/10 px-4 py-3"
                    >
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm bg-[#C8A35A] text-[#080808]">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <h3 className="font-serif text-white/90">{interest}</h3>
                        <p className="mt-1 text-white/35">
                          Nuggets connected to this category receive a stronger recommendation score.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-white/40">
                  You have not selected any onboarding categories yet.
                </p>
              )}

              <Link
                href="/onboarding?edit=1"
                className="bn-button mt-5 inline-flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-[#080808] px-4 text-white/70 transition hover:border-[#C8A35A]/30 hover:text-[#C8A35A]"
              >
                <SlidersHorizontal size={15} />
                Adjust Interests →
              </Link>
            </div>

            <div className="rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
              <h2 className="font-serif">Your Starting Nuggets</h2>
              <p className="mt-2 text-white/35">
                The Nuggets you chose in onboarding are the strongest recommendation signals.
              </p>

              {loading ? (
                <p className="mt-5 text-white/35">Loading your choices...</p>
              ) : preferences.wisdomNeeds.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {preferences.wisdomNeeds.map((title) => (
                    <span
                      key={title}
                      className="rounded-full border border-[#C8A35A]/30 bg-[#C8A35A]/[0.08] px-3 py-2 text-[#E0C48A]"
                    >
                      {title}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-white/40">
                  No starting Nuggets were selected. Category choices and followed topics will still personalize the guide.
                </p>
              )}

              {followedTopics.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-5">
                  <h3 className="font-serif">Topics You Follow</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {followedTopics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border border-white/10 px-3 py-2 text-white/55"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-serif">Recommended for Your Business Profile</h2>
            <p className="mt-2 max-w-[760px] text-white/40">
              The list below is recalculated from your current saved onboarding choices;
              it is not a fixed set of cards.
            </p>

            {error && (
              <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-[340px] animate-pulse rounded-xl border border-white/10 bg-[#111111]"
                  />
                ))}
              </div>
            ) : signalCount === 0 ? (
              <div className="mt-6 rounded-[10px] border border-white/10 bg-[#111111] p-7">
                <h3 className="font-serif">Choose interests to personalize your guide</h3>
                <p className="mt-2 text-white/40">
                  Complete onboarding so your homepage and Recommendation Guide can use the same preferences.
                </p>
                <Link
                  href="/onboarding"
                  className="mt-4 inline-flex font-medium text-[#C8A35A]"
                >
                  Complete Onboarding →
                </Link>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {recommendations.map((nugget) => (
                  <NuggetCard key={nugget.id} nugget={nugget} />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-[10px] border border-white/10 bg-[#111111] p-6 text-white/45">
                No published Nuggets match your current choices yet.
              </p>
            )}
          </section>

          <section className="mt-8 rounded-[10px] border border-[#C8A35A]/20 bg-[#C8A35A]/10 p-5">
            <h2 className="font-serif">Keep Your Discovery Open</h2>
            <p className="mt-2 text-white/40">
              Recommendations are a starting point. The complete Library remains available whenever you want to explore beyond your current profile.
            </p>
            <Link
              href="/library"
              className="mt-4 inline-flex font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              Explore Library →
            </Link>
          </section>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}
