import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import NuggetCard from "@/components/NuggetCard";
import { filterNuggets } from "@/lib/nuggets";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (rawQuery ?? "").trim();

  const results = filterNuggets({ query });

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-serif text-3xl">
          Search the wisdom library
        </h1>

        <p className="mt-3 text-sm text-gray-400">
          Search by title, scripture, topic, or business challenge.
        </p>

        <form
          key={query}
          action="/search"
          method="get"
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="nugget-search" className="sr-only">
            Search nuggets
          </label>

          <input
            id="nugget-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Try Joseph, Genesis, or negotiation"
            className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-neutral-950 px-4 py-3 text-white focus:border-amber-300 focus:outline-none"
          />

          <button
            type="submit"
            className="rounded-lg bg-amber-300 px-5 py-3 font-medium text-black hover:bg-amber-400"
          >
            Search
          </button>
        </form>

        <div className="my-6 flex flex-wrap items-center justify-between gap-3">
          <p
            role="status"
            className="break-words text-sm text-gray-400"
          >
            {results.length} nugget{results.length === 1 ? "" : "s"}{" "}
            {query
              ? `matching “${query}”`
              : "in the sample library"}
          </p>

          {query && (
            <Link
              href="/search"
              className="text-sm text-amber-300 hover:underline"
            >
              Clear search
            </Link>
          )}
        </div>

        {results.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((nugget) => (
              <NuggetCard key={nugget.slug} nugget={nugget} />
            ))}
          </div>
        ) : (
          <section className="rounded-xl border border-gray-800 p-6 text-center sm:p-10">
            <h2 className="font-serif text-2xl">
              No nuggets found
            </h2>

            <p className="mt-3 text-sm text-gray-400">
              Try a different word, a Bible book, or a topic.
            </p>

            <Link
              href="/search"
              className="mt-5 inline-block rounded bg-amber-300 px-5 py-3 font-medium text-black"
            >
              Clear search
            </Link>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}