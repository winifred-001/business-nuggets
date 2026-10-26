import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Search,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import VisitorOnly from "@/components/VisitorOnly";
import { getPublishedNuggets } from "@/lib/nuggets-api";
import { slugify } from "@/lib/nuggets";
import type { Nugget } from "@/types/nugget";

type ApiNugget = Nugget & {
  featured?: boolean;
  audioUrl?: string | null;
};

const topicImages: Record<string, string> = {
  "Leadership & Governance":
    "/images/visiting-homepage2.png",

  "Leadership & Teams":
    "/images/visiting-homepage2.png",

  "Money & Stewardship":
    "/images/visiting-homepage3.png",

  "Strategy & Planning":
    "/images/visiting-homepage4.png",

  "Integrity & Character":
    "/images/visiting-homepage5.png",

  "Entrepreneurship & Innovation":
    "/images/visiting-homepage6.png",

  "People & Teams":
    "/images/visiting-homepage7.png",
};

const fallbackTopicImages = [
  "/images/visiting-homepage2.png",
  "/images/visiting-homepage3.png",
  "/images/visiting-homepage4.png",
  "/images/visiting-homepage5.png",
  "/images/visiting-homepage6.png",
  "/images/visiting-homepage7.png",
];

const musicalImages = [
  "/images/cinematic-musical1.png",
  "/images/cinematic-musical2.png",
];

