import ContentImage from "@/components/ContentImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { getNuggetBySlug } from "@/lib/nuggets";

export default async function NuggetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nugget = getNuggetBySlug(id);

  if (!nugget) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Link href="/library" className="text-sm text-amber-300">
          ← Wisdom Archive
        </Link>

        <div className="relative mt-6 h-64 overflow-hidden rounded-xl sm:h-80">
        <ContentImage
         src={nugget.image}
         alt={nugget.title}
         sizes="(min-width: 1280px) 1200px, 100vw"
         />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
            <p className="text-xs text-amber-300">
              Nugget #{nugget.number} · {nugget.topic}
            </p>

            <h1 className="mt-2 max-w-3xl break-words font-serif text-2xl sm:text-4xl">
              {nugget.title}
            </h1>
          </div>
        </div>

        <div className="mt-8 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            {nugget.scriptureText && (
              <blockquote className="rounded-xl border border-gray-800 bg-neutral-950 p-5 font-serif text-lg italic">
                “{nugget.scriptureText}”

                <p className="mt-3 text-xs not-italic text-amber-300">
                  {nugget.scriptureRef}
                </p>
              </blockquote>
            )}

            <h2 className="mt-8 font-serif text-2xl">
              Key Principle
            </h2>

            <p className="mt-3 leading-relaxed text-gray-400">
              {nugget.keyPrinciple ||
                "Commentary for this sample nugget will be added soon."}
            </p>

            {nugget.marketplaceApplication && (
              <>
                <h2 className="mt-8 font-serif text-2xl">
                  Marketplace Application
                </h2>

                <p className="mt-3 leading-relaxed text-gray-400">
                  {nugget.marketplaceApplication}
                </p>
              </>
            )}
          </div>

          <aside className="h-fit rounded-xl border border-gray-800 p-5">
            <h2 className="font-semibold">Explore this nugget</h2>

            <Link
              href={`/nugget/${nugget.slug}/reader`}
              className="mt-5 block rounded bg-amber-300 px-4 py-3 text-center font-medium text-black"
            >
              Read Wisdom
            </Link>

            <Link
              href={`/library?topic=${encodeURIComponent(nugget.topic)}`}
              className="mt-4 block text-sm text-amber-300"
            >
              More in {nugget.topic}
            </Link>

            <Link
              href={`/library?book=${encodeURIComponent(nugget.book)}`}
              className="mt-4 block text-sm text-amber-300"
            >
              Explore {nugget.book}
            </Link>

            <p className="mt-5 text-xs text-gray-400">
              Audio playback and personal saving are coming soon.
            </p>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}