import Link from "next/link";
import { getPublishedNuggets } from "@/lib/nuggets-api";
import { getServerMemberToken } from "@/lib/server-member-token";
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
  const token = await getServerMemberToken();

  const apiNuggets = await getPublishedNuggets(token);
  const results = filterNuggets({ query }, apiNuggets);

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-6 sm:py-12 md:px-8 lg:px-10 lg:py-14">
        <section className="max-w-3xl">
          <h1 className="font-serif text-[40px] leading-tight text-[#FAF9F6]">
            Search the Wisdom Library
          </h1>

          <p className="mt-3 text-[16px] leading-7 text-white/50">
            Search by title, scripture, topic, or business challenge.
          </p>
        </section>

        <form
          key={query}
          action="/search"
          method="get"
          className="mt-7 flex max-w-4xl flex-col gap-3 sm:flex-row"
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
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#111111] px-4 text-[16px] text-[#FAF9F6] outline-none placeholder:text-[#8A8781] focus:border-[#C8A35A]"
          />

          <button
            type="submit"
            className="min-h-12 rounded-xl bg-[#C8A35A] px-6 text-[15px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] sm:min-w-[120px]"
          >
            Search
          </button>
        </form>

        <div className="my-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            role="status"
            className="break-words text-[14px] leading-6 text-[#8A8781]"
          >
            {results.length} nugget{results.length === 1 ? "" : "s"}{" "}
            {query ? `matching “${query}”` : "in the wisdom library"}
          </p>

          {query && (
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center text-[14px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              Clear search
            </Link>
          )}
        </div>

        {results.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((nugget) => (
              <NuggetCard key={nugget.slug} nugget={nugget} />
            ))}
          </div>
        ) : (
          <section className="rounded-xl border border-white/10 bg-[#111111] px-5 py-10 text-center sm:px-8 sm:py-12">
            <h2 className="font-serif text-[28px] text-[#FAF9F6]">
              No nuggets found
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-[16px] leading-7 text-white/50">
              Try a different word, a Bible book, or a topic.
            </p>

            <Link
              href="/search"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#C8A35A] px-5 text-[14px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
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