export default async function HomePage() {
  let nuggets: ApiNugget[] = [];

  try {
    nuggets =
      (await getPublishedNuggets()) as ApiNugget[];
  } catch (error) {
    console.error(
      "Failed to load homepage Nuggets:",
      error,
    );
  }

  /*
   * TODAY'S / FEATURED NUGGET
   *
   * Prefer the Nugget marked featured by the
   * backend. If none is marked featured, use
   * the first published Nugget.
   */
  const featuredNugget =
    nuggets.find(
      (nugget) => nugget.featured,
    ) ??
    nuggets.find(
      (nugget) =>
        nugget.slug ===
        "law-of-just-balances",
    ) ??
    nuggets[0] ??
    null;

  /*
   * LATEST NUGGETS
   */
  const latestNuggets = [...nuggets]
    .sort((a, b) => {
      const aDate = new Date(
        a.publishedAt ?? 0,
      ).getTime();

      const bDate = new Date(
        b.publishedAt ?? 0,
      ).getTime();

      return bDate - aDate;
    })
    .filter(
      (nugget) =>
        nugget.slug !==
        featuredNugget?.slug,
    )
    .slice(0, 4);

  /*
   * CHALLENGES
   */
  const challenges = [
    ...new Set(
      nuggets.flatMap(
        (nugget) =>
          nugget.challenges ?? [],
      ),
    ),
  ].slice(0, 5);

  /*
   * TOPICS
   */
  const topics = [
    ...new Set(
      nuggets
        .map(
          (nugget) => nugget.topic,
        )
        .filter(Boolean),
    ),
  ];

  const topicCards = topics
    .map((topic, index) => ({
      title: topic,

      count: nuggets.filter(
        (nugget) =>
          nugget.topic === topic,
      ).length,

      image:
        topicImages[topic] ??
        fallbackTopicImages[
          index %
            fallbackTopicImages.length
        ],
    }))
    .slice(0, 6);

  /*
   * MUSICAL PREVIEWS
   *
   * Until we create a dedicated Musical API,
   * these use real backend Nuggets as their
   * content source.
   */
  const musicalNuggets = nuggets
    .filter(
      (nugget) =>
        nugget.audioUrl ||
        nugget.duration,
    )
    .slice(0, 2);

  return (
    <VisitorOnly>
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main>
        {/* HERO */}
        <section className="relative min-h-[600px] overflow-hidden lg:min-h-[650px]">
          <Image
            src="/images/visiting-homepage.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          <div className="absolute inset-0 bg-[#080808]/50" />

          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-[#080808]/90" />

          <div className="relative mx-auto flex min-h-[600px] max-w-[1280px] items-center justify-center px-5 py-20 sm:px-8 lg:min-h-[650px] lg:px-12">
            <div className="mx-auto w-full max-w-[850px] translate-y-[30px] text-center">
              <p className="text-[13px] font-semibold uppercase tracking-[0.24em] text-[#C8A35A]">
                Timeless Biblical Wisdom for
                Today&apos;s Marketplace
              </p>

              <h1 className="mx-auto mt-5 max-w-[820px] font-serif text-[43px] leading-[1.04] text-white sm:text-[58px] lg:text-[68px]">
                Command Your Business

                <span className="block text-[#C8A35A]">
                  with Absolute Clarity
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-[640px] text-[14px] leading-7 text-white/65">
                Discover practical business
                principles drawn from Scripture
                and apply timeless wisdom to the
                decisions you make today.
              </p>

              {/* CONNECTED SEARCH */}
              <form
                action="/search"
                method="get"
                className="mx-auto mt-9 flex w-full max-w-[650px] flex-col gap-3 sm:flex-row"
              >
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8781]"
                  />

                  <input
                    type="search"
                    name="q"
                    placeholder="Search by scripture, business challenge, or book..."
                    className="h-14 w-full rounded-xl border border-white/15 bg-[#111111]/90 pl-11 pr-4 text-[14px] text-white outline-none backdrop-blur-sm transition placeholder:text-[#8A8781] focus:border-[#C8A35A]"
                  />
                </div>

                <button
                  type="submit"
                  className="h-14 shrink-0 rounded-xl bg-[#C8A35A] px-7 text-[14px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                >
                  Start Discovering
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* TODAY'S BUSINESS NUGGET */}
        <section className="bg-[#080808] px-5 py-16 sm:px-8 lg:py-20">
          <div className="mx-auto max-w-[1180px]">
            <h2 className="font-serif text-[28px] text-white">
              Today&apos;s Business Nugget
            </h2>

            {featuredNugget ? (
              <div className="mt-8 overflow-hidden rounded-2xl border border-[#C8A35A]/20 bg-[#111111] lg:grid lg:grid-cols-[0.95fr_1.05fr]">
                {/* IMAGE */}
                <div className="relative min-h-[300px] lg:min-h-[390px]">
                  <Image
                    src={featuredNugget.image}
                    alt={featuredNugget.title}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* CONTENT */}
                <div className="flex flex-col justify-center px-6 py-9 sm:px-9 lg:px-11">
                  <div className="flex flex-wrap items-center gap-3 text-[13px]">
                    <span className="font-semibold uppercase tracking-[0.12em] text-[#C8A35A]">
                      {featuredNugget.topic}
                    </span>

                    <span className="h-1 w-1 rounded-full bg-white/30" />

                    <span className="text-white/45">
                      {featuredNugget.duration}
                    </span>
                  </div>

                  <h3 className="mt-4 max-w-xl font-serif text-[28px] leading-[1.12] text-white">
                    {featuredNugget.title}
                  </h3>

                  {featuredNugget.scriptureText && (
                    <p className="mt-5 max-w-xl font-serif text-[17px] italic leading-8 text-white/60">
                      “
                      {
                        featuredNugget.scriptureText
                      }
                      ”
                    </p>
                  )}

                  <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#C8A35A]">
                    {
                      featuredNugget.scriptureRef
                    }
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    {/* Reader */}
                    <Link
                      href={`/nugget/${featuredNugget.slug}/reader`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#C8A35A] px-5 text-[14px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                    >
                      Read Wisdom
                      <ArrowRight size={15} />
                    </Link>

                    {/* Detail */}
                    <Link
                      href={`/nugget/${featuredNugget.slug}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-5 text-[14px] font-medium text-white transition hover:border-[#C8A35A]/60 hover:text-[#E0C48A]"
                    >
                      Read Commentary
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyHomepageState />
            )}
          </div>
        </section>

        {/* CHALLENGES */}
        <section className="border-t border-white/[0.06] bg-[#0B0B0B] px-5 py-14 sm:px-8 lg:py-16">
          <div className="mx-auto max-w-[1180px]">
            <h2 className="font-serif text-[28px] text-white">
              I Need Wisdom About...
            </h2>

            {challenges.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {challenges.map(
                  (challenge, index) => (
                    <Link
                      key={challenge}
                     href={`/challenges/${slugify(
                     challenge,
                     )}`}
                      className={`rounded-full border px-5 py-2.5 text-[13px] transition ${
                        index === 0
                          ? "border-[#C8A35A] bg-[#C8A35A] font-semibold text-[#080808]"
                          : "border-white/10 bg-[#111111] text-white/65 hover:border-[#C8A35A]/60 hover:text-[#E0C48A]"
                      }`}
                    >
                      {challenge}
                    </Link>
                  ),
                )}
              </div>
            ) : (
              <p className="mt-5 text-[14px] text-white/45">
                No business challenges have
                been published yet.
              </p>
            )}
          </div>
        </section>

        {/* CORE TOPICS */}
        <section className="bg-[#080808] px-5 py-16 sm:px-8 lg:py-20">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#C8A35A]">
                  Explore Wisdom
                </p>

                <h2 className="mt-2 font-serif text-[28px] text-white">
                  Browse by Core Topic
                </h2>
              </div>

              <Link
                href="/library?tab=Topics+Index"
                className="inline-flex items-center gap-2 text-[13px] text-[#C8A35A]"
              >
                Browse Library

                <ArrowRight size={15} />
              </Link>
            </div>

            {topicCards.length > 0 ? (
              <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {topicCards.map(
                  (topic) => (
                    <Link
                      key={topic.title}
                     href={`/topics/${slugify(
                     topic.title,
                     )}`}
                      className="group relative min-h-[230px] overflow-hidden rounded-2xl border border-white/10"
                    >
                      <Image
                        src={topic.image}
                        alt={topic.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />

                      {/* dark readability overlay */}
                      <div className="absolute inset-0 bg-black/45" />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/15" />

                      <div className="absolute inset-0 flex flex-col justify-between p-6">
                        <div className="flex justify-end">
                          <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[13px] text-white/70 backdrop-blur-sm">
                            {topic.count}{" "}
                            {topic.count === 1
                              ? "Nugget"
                              : "Nuggets"}
                          </span>
                        </div>

                        <div>
                          <h3 className="max-w-[280px] font-serif text-[20px] leading-[1.12] text-white">
                            {topic.title}
                          </h3>

                          <span className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-[#E0C48A]">
                            Explore Topic

                            <ArrowRight
                              size={14}
                              className="transition group-hover:translate-x-1"
                            />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ),
                )}
              </div>
            ) : (
              <p className="mt-8 text-[14px] text-white/45">
                No topics are available yet.
              </p>
            )}
          </div>
        </section>

        {/* FEATURED WISDOM MUSICALS */}
        <section className="border-y border-white/[0.06] bg-[#080808] px-5 py-12 sm:px-8 lg:py-14">
          <div className="mx-auto max-w-[1356px]">
            <div>
              <Link
  href="/musicals"
  className="inline-flex items-center gap-2 text-[13px] font-medium text-[#C8A35A]"
>
  View all Musicals
  <ArrowRight size={13} />
</Link>
              <h2 className="font-serif text-[28px] text-[#FAF9F6]">
                Featured Wisdom Musicals
              </h2>

              <p className="mt-1.5 text-[14px] leading-6 text-white/45">
                Immersive audio teachings
                layered over professional
                cinematic soundtracks and
                ambient soundscapes.
              </p>
            </div>

            {musicalNuggets.length > 0 ? (
              <div className="mt-7 grid gap-4 lg:grid-cols-2">
                {musicalNuggets.map(
                  (nugget, index) => (
                    <Link
                      key={nugget.slug}
                      href={`/nugget/${nugget.slug}/musical`}
                      className="group flex h-[110px] overflow-hidden rounded-lg border border-white/10 bg-[#111111]"
                    >
                      <div className="relative h-full w-[105px] shrink-0">
                        <Image
                          src={
                            musicalImages[
                              index %
                                musicalImages.length
                            ]
                          }
                          alt={nugget.title}
                          fill
                          sizes="105px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 items-center px-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                            {
                              nugget.scriptureRef
                            }
                          </p>

                          <h3 className="mt-1 truncate font-serif text-[16px] text-[#FAF9F6]">
                            {nugget.title}
                          </h3>

                          <p className="mt-1 truncate text-[13px] text-white/40">
                            {nugget.topic}
                          </p>
                        </div>

                        <div className="ml-4 flex shrink-0 items-center gap-3">
                          <span className="text-[13px] text-white/30">
                            {nugget.duration}
                          </span>

                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9A7839] text-[#080808] transition group-hover:bg-[#C8A35A]">
                            <ArrowRight
                              size={13}
                            />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ),
                )}
              </div>
            ) : (
              <p className="mt-7 text-[14px] text-white/45">
                No Musical Nuggets are
                available yet.
              </p>
            )}
          </div>
        </section>

        {/* LATEST BIBLICAL NUGGETS */}
        <section className="bg-[#080808] px-5 py-14 sm:px-8 lg:py-16">
          <div className="mx-auto max-w-[1356px]">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-serif text-[28px] text-[#FAF9F6]">
                Latest Biblical Nuggets
              </h2>

              <Link
                href="/library"
                className="inline-flex items-center gap-2 text-[13px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
              >
                Browse all

                <ArrowRight size={13} />
              </Link>
            </div>

            {latestNuggets.length > 0 ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {latestNuggets.map(
                  (nugget) => (
                    <Link
                      key={nugget.slug}
                      href={`/nugget/${nugget.slug}`}
                      aria-label={`Open ${nugget.title}`}
                      className="group relative block h-[185px] overflow-hidden rounded-lg border border-white/10"
                    >
                      <Image
                        src={nugget.image}
                        alt={nugget.title}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    </Link>
                  ),
                )}
              </div>
            ) : (
              <p className="mt-8 text-[14px] text-white/45">
                No recent Nuggets are
                available yet.
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  </VisitorOnly>
  );
}

function EmptyHomepageState() {
  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-[#111111] p-8 text-center">
      <h3 className="font-serif text-[28px]">
        No published Nuggets yet
      </h3>

      <p className="mt-3 text-[14px] text-white/50">
        Published Nuggets from the backend
        will appear here automatically.
      </p>

      <Link
        href="/library"
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#C8A35A]/50 px-5 py-3 text-[13px] font-medium text-[#C8A35A]"
      >
        Open Library

        <ArrowRight size={14} />
      </Link>
    </div>
  );
}