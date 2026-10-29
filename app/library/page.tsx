"use client";

import cardStyles from "@/app/topic-cards.module.css";
import Image from "next/image";
import Link from "next/link";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import PageEyebrow from "@/components/PageEyebrow";

import {
  collections,
  filterNuggets,
  slugify,
} from "@/lib/nuggets";
import { BIBLE_GROUPS } from "@/lib/bible-books";
import { getPublishedNuggets } from "@/lib/nuggets-api";

import { getTopicCatalog, type TopicCatalog } from "@/lib/topics-api";

import type { Nugget } from "@/types/nugget";

const tabs = [
  "All Nuggets",
  "Topics Index",
  "Challenges",
  "Scripture Matrix",
  "Collections",
];

const topicImages: Record<string, string> = {
  "Leadership & Governance":
    "/images/visiting-homepage2.png",

  "Leadership & Teams":
    "/images/visiting-homepage2.png",

  "Money & Stewardship":
    "/images/visiting-homepage3.png",

  "Strategy & Planning":
    "/images/visiting-homepage4.png",

  "Entrepreneurship & Innovation":
    "/images/visiting-homepage5.png",

  "Integrity & Character":
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

const topicDescriptions: Record<string, string> = {
  "Leadership & Governance":
    "Delegation, accountability and organizational vision.",

  "Leadership & Teams":
    "Leadership, delegation and healthy team structures.",

  "Money & Stewardship":
    "Capital reserves, debt and responsible resource allocation.",

  "Strategy & Planning":
    "Long-term thinking, risk and decisions under pressure.",

  "Entrepreneurship & Innovation":
    "Foundations for building and creating with purpose.",

  "Integrity & Character":
    "Honest transactions, ethical standards and trust.",

  "People & Teams":
    "Relationships, collaboration and conflict resolution.",
};

const challengeDescriptions: Record<
  string,
  {
    subtitle: string;
    kicker?: string;
  }
> = {
  "Starting a Business": {
    kicker: "FOUNDATION PATHWAY",
    subtitle:
      "Foundation, stewardship and launching with wisdom.",
  },

  "Money & Cashflow Problems": {
    kicker: "CURATED BLUEPRINT",
    subtitle:
      "Reserves, debt, diversification and financial stewardship.",
  },

  "Managing Difficult People": {
    kicker: "PEOPLE PATHWAY",
    subtitle:
      "Accountability, dialogue, delegation and relationships.",
  },

  "Strategic Decision Making": {
    kicker: "STRATEGY PATHWAY",
    subtitle:
      "Risk, counsel, planning and wise decision-making.",
  },

  "Scaling & Growth Pressures": {
    kicker: "LEADERSHIP PATHWAY",
    subtitle:
      "Structure, delegation, sustainable growth and scale.",
  },

  "Leadership Burnout": {
    kicker: "LEADERSHIP PATHWAY",
    subtitle:
      "Rest, resilience, delegation and longevity.",
  },
};

const collectionImages: Record<string, string> = {
  "starting-your-business-gods-way":
    "/images/collection-main.png",

  "capital-stewardship-debt":
    "/images/saved-nugget1.png",

  "integrity-as-a-premium-brand":
    "/images/saved-nugget2.png",
};

function LibraryContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [apiNuggets, setApiNuggets] = useState<
    Nugget[]
  >([]);

  const [catalog, setCatalog] = useState<TopicCatalog>({ topics: [], categories: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bookQuery, setBookQuery] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function loadNuggets() {
      try {
        setLoading(true);

        const [data, taxonomy] = await Promise.all([getPublishedNuggets(), getTopicCatalog()]);

        if (!mounted) return;

        setApiNuggets(data);
        setCatalog(taxonomy);
        setError("");
      } catch (err) {
        console.error(
          "Failed to load Nuggets:",
          err,
        );

        if (!mounted) return;

        setError(
          "Could not load the Wisdom Archive. Make sure the backend is running.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadNuggets();

    return () => {
      mounted = false;
    };
  }, []);

  const requestedTab =
    params.get("tab") ?? "";

  const activeTab = tabs.includes(
    requestedTab,
  )
    ? requestedTab
    : "All Nuggets";

  const selectedCategories = params.getAll("category");

  const selectedTopics =
    params.getAll("topic");

  const selectedSections =
    params.getAll("section");

  const selectedChallenge =
    params.get("challenge") ?? "";

  const selectedBook =
    params.get("book") ?? "";

  const requestedSort =
    params.get("sort") ?? "newest";

  const sort = [
    "newest",
    "oldest",
    "az",
  ].includes(requestedSort)
    ? requestedSort
    : "newest";

  const requestedPage = Number(
    params.get("page") ?? "1",
  );

  const currentPage =
    Number.isFinite(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  function pushParams(
    next: URLSearchParams,
  ) {
    const query = next.toString();

    router.push(
      `/library${query ? `?${query}` : ""}`,
      { scroll: false },
    );
  }

  function updateParam(
    key: string,
    value: string,
    multiple = false,
  ) {
    const next = new URLSearchParams(
      params.toString(),
    );

    if (multiple) {
      const current =
        next.getAll(key);

      next.delete(key);

      const updated = current.includes(value)
        ? current.filter(
            (item) => item !== value,
          )
        : [...current, value];

      updated.forEach((item) =>
        next.append(key, item),
      );
    } else if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    if (key !== "page") {
      next.delete("page");
    }

    pushParams(next);
  }

  function changeTab(tab: string) {
    const next = new URLSearchParams(
      params.toString(),
    );

    if (tab === "All Nuggets") {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }

    next.delete("page");

    pushParams(next);
  }

  const bibleSections = BIBLE_GROUPS.map(group => group.name);

  const challenges = useMemo(() => {
    return [
      ...new Set(
        apiNuggets.flatMap(
          (nugget) =>
            nugget.challenges ?? [],
        ),
      ),
    ];
  }, [apiNuggets]);

  const filteredNuggets = useMemo(() => {
    return filterNuggets(
      {
        topics: selectedTopics,
        sections: selectedSections,
        challenge: selectedChallenge,
        book: selectedBook,
        sort,
      },
      selectedCategories.length
        ? apiNuggets.filter(nugget => catalog.topics.some(topic =>
            topic.name.trim().toLowerCase() === nugget.topic.trim().toLowerCase() &&
            catalog.categories.some(category => category.id === topic.categoryId && selectedCategories.includes(category.slug)),
          ))
        : apiNuggets,
    );
  }, [
    apiNuggets,
    catalog,
    selectedCategories,
    selectedTopics,
    selectedSections,
    selectedChallenge,
    selectedBook,
    sort,
  ]);

  const ITEMS_PER_PAGE = 12;

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredNuggets.length /
        ITEMS_PER_PAGE,
    ),
  );

  const safePage = Math.min(
    currentPage,
    totalPages,
  );

  const paginatedNuggets =
    filteredNuggets.slice(
      (safePage - 1) *
        ITEMS_PER_PAGE,
      safePage * ITEMS_PER_PAGE,
    );

  const topicCards = useMemo(() => {
    return catalog.topics.map((topic, index) => ({
      title: topic.name,
      slug: topic.slug,
      description: topic.description || topicDescriptions[topic.name] || `Explore published biblical business wisdom on ${topic.name}.`,
      count: topic.nuggetCount,
      image: topicImages[topic.name] ?? fallbackTopicImages[index % fallbackTopicImages.length],
    }));
  }, [catalog]);

  const challengeCards =
    useMemo(() => {
      return challenges.map(
        (challenge) => {
          const members =
            apiNuggets.filter(
              (nugget) =>
                nugget.challenges?.includes(
                  challenge,
                ),
            );

          const copy =
            challengeDescriptions[
              challenge
            ];

          return {
            title: challenge,

            count: members.length,

            kicker:
              copy?.kicker ??
              "CURATED PATHWAY",

            subtitle:
              copy?.subtitle ??
              `Explore biblical wisdom related to ${challenge}.`,

            firstNugget:
              members[0] ?? null,
          };
        },
      );
    }, [challenges, apiNuggets]);

  const scriptureGroups = useMemo(() => BIBLE_GROUPS.map(group => ({
    title: group.name,
    books: group.books.map(book => {
      const count = apiNuggets.filter(nugget => nugget.book === book).length;
      return { title: book, count, description: `${count} published ${count === 1 ? "Nugget" : "Nuggets"} from ${book}.` };
    }),
  })), [apiNuggets]);

  const normalizedBookQuery =
    bookQuery.trim().toLowerCase();

  const filteredScriptureGroups =
    scriptureGroups
      .map((group) => ({
        ...group,

        books: group.books.filter(
          (book) =>
            `${group.title} ${book.title} ${book.description}`
              .toLowerCase()
              .includes(
                normalizedBookQuery,
              ),
        ),
      }))
      .filter(
        (group) =>
          group.books.length > 0,
      );

  const proverbsCount =
    apiNuggets.filter(
      (nugget) =>
        nugget.book.toLowerCase() ===
        "proverbs",
    ).length;

  const collectionCards =
    useMemo(() => {
      return collections.map(
        (collection) => {
          const members =
            collection.nuggetSlugs
              .map((slug) =>
                apiNuggets.find(
                  (nugget) =>
                    nugget.slug === slug,
                ),
              )
              .filter(
                (
                  nugget,
                ): nugget is Nugget =>
                  Boolean(nugget),
              );

          return {
            ...collection,

            members,

            image:
              collectionImages[
                collection.slug
              ] ??
              members[0]?.image ??
              "/images/collection-main.png",
          };
        },
      );
    }, [apiNuggets]);

  const resultContext =
    selectedCategories.length === 1
      ? `inside ${catalog.categories.find(category => category.slug === selectedCategories[0])?.name || "the selected category"}`
      : selectedTopics.length === 1
      ? `inside ${selectedTopics[0]}`
      : selectedChallenge
        ? `for ${selectedChallenge}`
        : selectedBook
          ? `from ${selectedBook}`
          : "across the Wisdom Archive";

  return (
    <main>
      {/* PAGE HEADER */}
      <section className="border-b border-white/[0.06]">
        <div className="mx-auto w-[calc(100%-38px)] max-w-[1190px] pt-16 sm:pt-24 lg:w-[calc(100%-64px)]">
          <PageEyebrow>Library</PageEyebrow>
          <h1 className="bn-hero-title mt-[27px] font-serif text-[45px]! leading-tight text-[#FAF9F6]">
            The Wisdom Archive
          </h1>

          <p className="mt-4 max-w-[650px] text-[14px] leading-6 text-white/50">
            Discover premium biblical
            business strategies. Filter by
            topic, challenge, or scripture
            index.
          </p>

          <div className="mt-9 flex gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() =>
                  changeTab(tab)
                }
                className={`relative shrink-0 pb-4 text-[13px] transition ${
                  activeTab === tab
                    ? "font-medium text-[#C8A35A]"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {tab}

                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#C8A35A]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading && (
        <StatusPanel>
          Loading the Wisdom Archive...
        </StatusPanel>
      )}

      {!loading && error && (
        <StatusPanel>
          {error}
        </StatusPanel>
      )}

      {!loading &&
        !error &&
        activeTab ===
          "All Nuggets" && (
          <section className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
              {/* FILTERS */}
              <aside>
                <FilterGroup
                  title="Business Categories"
                  items={catalog.categories.map(category => ({ label: category.name, value: category.slug, count: category.nuggetCount, topicCount: catalog.topics.filter(topic => topic.categoryId === category.id).length }))}
                  selected={selectedCategories}
                  onToggle={(category) => updateParam("category", category, true)}
                />

                <div className="mt-8">
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-white">
                    Bible Section
                  </h2>

                  <div className="mt-4 space-y-3">
                    {bibleSections.map(
                      (section) => {
                        const selected =
                          selectedSections.includes(
                            section,
                          );

                        return (
                          <label
                            key={section}
                            className="flex cursor-pointer items-start gap-2 text-[13px] leading-5 text-white/60"
                          >
                            <input
                              type="checkbox"
                              checked={
                                selected
                              }
                              onChange={() =>
                                updateParam(
                                  "section",
                                  section,
                                  true,
                                )
                              }
                              className="sr-only"
                            />

                            <CheckBox
                              selected={
                                selected
                              }
                            />

                            <span>
                              {section}
                            </span>
                          </label>
                        );
                      },
                    )}
                  </div>
                </div>

                {(selectedCategories.length > 0 || selectedTopics.length >
                  0 ||
                  selectedSections.length >
                    0 ||
                  selectedChallenge ||
                  selectedBook) && (
                  <Link
                    href="/library"
                    className="mt-7 inline-block text-[13px] font-medium text-[#C8A35A] hover:text-[#E0C48A]"
                  >
                    Clear filters
                  </Link>
                )}
              </aside>

              {/* RESULTS */}
              <div className="min-w-0">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-[13px] text-white/50">
                    Showing{" "}
                    <span className="text-white">
                      {
                        filteredNuggets.length
                      }{" "}
                      {filteredNuggets.length ===
                      1
                        ? "Nugget"
                        : "Nuggets"}
                    </span>{" "}
                    {resultContext}
                  </p>

                  <label className="flex items-center gap-3 text-[13px] text-white/50">
                    Sort by:

                    <select
                      value={sort}
                      onChange={(event) =>
                        updateParam(
                          "sort",
                          event.target
                            .value,
                        )
                      }
                      className="rounded-md border border-white/10 bg-[#111111] px-3 py-2.5 text-[13px] text-white outline-none"
                    >
                      <option value="newest">
                        Most Recent
                      </option>

                      <option value="oldest">
                        Oldest
                      </option>

                      <option value="az">
                        A–Z
                      </option>
                    </select>
                  </label>
                </div>

                {paginatedNuggets.length >
                0 ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {paginatedNuggets.map(
                      (nugget) => (
                        <NuggetCard
                          key={
                            nugget.slug
                          }
                          nugget={
                            nugget
                          }
                        />
                      ),
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-[#111111] px-6 py-12 text-center">
                    <h2 className="font-serif text-[28px]">
                      No Nuggets found
                    </h2>

                    <p className="mt-3 text-[14px] text-white/50">
                      Try another filter or
                      clear your current
                      selections.
                    </p>

                    <Link
                      href="/library"
                      className="bn-button mt-6 inline-flex rounded-lg bg-[#C8A35A] px-5 py-3 text-[13px] font-semibold text-[#080808]"
                    >
                      Clear filters
                    </Link>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="mt-8 flex flex-wrap justify-end gap-2">
                    <PageButton
                      disabled={
                        safePage === 1
                      }
                      onClick={() =>
                        updateParam(
                          "page",
                          String(
                            Math.max(
                              1,
                              safePage -
                                1,
                            ),
                          ),
                        )
                      }
                    >
                      <ChevronLeft
                        size={15}
                      />
                    </PageButton>

                    {Array.from(
                      {
                        length:
                          totalPages,
                      },
                      (_, index) =>
                        index + 1,
                    ).map(
                      (number) => (
                        <button
                          key={
                            number
                          }
                          type="button"
                          onClick={() =>
                            updateParam(
                              "page",
                              String(
                                number,
                              ),
                            )
                          }
                          className={`flex h-9 w-9 items-center justify-center rounded-md border text-[13px] ${
                            safePage ===
                            number
                              ? "border-[#C8A35A] bg-[#C8A35A] font-semibold text-[#080808]"
                              : "border-white/10 text-white/50"
                          }`}
                        >
                          {number}
                        </button>
                      ),
                    )}

                    <PageButton
                      disabled={
                        safePage ===
                        totalPages
                      }
                      onClick={() =>
                        updateParam(
                          "page",
                          String(
                            Math.min(
                              totalPages,
                              safePage +
                                1,
                            ),
                          ),
                        )
                      }
                    >
                      <ChevronRight
                        size={15}
                      />
                    </PageButton>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

      {/* TOPICS INDEX */}
      {!loading &&
        !error &&
        activeTab ===
          "Topics Index" && (
          <ArchivePanel>
            <BackLabel />

            <h2 className="mt-5 font-serif text-[35px]! leading-tight">
              Browse by Core Topic
            </h2>

            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-white/50">
              Choose a topic to explore its
              published teachings and
              scripture foundations.
            </p>

            <div role="region" aria-label="Topics Index cards" tabIndex={0} className={`mt-8 ${cardStyles.grid}`}>
              {topicCards.map(
                (topic) => (
                  <Link
                    key={
                      topic.title
                    }
                  href={`/topics/${topic.slug}`}
                    className="group relative min-w-0 overflow-hidden rounded-xl border border-white/10"
                  >
                    <Image
                      src={
                        topic.image
                      }
                      alt={
                        topic.title
                      }
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-black/40" />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/15" />

                    <div className="absolute inset-0 flex flex-col p-5">
                      <div className="flex items-center justify-between text-[#C8A35A]">
                        <span className="text-xl">
                          ◎
                        </span>

                        <span className="text-[13px] font-medium">
                          {
                            topic.count
                          }{" "}
                          {topic.count ===
                          1
                            ? "Nugget"
                            : "Nuggets"}
                        </span>
                      </div>

                      <div className="mt-auto">
                        <h3 className="bn-topic-card-title line-clamp-2 break-words font-serif">
                          {
                            topic.title
                          }
                        </h3>

                        <p className="mt-2 line-clamp-2 break-words text-[13px] leading-5 text-white/55">
                          {
                            topic.description
                          }
                        </p>

                        <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#C8A35A]">
                          Explore topic

                          <ArrowRight
                            size={
                              13
                            }
                          />
                        </span>
                      </div>
                    </div>
                  </Link>
                ),
              )}
            </div>
          </ArchivePanel>
        )}

      {/* CHALLENGES */}
      {!loading &&
        !error &&
        activeTab ===
          "Challenges" && (
          <ArchivePanel>
            <BackLabel />

            <h2 className="mt-5 font-serif text-[35px]! leading-tight">
              I Need Wisdom About...
            </h2>

            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-white/50">
              Start with the challenge in
              front of you. Find a curated
              path from reflection to
              practical application.
            </p>

            <div role="region" aria-label="Challenges Index cards" tabIndex={0} className={`mt-8 ${cardStyles.grid} ${cardStyles.challenges}`}>
              {challengeCards.map(
                (item, index) => (
                  <Link
                    key={
                      item.title
                    }
                    href={`/challenges/${slugify(
                   item.title,
                   )}`}
                    className={`flex min-w-0 flex-col overflow-hidden rounded-xl border bg-[#111111] p-6 transition hover:border-[#C8A35A]/50 ${
                      index === 1
                        ? "border-[#C8A35A]/70"
                        : "border-white/10"
                    }`}
                  >
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                      {
                        item.count
                      }{" "}
                      {item.count ===
                      1
                        ? "NUGGET"
                        : "NUGGETS"}{" "}
                      ·{" "}
                      {
                        item.kicker
                      }
                    </p>

                    <h3 className="bn-topic-card-title mt-4 line-clamp-2 break-words font-serif">
                      {
                        item.title
                      }
                    </h3>

                    <p className="mt-3 line-clamp-2 break-words text-[13px] leading-5 text-white/55">
                      {
                        item.subtitle
                      }
                    </p>

                    {item.firstNugget && (
                      <p className="mt-4 line-clamp-1 text-[13px] leading-5 text-white/40">
                        Begin with:{" "}
                        {
                          item
                            .firstNugget
                            .title
                        }
                      </p>
                    )}

                    <span className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-[#C8A35A]">
                      Explore pathway

                      <ArrowRight
                        size={13}
                      />
                    </span>
                  </Link>
                ),
              )}
            </div>
          </ArchivePanel>
        )}

      {/* SCRIPTURE MATRIX */}
      {!loading &&
        !error &&
        activeTab ===
          "Scripture Matrix" && (
          <ArchivePanel>
            <BackLabel />

            <h2 className="mt-5 font-serif text-[35px]! leading-tight">
              Scripture Index
            </h2>

            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-white/50">
              Read the business teaching
              alongside its biblical
              foundation. Browse by Bible
              section, then book.
            </p>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-5">
                {filteredScriptureGroups.length >
                0 ? (
                  filteredScriptureGroups.map(
                    (group) => (
                      <section
                        key={
                          group.title
                        }
                        className="rounded-xl border border-white/10 bg-[#111111] p-5"
                      >
                        <h3 className="font-serif text-[20px]">
                          {
                            group.title
                          }
                        </h3>

                        <div className="mt-4 space-y-3">
                          {group.books.map(
                            (
                              book,
                            ) => (
                              <Link
                                key={
                                  book.title
                                }
                                href={`/scripture-index/${slugify(
                                  book.title,
                                )}`}
                                className="group flex items-center justify-between gap-5 rounded-lg border border-white/[0.08] bg-[#0B0B0B] px-5 py-4 transition hover:border-[#C8A35A]/45"
                              >
                                <div className="min-w-0">
                                  <h4 className="font-serif text-[16px]">
                                    {
                                      book.title
                                    }
                                  </h4>

                                  <p className="mt-1 text-[13px] leading-5 text-white/45">
                                    {
                                      book.description
                                    }
                                  </p>
                                </div>

                                <span className="shrink-0 text-[13px] font-medium text-[#C8A35A]">
                                  Browse
                                  book →
                                </span>
                              </Link>
                            ),
                          )}
                        </div>
                      </section>
                    ),
                  )
                ) : (
                  <div className="rounded-xl border border-white/10 bg-[#111111] p-8 text-center">
                    <p className="text-[14px] text-white/50">
                      No books match
                      “{bookQuery}”.
                    </p>
                  </div>
                )}
              </div>

              <aside className="self-start lg:sticky lg:top-24">
                <h3 className="text-[13px] font-semibold">
                  Find a book
                </h3>

                <label
                  htmlFor="book-search"
                  className="sr-only"
                >
                  Search scripture books
                </label>

                <input
                  id="book-search"
                  type="search"
                  value={bookQuery}
                  onChange={(event) =>
                    setBookQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search scripture books..."
                  className="mt-3 h-11 w-full rounded-lg border border-white/10 bg-[#181818] px-4 text-[13px] text-[#FAF9F6] outline-none placeholder:text-white/30 focus:border-[#C8A35A]/60"
                />

                <Link
                  href="/scripture-index/proverbs"
                  className="mt-5 block rounded-lg border border-[#C8A35A]/25 bg-[#C8A35A]/15 p-5 transition hover:border-[#C8A35A]/50"
                >
                  <p className="text-[13px] font-semibold text-[#C8A35A]">
                    Begin with Proverbs
                  </p>

                  <p className="mt-3 text-[13px] leading-5 text-white/55">
                    {proverbsCount}{" "}
                    published{" "}
                    {proverbsCount ===
                    1
                      ? "Nugget"
                      : "Nuggets"}{" "}
                    currently connect
                    Proverbs with
                    marketplace wisdom.
                  </p>
                </Link>

                <div className="mt-4 rounded-lg border border-[#C8A35A]/20 bg-[#C8A35A]/10 p-5">
                  <p className="text-[13px] font-semibold text-[#C8A35A]">
                    Read in context
                  </p>

                  <p className="mt-3 text-[13px] leading-5 text-white/55">
                    Business commentary
                    is an application,
                    not a replacement for
                    reading the passage in
                    its full biblical
                    setting.
                  </p>
                </div>
              </aside>
            </div>
          </ArchivePanel>
        )}

      {/* COLLECTIONS */}
      {!loading &&
        !error &&
        activeTab ===
          "Collections" && (
          <ArchivePanel>
            <BackLabel />

            <h2 className="mt-5 font-serif text-[35px]! leading-tight">
              Curated Learning Pathways
            </h2>

            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-white/50">
              Ordered teachings for
              sustained study. Continue a
              pathway or discover a new
              collection.
            </p>

            {collectionCards.length >
              0 && (
              <>
                <div className="mt-8 overflow-hidden rounded-xl border border-[#C8A35A]/65 bg-[#111111] p-5">
                  <div className="grid gap-6 md:grid-cols-[240px_1fr]">
                    <div className="relative min-h-[200px] overflow-hidden rounded-lg">
                      <Image
                        src={
                          collectionCards[0]
                            .image
                        }
                        alt={
                          collectionCards[0]
                            .title
                        }
                        fill
                        sizes="240px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex flex-col justify-center">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                        Featured Pathway
                      </p>

                      <h3 className="mt-3 font-serif text-[24px] leading-tight">
                        {
                          collectionCards[0]
                            .title
                        }
                      </h3>

                      <p className="mt-3 max-w-xl text-[14px] leading-6 text-white/50">
                        {
                          collectionCards[0]
                            .description
                        }
                      </p>

                      <p className="mt-5 text-[13px] text-white/55">
                        {
                          collectionCards[0]
                            .members
                            .length
                        }{" "}
                        published{" "}
                        {collectionCards[0]
                          .members
                          .length === 1
                          ? "Nugget"
                          : "Nuggets"}{" "}
                        currently available
                      </p>

                      <Link
                        href={`/collection/${collectionCards[0].slug}`}
                        className="bn-button mt-5 w-fit rounded-md bg-[#C8A35A] px-5 py-3 text-[13px] font-semibold text-[#080808]"
                      >
                        Explore Collection
                        →
                      </Link>
                    </div>
                  </div>
                </div>

                {collectionCards.length >
                  1 && (
                  <>
                    <h3 className="mt-9 font-serif text-[20px]">
                      Explore More
                      Collections
                    </h3>

                    <div className="mt-5 space-y-4">
                      {collectionCards
                        .slice(1)
                        .map(
                          (
                            collection,
                          ) => (
                            <Link
                              key={
                                collection.slug
                              }
                              href={`/collection/${collection.slug}`}
                              className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#111111] p-4 transition hover:border-[#C8A35A]/40"
                            >
                              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md">
                                <Image
                                  src={
                                    collection.image
                                  }
                                  alt={
                                    collection.title
                                  }
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4 className="font-serif text-[16px]">
                                  {
                                    collection.title
                                  }
                                </h4>

                                <p className="mt-1 text-[13px] leading-5 text-white/45">
                                  {
                                    collection.description
                                  }
                                </p>
                              </div>

                              <span className="hidden shrink-0 text-[13px] font-medium text-[#C8A35A] sm:block">
                                Explore
                                Collection →
                              </span>
                            </Link>
                          ),
                        )}
                    </div>
                  </>
                )}
              </>
            )}
          </ArchivePanel>
        )}
    </main>
  );
}

export default function LibraryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <div className="flex-1">
        <Suspense
          fallback={
            <StatusPanel>
              Loading the Wisdom Archive...
            </StatusPanel>
          }
        >
          <LibraryContent />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}

function NuggetCard({
  nugget,
}: {
  nugget: Nugget;
}) {
  return (
    <Link
      href={`/nugget/${nugget.slug}`}
      className="group overflow-hidden rounded-xl border border-white/10 bg-[#111111] transition hover:border-[#C8A35A]/45"
    >
      <div className="relative h-[165px] overflow-hidden">
        <Image
          src={nugget.image}
          alt={nugget.title}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex min-h-[210px] flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#C8A35A]">
            {nugget.tag ||
              nugget.topic}
          </span>

          <span className="flex items-center gap-1.5 text-[13px] text-white/40">
            <Clock3 size={13} />

            {nugget.duration}
          </span>
        </div>

        <h3 className="mt-3 font-serif text-[20px]! leading-[1.25]">
          {nugget.title}
        </h3>

        <p className="mt-3 text-[13px] italic leading-5 text-white/40">
          {nugget.scriptureRef}
        </p>

        <div className="mt-auto flex items-end justify-between pt-5">
          <span className="text-[13px] font-medium text-[#C8A35A]">
            Listen & Read
          </span>

          {nugget.isGold ? (
            <span className="rounded border border-[#C8A35A]/40 bg-[#C8A35A]/10 px-2 py-1 text-[12px] font-semibold text-[#C8A35A]">
              GOLD
            </span>
          ) : (
            <Circle
              size={15}
              strokeWidth={1.3}
              className="text-white/25"
            />
          )}
        </div>
      </div>
    </Link>
  );
}

function ArchivePanel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 lg:px-10">
      {children}
    </section>
  );
}

function BackLabel() {
  return (
    <Link
      href="/library"
      className="text-[13px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
    >
      ← All Nuggets
    </Link>
  );
}

function CheckBox({
  selected,
}: {
  selected: boolean;
}) {
  return (
    <span
      className={`mt-[2px] flex h-[14px] w-[14px] shrink-0 items-center justify-center border ${
        selected
          ? "border-[#C8A35A] bg-[#C8A35A]"
          : "border-[#C8A35A]/70"
      }`}
    >
      {selected && (
        <span className="h-1.5 w-1.5 bg-[#080808]" />
      )}
    </span>
  );
}

function FilterGroup({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;

  items: {
    label: string;
    value?: string;
    count: number;
    topicCount: number;
  }[];

  selected: string[];

  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-white">
        {title}
      </h2>

      <div role="region" aria-label={`${title} filters`} className="mt-4 space-y-3">
        {items.length === 0 && <p className="text-[13px] text-white/45">No categories available yet.</p>}
        {items.map((item) => {
          const checked =
            selected.includes(
              item.value ?? item.label,
            );

          return (
            <label
              key={item.label}
              className="flex cursor-pointer items-center gap-2 text-[13px] leading-5 text-white/60"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onToggle(item.value ?? item.label)
                }
                className="sr-only"
              />

              <CheckBox
                selected={checked}
              />

              <span>
                {item.label} (
                {item.topicCount} {item.topicCount === 1 ? "topic" : "topics"} · {item.count} {item.count === 1 ? "Nugget" : "Nuggets"})
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function PageButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/45 transition hover:border-[#C8A35A]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function StatusPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:px-10">
      <div className="rounded-xl border border-white/10 bg-[#111111] p-8 text-center text-[14px] text-white/55">
        {children}
      </div>
    </div>
  );
}