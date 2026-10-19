"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Check,
  SlidersHorizontal,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import AuthRouteGuard from "@/components/AuthRouteGuard";

import { API_URL } from "@/lib/api";
import { getPublishedNuggets } from "@/lib/nuggets-api";

import type { Nugget } from "@/types/nugget";

type FollowedTopic = {
  id: number;
  userId: number;
  topic: string;
  createdAt: string;
};

type UserPreferences = {
  interests: string[];
  wisdomNeeds: string[];
};

export default function RecommendationsPage() {
  const [topics, setTopics] =
    useState<FollowedTopic[]>([]);

  const [preferences, setPreferences] =
    useState<UserPreferences>({
      interests: [],
      wisdomNeeds: [],
    });

  const [nuggets, setNuggets] =
    useState<Nugget[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =========================================
     LOAD USER PREFERENCES + FOLLOWED TOPICS
     + PUBLISHED NUGGETS
  ========================================= */

  useEffect(() => {
    async function loadRecommendations() {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const headers = {
        Authorization:
          `Bearer ${token}`,
      };

      try {
        const [
          preferencesResponse,
          topicsResponse,
          publishedNuggets,
        ] = await Promise.all([
          fetch(
            `${API_URL}/users/me/preferences`,
            {
              headers,
            },
          ),

          fetch(
            `${API_URL}/following/topics`,
            {
              headers,
            },
          ),

          getPublishedNuggets(),
        ]);

        const preferencesData =
          await preferencesResponse
            .json()
            .catch(() => ({}));

        const topicsData =
          await topicsResponse
            .json()
            .catch(() => []);

        /*
         * Preferences are the main personalization source.
         */
        if (preferencesResponse.ok) {
          setPreferences({
            interests:
              Array.isArray(
                preferencesData.interests,
              )
                ? preferencesData.interests
                : [],

            wisdomNeeds:
              Array.isArray(
                preferencesData.wisdomNeeds,
              )
                ? preferencesData.wisdomNeeds
                : [],
          });
        }

        /*
         * Followed topics continue influencing
         * recommendations after onboarding.
         */
        if (topicsResponse.ok) {
          setTopics(
            Array.isArray(topicsData)
              ? topicsData
              : [],
          );
        }

        setNuggets(
          Array.isArray(
            publishedNuggets,
          )
            ? publishedNuggets
            : [],
        );

        /*
         * Only show an error if both
         * personalization endpoints fail.
         */
        if (
          !preferencesResponse.ok &&
          !topicsResponse.ok
        ) {
          setError(
            "Could not load your recommendation preferences.",
          );
        }
      } catch {
        setError(
          "Could not connect to the server.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, []);

  /* =========================================
     TOTAL PERSONALIZATION SIGNALS
  ========================================= */

  const signalCount =
    preferences.interests.length +
    preferences.wisdomNeeds.length +
    topics.length;

  /* =========================================
     MERGED DISPLAY INTERESTS

     Onboarding interests appear first.
     Followed topics are added if they are
     not already represented.
  ========================================= */

  const displayInterests =
    useMemo(() => {
      const values = [
        ...preferences.interests,
        ...topics.map(
          (item) =>
            item.topic,
        ),
      ];

      return [
        ...new Set(
          values.filter(
            Boolean,
          ),
        ),
      ];
    }, [
      preferences.interests,
      topics,
    ]);

  /* =========================================
     WEIGHTED RECOMMENDATION ENGINE

     Current wisdom need = 4
     Onboarding interest = 3
     Followed topic      = 2
  ========================================= */

  const recommendations =
    useMemo(() => {
      const wisdomSignals =
        preferences.wisdomNeeds.map(
          (value) => ({
            value,
            weight: 4,
          }),
        );

      const interestSignals =
        preferences.interests.map(
          (value) => ({
            value,
            weight: 3,
          }),
        );

      const followedSignals =
        topics.map(
          (item) => ({
            value:
              item.topic,
            weight: 2,
          }),
        );

      const signals = [
        ...wisdomSignals,
        ...interestSignals,
        ...followedSignals,
      ];

      if (
        signals.length === 0
      ) {
        return [];
      }

      const scored =
        nuggets.map(
          (nugget) => {
            const searchable =
              [
                nugget.title,
                nugget.topic,
                nugget.tag,
                nugget.keyPrinciple,
                nugget.marketplaceApplication,
                nugget.scriptureRef,
                nugget.scriptureText,
                ...(nugget.challenges ??
                  []),
                ...(nugget.practicalActionPlan ??
                  []),
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            let score = 0;

            for (
              const signal
              of signals
            ) {
              const normalized =
                signal.value
                  .trim()
                  .toLowerCase();

              if (!normalized) {
                continue;
              }

              /*
               * Strong exact phrase match.
               */
              if (
                searchable.includes(
                  normalized,
                )
              ) {
                score +=
                  signal.weight *
                  3;

                continue;
              }

              /*
               * Partial keyword matching.
               */
              const words =
                normalized
                  .split(
                    /[\s&,/]+/,
                  )
                  .map(
                    (word) =>
                      word.trim(),
                  )
                  .filter(
                    (word) =>
                      word.length >
                      3,
                  );

              for (
                const word
                of words
              ) {
                if (
                  searchable.includes(
                    word,
                  )
                ) {
                  score +=
                    signal.weight;
                }
              }
            }

            return {
              nugget,
              score,
            };
          },
        );

      return scored
        .filter(
          (item) =>
            item.score > 0,
        )
        .sort(
          (a, b) =>
            b.score -
            a.score,
        )
        .slice(0, 3)
        .map(
          (item) =>
            item.nugget,
        );
    }, [
      preferences,
      topics,
      nuggets,
    ]);

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
          {/* BACK */}

          <Link
            href="/home"
            className="text-[10px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
          >
            ← My Homepage
          </Link>

          {/* HEADER */}

          <section className="mt-3">
            <h1 className="font-serif text-[40px] leading-tight">
              Your Recommendation Guide
            </h1>

            <p className="mt-3 max-w-[650px] text-[13px] leading-6 text-white/40">
              A starting point for
              discovery, shaped by
              your onboarding
              preferences, current
              wisdom needs and
              followed topics.
            </p>
          </section>

          {/* TOP CARDS */}

          <section className="mt-8 grid gap-5 lg:grid-cols-2">
            {/* CHOSEN INTERESTS */}

            <div className="rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
              <h2 className="font-serif text-[18px]">
                Your Chosen Interests
              </h2>

              <p className="mt-2 text-[10px] leading-5 text-white/30">
                These come from your
                onboarding choices
                and topics you follow
                later.
              </p>

              {loading ? (
                <p className="mt-5 text-[11px] text-white/30">
                  Loading your
                  interests...
                </p>
              ) : displayInterests.length >
                0 ? (
                <div className="mt-5 space-y-3">
                  {displayInterests.map(
                    (
                      interest,
                    ) => (
                      <div
                        key={
                          interest
                        }
                        className="flex items-start gap-3 rounded-md border border-[#C8A35A]/45 bg-[#C8A35A]/[0.14] px-4 py-3"
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-[#C8A35A] text-[#080808]">
                          <Check
                            size={
                              10
                            }
                            strokeWidth={
                              3
                            }
                          />
                        </span>

                        <div>
                          <p className="text-[11px] font-medium text-white/85">
                            {
                              interest
                            }
                          </p>

                          <p className="mt-1 text-[9px] leading-4 text-white/30">
                            Recommendations
                            will prioritize
                            teachings
                            related to this
                            area.
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-md border border-white/10 bg-[#181818] p-4">
                  <p className="text-[11px] text-white/45">
                    You haven&apos;t
                    selected any
                    interests yet.
                  </p>
                </div>
              )}

              <Link
                href="/onboarding?edit=1"
                className="mt-5 inline-flex items-center gap-2 rounded-md border border-white/10 bg-[#080808] px-4 py-2.5 text-[10px] text-white/65 transition hover:border-[#C8A35A]/30 hover:text-[#C8A35A]"
              >
                <SlidersHorizontal
                  size={13}
                />

                Adjust Interests →
              </Link>
            </div>

            {/* WHY */}

            <div className="rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
              <h2 className="font-serif text-[18px]">
                Why These Teachings?
              </h2>

              <p className="mt-5 text-[11px] leading-6 text-white/40">
                Your recommendation
                guide considers the
                business interests
                you selected during
                onboarding, what you
                currently need
                wisdom about, and
                topics you choose to
                follow.
              </p>

              <p className="mt-4 text-[11px] leading-6 text-white/40">
                Current wisdom needs
                receive the strongest
                influence because
                they represent what
                is most relevant to
                you now.
              </p>

              <p className="mt-4 text-[11px] leading-6 text-white/40">
                Recommendations are
                invitations to study,
                not guarantees or
                judgments about your
                business.
              </p>

              <Link
                href="/library"
                className="mt-5 inline-block text-[10px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
              >
                Browse beyond your
                interests → Library
              </Link>
            </div>
          </section>

          {/* CURRENT WISDOM NEEDS */}

          {!loading &&
            preferences.wisdomNeeds.length >
              0 && (
              <section className="mt-6 rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                  Current Focus
                </p>

                <h2 className="mt-2 font-serif text-[18px]">
                  What You Need
                  Wisdom About
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  {preferences.wisdomNeeds.map(
                    (
                      need,
                    ) => (
                      <span
                        key={
                          need
                        }
                        className="rounded-full border border-[#C8A35A]/30 bg-[#C8A35A]/[0.08] px-3 py-2 text-[10px] text-[#E0C48A]"
                      >
                        {need}
                      </span>
                    ),
                  )}
                </div>
              </section>
            )}

          {/* RECOMMENDED */}

          <section className="mt-10">
            <h2 className="font-serif text-[28px] leading-tight">
              Recommended for Your
              Business Profile
            </h2>

            {error && (
              <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                <p className="text-[11px] text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* LOADING */}

            {loading && (
              <div className="mt-6 space-y-4">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={
                        item
                      }
                      className="h-[88px] animate-pulse rounded-[10px] border border-white/10 bg-[#111111]"
                    />
                  ),
                )}
              </div>
            )}

            {/* NO PERSONALIZATION */}

            {!loading &&
              !error &&
              signalCount ===
                0 && (
                <div className="mt-6 rounded-[10px] border border-white/10 bg-[#111111] p-7">
                  <h3 className="font-serif text-[18px]">
                    Choose interests
                    to personalize
                    your guide
                  </h3>

                  <p className="mt-2 max-w-[560px] text-[11px] leading-6 text-white/35">
                    Select your
                    business interests
                    and current wisdom
                    needs so Business
                    Nuggets can build
                    a more relevant
                    recommendation
                    guide.
                  </p>

                  <Link
                    href="/onboarding?edit=1"
                    className="mt-4 inline-block text-[10px] font-medium text-[#C8A35A]"
                  >
                    Choose Interests →
                  </Link>
                </div>
              )}

            {/* SIGNALS EXIST BUT NO MATCH */}

            {!loading &&
              !error &&
              signalCount >
                0 &&
              recommendations.length ===
                0 && (
                <div className="mt-6 rounded-[10px] border border-white/10 bg-[#111111] p-7">
                  <p className="text-[11px] leading-6 text-white/40">
                    There are no
                    published Nuggets
                    matching your
                    current interests
                    closely enough
                    yet.
                  </p>

                  <Link
                    href="/library"
                    className="mt-4 inline-block text-[10px] text-[#C8A35A]"
                  >
                    Browse the Full
                    Library →
                  </Link>
                </div>
              )}

            {/* RESULTS */}

            {!loading &&
              recommendations.length >
                0 && (
                <div className="mt-6 space-y-4">
                  {recommendations.map(
                    (
                      nugget,
                    ) => (
                      <Link
                        key={
                          nugget.id
                        }
                        href={`/nugget/${nugget.slug}`}
                        className="group flex items-center gap-4 rounded-[10px] border border-white/10 bg-[#111111] p-4 transition hover:border-[#C8A35A]/35"
                      >
                        <div className="relative h-[58px] w-[72px] shrink-0 overflow-hidden rounded-md bg-[#181818]">
                          <Image
                            src={
                              nugget.image
                            }
                            alt={
                              nugget.title
                            }
                            fill
                            sizes="72px"
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-[15px] leading-5 text-white/90 transition group-hover:text-[#C8A35A]">
                            {
                              nugget.title
                            }
                          </h3>

                          <p className="mt-1 text-[9px] text-white/30">
                            {
                              nugget.scriptureRef
                            }

                            {nugget.topic &&
                              ` • ${nugget.topic}`}

                            {nugget.duration &&
                              ` • ${nugget.duration}`}
                          </p>
                        </div>

                        <span className="hidden shrink-0 text-[9px] font-medium text-[#C8A35A] sm:block">
                          Listen &amp;
                          Read →
                        </span>
                      </Link>
                    ),
                  )}
                </div>
              )}
          </section>

          {/* DISCOVERY */}

          <section className="mt-8 rounded-[8px] border border-[#C8A35A]/20 bg-[#C8A35A]/[0.14] px-5 py-4">
            <p className="text-[10px] font-semibold text-[#E0C48A]">
              Keep your discovery
              open
            </p>

            <p className="mt-2 text-[10px] leading-5 text-white/35">
              Recommendations help
              you begin, but your
              entire library remains
              available. Use
              Challenges when a
              specific problem needs
              attention, or Scripture
              Index when you want to
              begin with a biblical
              passage.
            </p>

            <div className="mt-3 flex flex-wrap gap-4">
              <Link
                href="/library"
                className="text-[9px] text-[#C8A35A]"
              >
                Explore Library →
              </Link>

              <Link
                href="/scripture"
                className="text-[9px] text-[#C8A35A]"
              >
                Scripture Index →
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}