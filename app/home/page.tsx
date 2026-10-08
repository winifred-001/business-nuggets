import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import NuggetCard from "@/components/NuggetCard";
import { filterNuggets } from "@/lib/nuggets";

export default function HomePage() {
  const items = filterNuggets().slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar showAuthLinks={false} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-serif text-3xl sm:text-4xl">
          Your wisdom workspace
        </h1>

        <p className="mt-3 text-sm text-gray-400">
          Explore the sample library. Personal recommendations are
          coming soon.
        </p>

        <section className="mt-8 rounded-xl border border-gray-800 bg-neutral-950 p-5 sm:p-6">
          <h2 className="font-serif text-2xl">
            Continue listening
          </h2>

          <p className="mt-3 text-sm text-gray-400">
            No listening history yet. Audio playback is coming soon.
          </p>

          <Link
            href="/library"
            className="mt-4 inline-block text-sm text-amber-300"
          >
            Browse nuggets to read →
          </Link>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl">
            Discover your next nugget
          </h2>

          {items.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((nugget) => (
                <NuggetCard key={nugget.slug} nugget={nugget} />
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-gray-800 p-6 text-gray-400">
              No nuggets have been added yet.
            </p>
          )}

          <Link
            href="/library"
            className="mt-6 inline-block text-amber-300"
          >
            Explore the full library →
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}