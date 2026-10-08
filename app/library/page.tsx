"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import NuggetCard from "@/components/NuggetCard";
import {
  bibleSections,
  books,
  challenges,
  collections,
  filterNuggets,
  getNuggetsBySlugs,
  nuggets,
  slugify,
  topics,
} from "@/lib/nuggets";

const tabs = [
  "All Nuggets",
  "Topics Index",
  "Challenges",
  "Scripture Matrix",
  "Collections",
];

function LibraryContent() {
  const params = useSearchParams();
  const router = useRouter();

  const tab = tabs.includes(params.get("tab") ?? "")
    ? params.get("tab")!
    : tabs[0];

  const selectedTopics = params.getAll("topic");
  const selectedSections = params.getAll("section");

  const requestedSort = params.get("sort") ?? "newest";

  const sort = ["newest", "oldest", "az"].includes(requestedSort)
    ? requestedSort
    : "newest";

  // Find the nuggets matching the current choices.
  const filtered = filterNuggets({
    query: params.get("q") ?? "",
    topics: selectedTopics,
    sections: selectedSections,
    challenge: params.get("challenge") ?? "",
    book: params.get("book") ?? "",
    tag: params.get("tag") ?? "",
    sort,
  });

  // Keep choices in the page address so refreshing preserves them.
  function update(
    key: string,
    value: string,
    multiple = false,
  ) {
    const next = new URLSearchParams(params.toString());

    if (multiple) {
      const values = next.getAll(key);

      next.delete(key);

      const updatedValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      updatedValues.forEach((item) => next.append(key, item));
    } else if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    router.push(
      `/library${next.size ? `?${next}` : ""}`,
      { scroll: false },
    );
  }

  const resetHref = `/library?tab=${encodeURIComponent(tab)}`;

  // Each index tab groups the matching articles differently.
  const groups =
    tab === "Topics Index"
      ? topics.map((label) => ({
          label,
          members: filtered.filter((n) => n.topic === label),
          href: `/topics/${slugify(label)}`,
        }))
      : tab === "Challenges"
        ? challenges.map((label) => ({
            label,
            members: filtered.filter((n) =>
              n.challenges.includes(label),
            ),
            href: `/library?challenge=${encodeURIComponent(label)}`,
          }))
        : tab === "Scripture Matrix"
          ? books.map((label) => ({
              label,
              members: filtered.filter((n) => n.book === label),
              href: `/scripture-index/${slugify(label)}`,
            }))
          : [];

  return (
    <>
      {/* Library tabs */}
      <div
        className="mb-8 flex gap-5 overflow-x-auto border-b border-gray-800"
        role="tablist"
        aria-label="Library views"
      >
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            id={`tab-${slugify(item)}`}
            aria-selected={tab === item}
            aria-controls="library-panel"
            onClick={() => update("tab", item)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                  event.key,
                )
              ) {
                return;
              }

              event.preventDefault();

              const current = tabs.indexOf(item);

              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? tabs.length - 1
                    : (
                        current +
                        (event.key === "ArrowRight" ? 1 : -1) +
                        tabs.length
                      ) % tabs.length;

              update("tab", tabs[next]);

              document
                .getElementById(`tab-${slugify(tabs[next])}`)
                ?.focus();
            }}
            className={`shrink-0 border-b-2 pb-3 text-sm ${
              tab === item
                ? "border-amber-300 text-amber-300"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Filters */}
        <aside className="min-w-0">
          <details
            open
            className="rounded-xl border border-gray-800 bg-neutral-950 p-4"
          >
            <summary className="cursor-pointer font-semibold text-amber-300">
              Filter the library
            </summary>

            <div className="mt-5 space-y-6">
              {/* Keyword search */}
              <form
                key={params.get("q")}
                onSubmit={(event) => {
                  event.preventDefault();

                  const form = new FormData(event.currentTarget);

                  update("q", String(form.get("q") ?? ""));
                }}
              >
                <label
                  htmlFor="library-query"
                  className="mb-2 block text-xs uppercase text-gray-400"
                >
                  Keyword
                </label>

                <input
                  id="library-query"
                  name="q"
                  type="search"
                  defaultValue={params.get("q") ?? ""}
                  placeholder="Title, scripture, or challenge"
                  className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm"
                />

                <button
                  type="submit"
                  className="mt-2 w-full rounded bg-amber-300 py-2 text-sm font-medium text-black"
                >
                  Search library
                </button>
              </form>

              {/* Topic filters */}
              <fieldset>
                <legend className="mb-3 text-xs uppercase text-gray-400">
                  Business topics
                </legend>

                <div className="space-y-3">
                  {topics.map((topic) => (
                    <label
                      key={topic}
                      className="flex items-start gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTopics.includes(topic)}
                        onChange={() => update("topic", topic, true)}
                        className="mt-1 accent-amber-300"
                      />

                      <span>
                        {topic}{" "}
                        <span className="text-gray-500">
                          (
                          {
                            nuggets.filter((n) => n.topic === topic)
                              .length
                          }
                          )
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Bible-section filters */}
              <fieldset>
                <legend className="mb-3 text-xs uppercase text-gray-400">
                  Bible section
                </legend>

                <div className="space-y-3">
                  {bibleSections.map((section) => (
                    <label
                      key={section}
                      className="flex items-start gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSections.includes(section)}
                        onChange={() =>
                          update("section", section, true)
                        }
                        className="mt-1 accent-amber-300"
                      />

                      <span>{section}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Challenge filter */}
              <label className="block text-xs uppercase text-gray-400">
                Challenge

                <select
                  aria-label="Challenge filter"
                  value={params.get("challenge") ?? ""}
                  onChange={(event) =>
                    update("challenge", event.target.value)
                  }
                  className="mt-2 w-full rounded border border-gray-700 bg-black p-2 text-sm normal-case text-white"
                >
                  <option value="">All challenges</option>

                  {challenges.map((challenge) => (
                    <option key={challenge} value={challenge}>
                      {challenge}
                    </option>
                  ))}
                </select>
              </label>

              {(params.has("book") || params.has("tag")) && (
                <p className="break-words text-xs text-gray-400">
                  Also filtered by:{" "}
                  {[params.get("book"), params.get("tag")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

              <Link
                href={resetHref}
                scroll={false}
                className="inline-block text-sm text-amber-300 hover:underline"
              >
                Clear filters
              </Link>
            </div>
          </details>
        </aside>

        {/* Results */}
        <section
          id="library-panel"
          role="tabpanel"
          aria-labelledby={`tab-${slugify(tab)}`}
          className="min-w-0"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-sm text-gray-400">
              {filtered.length} matching nugget
              {filtered.length === 1 ? "" : "s"}
            </p>

            <label className="flex items-center gap-2 text-sm text-gray-400">
              Sort by

              <select
                aria-label="Sort nuggets"
                value={sort}
                onChange={(event) =>
                  update("sort", event.target.value)
                }
                className="rounded border border-gray-700 bg-neutral-950 px-3 py-2 text-white"
              >
                <option value="newest">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="az">A–Z</option>
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              href={resetHref}
              label="Clear filters"
            />
          ) : tab === "All Nuggets" ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((nugget) => (
                <NuggetCard
                  key={nugget.slug}
                  nugget={nugget}
                />
              ))}
            </div>
          ) : tab === "Collections" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {collections
                .filter((collection) =>
                  getNuggetsBySlugs(collection.nuggetSlugs).some(
                    (nugget) =>
                      filtered.some(
                        (match) => match.slug === nugget.slug,
                      ),
                  ),
                )
                .map((collection) => (
                  <article
                    key={collection.slug}
                    className="rounded-xl border border-gray-800 bg-neutral-950 p-5"
                  >
                    <h2 className="font-serif text-xl">
                      <Link
                        href={`/collection/${collection.slug}`}
                        className="hover:text-amber-300"
                      >
                        {collection.title}
                      </Link>
                    </h2>

                    <p className="mt-3 text-sm text-gray-400">
                      {collection.description}
                    </p>

                    <p className="mt-3 text-xs text-amber-300">
                      {
                        getNuggetsBySlugs(
                          collection.nuggetSlugs,
                        ).filter((nugget) =>
                          filtered.some(
                            (match) => match.slug === nugget.slug,
                          ),
                        ).length
                      }{" "}
                      matching nuggets
                    </p>

                    <Link
                      href={`/collection/${collection.slug}`}
                      className="mt-4 inline-block text-sm text-amber-300"
                    >
                      Open collection →
                    </Link>
                  </article>
                ))}

              {!collections.some((collection) =>
                getNuggetsBySlugs(collection.nuggetSlugs).some(
                  (nugget) =>
                    filtered.some(
                      (match) => match.slug === nugget.slug,
                    ),
                ),
              ) && (
                <EmptyState
                  title="No matching collections"
                  href={resetHref}
                  label="Clear filters"
                />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {groups
                .filter((group) => group.members.length > 0)
                .map((group) => (
                  <section
                    key={group.label}
                    className="rounded-xl border border-gray-800 bg-neutral-950 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-serif text-xl">
                        {group.label}
                      </h2>

                      <Link
                        href={group.href}
                        className="text-sm text-amber-300"
                      >
                        Explore {group.members.length} nuggets →
                      </Link>
                    </div>

                    <ul className="mt-4 divide-y divide-gray-800">
                      {group.members.map((nugget) => (
                        <li
                          key={nugget.slug}
                          className="py-3"
                        >
                          <Link
                            href={`/nugget/${nugget.slug}`}
                            className="block hover:text-amber-300"
                          >
                            {nugget.title}
                          </Link>

                          <p className="mt-1 text-xs text-gray-400">
                            {nugget.scriptureRef}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

// Show this when the filters have no matching articles.
function EmptyState({
  title = "No nuggets found",
  description = "Try another keyword or clear your filters.",
  href = "/library",
  label = "Browse the library",
}: {
  title?: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-700 p-6 text-center sm:p-10">
      <h2 className="font-serif text-xl">{title}</h2>

      <p className="mt-2 text-sm text-gray-400">
        {description}
      </p>

      <Link
        href={href}
        className="mt-5 inline-block rounded-md bg-amber-300 px-5 py-2 text-sm font-medium text-black"
      >
        {label}
      </Link>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="mb-2 font-serif text-3xl font-semibold">
          The Wisdom Archive
        </h1>

        <p className="mb-8 max-w-2xl text-sm text-gray-400">
          Explore nuggets by topic, business challenge, scripture,
          or collection.
        </p>

        <Suspense
          fallback={
            <p className="text-gray-400">
              Loading the library...
            </p>
          }
        >
          <LibraryContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}