import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import NuggetCard from "@/components/NuggetCard";
import ContentImage from "@/components/ContentImage";
import {
  challenges,
  filterNuggets,
  getNuggetBySlug,
  nuggets,
  slugify,
  topics,
} from "@/lib/nuggets";

export default function Home() {
  const featured = getNuggetBySlug("law-of-just-balances");
  const latest = filterNuggets().slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
          <ContentImage
            src="/images/visiting-homepage.png"
            alt="Business wisdom library"
            sizes="100vw"
          />

          <div className="absolute inset-0 bg-black/75" />

          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-widest text-amber-300">
              Timeless Biblical Wisdom for Today&apos;s Marketplace
            </p>

            <h1 className="mt-4 font-serif text-3xl leading-tight sm:text-5xl">
              Command Your Business with Absolute Clarity
            </h1>

            <form
              action="/search"
              method="get"
              className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="home-search" className="sr-only">
                Search the library
              </label>

              <input
                id="home-search"
                name="q"
                type="search"
                placeholder="Scripture, title, or business challenge"
                className="min-w-0 flex-1 rounded-md border border-gray-700 bg-neutral-900 px-4 py-3"
              />

              <button
                type="submit"
                className="rounded-md bg-amber-300 px-5 py-3 font-medium text-black"
              >
                Start Discovering
              </button>
            </form>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 sm:py-16">
          {featured && (
            <section>
              <h2 className="font-serif text-2xl">
                Featured Business Nugget
              </h2>

              <div className="mt-6 grid overflow-hidden rounded-xl border border-gray-800 bg-neutral-950 md:grid-cols-2">
                <div className="relative min-h-56">
                  <ContentImage
                    src={featured.image}
                    alt={featured.title}
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                </div>

                <div className="p-6">
                  <p className="text-xs text-amber-300">
                    {featured.topic} · {featured.scriptureRef}
                  </p>

                  <h3 className="mt-3 font-serif text-2xl">
                    {featured.title}
                  </h3>

                  <p className="mt-4 font-serif italic text-gray-400">
                    “{featured.scriptureText}”
                  </p>

                  <Link
                    href={`/nugget/${featured.slug}/reader`}
                    className="mt-6 inline-block rounded bg-amber-300 px-5 py-3 text-sm font-medium text-black"
                  >
                    Read Commentary
                  </Link>
                </div>
              </div>
            </section>
          )}

          <section>
            <h2 className="font-serif text-2xl">
              I Need Wisdom About…
            </h2>

            <div className="mt-5 flex flex-wrap gap-3">
              {challenges.map((challenge) => (
                <Link
                  key={challenge}
                  href={`/library?challenge=${encodeURIComponent(challenge)}`}
                  className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-amber-300"
                >
                  {challenge}
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl">
              Browse by Core Topic
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topics.map((topic) => (
                <Link
                  key={topic}
                  href={`/topics/${slugify(topic)}`}
                  className="rounded-xl border border-gray-800 bg-neutral-950 p-5 hover:border-amber-300"
                >
                  <h3 className="font-serif text-xl">{topic}</h3>

                  <p className="mt-3 text-xs text-amber-300">
                    {nuggets.filter((nugget) => nugget.topic === topic).length}
                    {" "}nuggets →
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl">
              Featured Wisdom Musicals
            </h2>

            <div className="mt-5 rounded-xl border border-gray-800 bg-neutral-950 p-5">
              <p className="text-sm text-gray-400">
                Audio teachings are coming soon. Explore the written
                nuggets in the meantime.
              </p>

              <Link
                href="/library"
                className="mt-4 inline-block text-sm text-amber-300"
              >
                Browse the library →
              </Link>
            </div>
          </section>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl">
                Latest Biblical Nuggets
              </h2>

              <Link href="/library" className="text-sm text-amber-300">
                Browse all →
              </Link>
            </div>

            {latest.length > 0 ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {latest.map((nugget) => (
                  <NuggetCard key={nugget.slug} nugget={nugget} />
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-gray-800 p-6 text-gray-400">
                No nuggets have been added yet.
              </p>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}