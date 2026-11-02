import Link from "next/link";

import AuthRouteGuard from "@/components/AuthRouteGuard";
import ContentImage from "@/components/ContentImage";
import Footer from "@/components/Footer";
import Navbar from "@/components/navbar";
import NuggetCard from "@/components/NuggetCard";

import { API_URL } from "@/lib/api";
import { getPublishedNuggets } from "@/lib/nuggets-api";
import { getServerMemberToken } from "@/lib/server-member-token";

import type { Nugget } from "@/types/nugget";

import styles from "./home-typography.module.css";

type UserPreferences = {
  interests: string[];
  wisdomNeeds: string[];
};

type FollowedTopic = {
  topic?: string;
};

type HistoryItem = {
  nuggetId: string;
  progress?: number;
  lastOpenedAt?: string;
};

function authHeaders(token: string | null) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;
}

async function loadMemberPersonalization(token: string | null) {
  if (!token) {
    return {
      preferences: {
        interests: [],
        wisdomNeeds: [],
      } as UserPreferences,
      followedTopics: [] as string[],
      history: [] as HistoryItem[],
    };
  }

  const headers = authHeaders(token);

  try {
    const [preferencesResponse, followingResponse, historyResponse] =
      await Promise.all([
        fetch(`${API_URL}/users/me/preferences`, {
          headers,
          cache: "no-store",
        }),
        fetch(`${API_URL}/following/topics`, {
          headers,
          cache: "no-store",
        }),
        fetch(`${API_URL}/history`, {
          headers,
          cache: "no-store",
        }),
      ]);

    const preferencesData = preferencesResponse.ok
      ? await preferencesResponse.json().catch(() => ({}))
      : {};

    const followingData = followingResponse.ok
      ? await followingResponse.json().catch(() => [])
      : [];

    const historyData = historyResponse.ok
      ? await historyResponse.json().catch(() => [])
      : [];

    const preferences: UserPreferences = {
      interests: Array.isArray(preferencesData.interests)
        ? preferencesData.interests
        : [],
      wisdomNeeds: Array.isArray(preferencesData.wisdomNeeds)
        ? preferencesData.wisdomNeeds
        : [],
    };

    const followedTopics = Array.isArray(followingData)
      ? followingData
          .map((item: string | FollowedTopic) =>
            typeof item === "string" ? item : item.topic,
          )
          .filter((value): value is string => Boolean(value))
      : [];

    const history = Array.isArray(historyData)
      ? historyData.filter(
          (item): item is HistoryItem =>
            Boolean(item) && typeof item.nuggetId === "string",
        )
      : [];

    return {
      preferences,
      followedTopics,
      history,
    };
  } catch {
    return {
      preferences: {
        interests: [],
        wisdomNeeds: [],
      } as UserPreferences,
      followedTopics: [] as string[],
      history: [] as HistoryItem[],
    };
  }
}

function getRecommendedNuggets(
  nuggets: Nugget[],
  preferences: UserPreferences,
  followedTopics: string[],
) {
  const signals = [
    ...preferences.wisdomNeeds.map((value) => ({ value, weight: 4 })),
    ...preferences.interests.map((value) => ({ value, weight: 3 })),
    ...followedTopics.map((value) => ({ value, weight: 2 })),
  ];

  if (signals.length === 0) {
    return nuggets.slice(0, 4);
  }

  const scored = nuggets.map((nugget) => {
    const searchable = [
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

    let score = 0;

    for (const signal of signals) {
      const normalized = signal.value.trim().toLowerCase();

      if (!normalized) continue;

      if (searchable.includes(normalized)) {
        score += signal.weight * 3;
        continue;
      }

      const words = normalized
        .split(/[\s&,/]+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 3);

      for (const word of words) {
        if (searchable.includes(word)) {
          score += signal.weight;
        }
      }
    }

    return {
      nugget,
      score,
    };
  });

  const matches = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.nugget);

  return matches.length > 0 ? matches : nuggets.slice(0, 4);
}

function getContinueListening(
  nuggets: Nugget[],
  history: HistoryItem[],
) {
  const byId = new Map(nuggets.map((nugget) => [nugget.id, nugget]));

  return [...history]
    .sort((a, b) => {
      const aTime = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
      const bTime = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
      return bTime - aTime;
    })
    .map((item) => ({
      history: item,
      nugget: byId.get(item.nuggetId),
    }))
    .filter(
      (
        item,
      ): item is {
        history: HistoryItem;
        nugget: Nugget;
      } => Boolean(item.nugget),
    )
    .slice(0, 2);
}

export default async function HomePage() {
  const token = await getServerMemberToken();

  let nuggets: Nugget[] = [];

  try {
    nuggets = await getPublishedNuggets(token);
  } catch (error) {
    console.error("Could not load member home Nuggets:", error);
  }

  const { preferences, followedTopics, history } =
    await loadMemberPersonalization(token);

  const recommendations = getRecommendedNuggets(
    nuggets,
    preferences,
    followedTopics,
  );

  const continueListening = getContinueListening(nuggets, history);

  return (
    <AuthRouteGuard type="protected">
      <div
        className={`${styles.home} flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]`}
      >
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
          <section>
            <h1 className="bn-hero-title font-serif text-[45px] leading-tight">
              Your wisdom workspace
            </h1>

            <p className="mt-3 max-w-[700px] text-white/50">
              Continue learning and discover Business Nuggets shaped by your interests.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-[20px]">
              Continue Listening
            </h2>

            {continueListening.length > 0 ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {continueListening.map(({ history: item, nugget }) => {
                  const progress =
                    typeof item.progress === "number" &&
                    item.progress > 0 &&
                    item.progress <= 100
                      ? item.progress
                      : 0;

                  return (
                    <Link
                      key={nugget.id}
                      href={`/nugget/${nugget.slug}`}
                      className="group flex min-h-[112px] items-center gap-4 rounded-xl border border-white/10 bg-[#111111] p-4 transition hover:border-[#C8A35A]/40"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[#181818]">
                        <ContentImage src={nugget.image} alt={nugget.title} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[#C8A35A]">
                          {nugget.tag || nugget.topic || "Business Nugget"}
                        </p>

                        <h3 className="mt-1 font-serif text-[20px] text-white/90">
                          {nugget.title}
                        </h3>

                        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full bg-[#C8A35A]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#C8A35A] font-semibold text-[#080808] transition group-hover:bg-[#E0C48A]">
                        →
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-white/10 bg-[#111111] p-5">
                <p className="text-white/45">
                  Your recent listening activity will appear here as you use the audio library.
                </p>

                <Link
                  href="/library"
                  className="bn-button mt-4 inline-flex min-h-11 items-center font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
                >
                  Browse Nuggets to read →
                </Link>
              </div>
            )}
          </section>

          <section className="mt-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-serif text-[20px]">
                  Recommended for Your Business Profile
                </h2>

                <p className="mt-2 text-white/40">
                  Tailored teachings based on your interests and leadership profile.
                </p>
              </div>

              <Link
                href="/recommendations"
                className="shrink-0 font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
              >
                More Recommendations →
              </Link>
            </div>

            {recommendations.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {recommendations.map((nugget) => (
                  <NuggetCard
                    key={nugget.slug}
                    nugget={nugget}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-xl border border-white/10 bg-[#111111] p-6 text-white/45">
                No published Nuggets are available yet.
              </p>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}
