import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import NuggetCard from "@/components/NuggetCard";
import {
  getNuggetsByTopic,
  slugify,
  topics,
} from "@/lib/nuggets";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = topics.find((item) => slugify(item) === slug);

  if (!topic) notFound();

  const items = getNuggetsByTopic(topic);
  const tags = [...new Set(items.map((nugget) => nugget.tag))];

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/library?tab=Topics+Index"
          className="text-sm text-amber-300"
        >
          ← All topics
        </Link>

        <p className="mt-6 text-xs uppercase text-amber-300">
          Core Wisdom Pathway
        </p>

        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">
          {topic}
        </h1>

        <p className="mt-3 text-sm text-gray-400">
          {items.length} nuggets in the sample library.
        </p>

        <div className="mt-8 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_250px]">
          <section className="min-w-0">
            {items.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((nugget) => (
                  <NuggetCard key={nugget.slug} nugget={nugget} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-gray-800 p-6 text-gray-400">
                No nuggets have been added to this topic yet.
              </p>
            )}
          </section>

          <aside className="h-fit rounded-xl border border-gray-800 p-5">
            <h2 className="font-semibold">Explore segments</h2>

            <ul className="mt-4 space-y-4">
              {tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/library?topic=${encodeURIComponent(topic)}&tag=${encodeURIComponent(tag)}`}
                    className="text-sm text-amber-300 hover:underline"
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}