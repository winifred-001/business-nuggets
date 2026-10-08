import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import NuggetCard from "@/components/NuggetCard";
import { books, nuggets, slugify } from "@/lib/nuggets";

export default async function ScriptureIndexDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = books.find((item) => slugify(item) === slug);

  if (!book) notFound();

  const items = nuggets
    .filter((nugget) => nugget.book === book)
    .sort((a, b) =>
      a.scriptureRef.localeCompare(b.scriptureRef, undefined, {
        numeric: true,
      }),
    );

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/library?tab=Scripture+Matrix"
          className="text-sm text-amber-300"
        >
          ← Scripture Index
        </Link>

        <h1 className="mt-6 font-serif text-3xl sm:text-4xl">
          The Book of {book}
        </h1>

        <p className="mt-3 text-sm text-gray-400">
          {items.length} associated nuggets in the sample library.
        </p>

        <h2 className="mt-8 font-serif text-2xl">
          Featured wisdom
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 3).map((nugget) => (
            <NuggetCard key={nugget.slug} nugget={nugget} />
          ))}
        </div>

        <h2 className="mt-10 font-serif text-2xl">
          Full Scripture Listing
        </h2>

        <ul className="mt-5 divide-y divide-gray-800 rounded-xl border border-gray-800">
          {items.map((nugget) => (
            <li
              key={nugget.slug}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
            >
              <span className="text-sm text-amber-300 sm:w-32 sm:shrink-0">
                {nugget.scriptureRef}
              </span>

              <Link
                href={`/nugget/${nugget.slug}`}
                className="min-w-0 flex-1 break-words hover:text-amber-300"
              >
                {nugget.title}
              </Link>

              <Link
                href={`/nugget/${nugget.slug}/reader`}
                className="text-sm text-amber-300"
              >
                Read →
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 font-serif text-2xl">
          Explore other books
        </h2>

        <div className="mt-4 flex flex-wrap gap-3">
          {books
            .filter((item) => item !== book)
            .map((item) => (
              <Link
                key={item}
                href={`/scripture-index/${slugify(item)}`}
                className="rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-amber-300"
              >
                {item}
              </Link>
            ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}