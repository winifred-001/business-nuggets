"use client";

import Link from "next/link";
import { Check, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AuthRouteGuard from "@/components/AuthRouteGuard";
import ContentImage from "@/components/ContentImage";
import Footer from "@/components/Footer";
import Navbar from "@/components/navbar";
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

function getMatchReason(
  nugget: Nugget,
  preferences: UserPreferences,
  followedTopics: string[],
) {
  const exactInterest = preferences.interests.find(
    (interest) =>
      interest.trim().toLowerCase() === nugget.topic.trim().toLowerCase(),
  );

  if (exactInterest) {
    return `Directly matches your ${exactInterest} interest.`;
  }

  if (preferences.wisdomNeeds.includes(nugget.title)) {
    return "You selected this Nugget while setting up your wisdom stream.";
  }

  const searchable = [
    nugget.title,
    nugget.topic,
    nugget.tag,
    nugget.keyPrinciple,
    nugget.marketplaceApplication,
    ...(nugget.challenges ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const relatedInterest = preferences.interests.find((interest) => {
    const words = interest
      .toLowerCase()
      .split(/[\s&,/]+/)
      .filter((word) => word.length > 3);

    return words.some((word) => searchable.includes(word));
  });

  if (relatedInterest) {
    return `Connects with your ${relatedInterest} interest.`;
  }

  const followed = followedTopics.find((topic) =>
    searchable.includes(topic.trim().toLowerCase()),
  );

  if (followed) {
    return `Related to the ${followed} topic you follow.`;
  }

  return "Recommended from your current Business Nuggets profile.";
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
        3,
      ),
    [nuggets, preferences, followedTopics],
  );

  const signalCount =
    preferences.interests.length +
    preferences.wisdomNeeds.length +
    followedTopics.length;

  const interestSummary = preferences.interests.join(" • ");

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
            <p className="mt-3 max-w-[780px] text-white/45">
              A starting point for discovery, shaped by the interests and Nuggets you
              selected during onboarding.
            </p>
          </section>

          <section className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <div className="flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-serif">Recommended for Your Business Profile</h2>

                {!loading && preferences.interests.length > 0 && (
                  <p className="text-white/35">
                    Based on your interests: {interestSummary}
                  </p>
                )}
              </div>

              {error && (
                <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="mt-5 space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-[150px] animate-pulse rounded-[10px] border border-white/10 bg-[#111111]"
                    />
                  ))}
                </div>
              ) : signalCount === 0 ? (
                <div className="mt-5 rounded-[10px] border border-white/10 bg-[#111111] p-7">
                  <h3 className="font-serif">Choose interests to personalize your guide</h3>
                  <p className="mt-2 max-w-[600px] text-white/40">
                    Complete onboarding so this guide and your homepage can recommend
                    Nuggets from the same saved choices.
                  </p>
                  <Link
                    href="/onboarding"
                    className="mt-4 inline-flex font-medium text-[#C8A35A]"
                  >
                    Complete Onboarding →
                  </Link>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {recommendations.map((nugget) => (
                    <article
                      key={nugget.id}
                      className="overflow-hidden rounded-[10px] border border-white/10 bg-[#111111]"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative min-h-[180px] w-full shrink-0 overflow-hidden bg-[#181818] sm:min-h-[150px] sm:w-[190px]">
                          <ContentImage
                            src={nugget.image}
                            alt={nugget.title}
                          />
                        </div>

                        <div className="min-w-0 flex-1 p-5 sm:p-6">
                          <h3 className="font-serif text-[20px] leading-snug text-white/95">
                            {nugget.title}
                          </h3>

                          <p className="mt-2 text-[#C8A35A]">
                            {nugget.scriptureRef || nugget.topic}
                          </p>

                          <div className="mt-4 border-t border-white/10 pt-3">
                            <p className="font-semibold uppercase tracking-[0.08em] text-white/35">
                              Why This Matches
                            </p>
                            <p className="mt-1 text-white/45">
                              {getMatchReason(nugget, preferences, followedTopics)}
                            </p>
                          </div>

                          <Link
                            href={`/nugget/${nugget.slug}`}
                            className="mt-4 inline-flex font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
                          >
                            Start Reading →
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-[10px] border border-white/10 bg-[#111111] p-6 text-white/45">
                  No published Nuggets match your current choices yet.
                </p>
              )}
            </div>

            <aside className="h-fit rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
              <h2 className="font-serif">Your Chosen Interests</h2>

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

                      <div className="min-w-0">
                        <p className="font-medium text-white/90">{interest}</p>
                        <p className="mt-1 text-white/35">
                          Recommendations prioritize teachings related to this area.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-white/40">
                  You have not selected any interests yet.
                </p>
              )}

              <Link
                href="/onboarding?edit=1"
                className="bn-button mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-[#080808] px-4 text-white/70 transition hover:border-[#C8A35A]/30 hover:text-[#C8A35A]"
              >
                <SlidersHorizontal size={15} />
                Adjust Interests
              </Link>

              <div
                id="how-recommendations-work"
                className="mt-6 border-t border-white/10 pt-5"
              >
                <p className="font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                  Why These Teachings?
                </p>
                <p className="mt-3 leading-6 text-white/40">
                  Your current onboarding choices receive the strongest weight. Topics
                  you follow later can also refine what appears here and on your homepage.
                </p>
                <a
                  href="#how-recommendations-work"
                  className="mt-4 inline-flex font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
                >
                  Learn how recommendations work →
                </a>
              </div>
            </aside>
          </section>

          <section className="mt-8 rounded-[10px] border border-[#C8A35A]/20 bg-[#C8A35A]/10 p-5 sm:p-6">
            <h2 className="font-serif">Keep Your Discovery Open</h2>
            <p className="mt-2 max-w-[900px] text-white/40">
              Recommendations are a starting point, not a limit. Explore the full Library
              whenever you want teachings outside your current interests.
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
