import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Headphones,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import CollectionProgressActions from "@/components/CollectionProgressActions";

import {
  getCollectionBySlug,
} from "@/lib/nuggets";

import {
  getPublishedNuggets,
} from "@/lib/nuggets-api";

import type { Nugget } from "@/types/nugget";

const collectionImages: Record<
  string,
  string
> = {
  "starting-your-business-gods-way":
    "/images/collection-main.png",

  "capital-stewardship-debt":
    "/images/saved-nugget1.png",

  "integrity-as-a-premium-brand":
    "/images/saved-nugget2.png",
};

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  /*
   * Collection structure is still stored
   * locally for now because we have not
   * built a Collections backend model yet.
   */
  const collection =
    getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  /*
   * Actual Nugget data comes from the
   * running backend.
   */
  let nuggets: Nugget[] = [];

  try {
    nuggets =
      await getPublishedNuggets();
  } catch (error) {
    console.error(
      "Failed to load collection Nuggets:",
      error,
    );
  }

  /*
   * Preserve the exact collection order,
   * but resolve each unit against API data.
   */
  const units = collection.nuggetSlugs
    .map((nuggetSlug) =>
      nuggets.find(
        (nugget) =>
          nugget.slug === nuggetSlug,
      ),
    )
    .filter(
      (
        nugget,
      ): nugget is Nugget =>
        Boolean(nugget),
    );

  const firstUnit =
    units[0] ?? null;

  const coverImage =
    collectionImages[
      collection.slug
    ] ??
    firstUnit?.image ??
    "/images/collection-main.png";

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main>
        {/* COLLECTION HERO */}
        <section className="border-b border-white/[0.06]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
            <Link
              href="/library?tab=Collections"
              className="text-[13px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              ← Collections
            </Link>

            <div className="mt-8 grid gap-8 lg:grid-cols-[270px_minmax(0,1fr)] lg:items-center">
              {/* IMAGE */}
              <div className="relative min-h-[260px] overflow-hidden rounded-xl border border-white/10 sm:min-h-[300px] lg:min-h-[270px]">
                <Image
                  src={coverImage}
                  alt={collection.title}
                  fill
                  priority
                  sizes="270px"
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-black/10" />
              </div>

              {/* DETAILS */}
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#C8A35A]">
                  Curated Learning Pathway
                </p>

                <h1 className="mt-3 max-w-[850px] font-serif text-[40px] leading-tight">
                  {collection.title}
                </h1>

                <p className="mt-4 max-w-[800px] text-[14px] leading-7 text-white/50">
                  {collection.description}
                </p>

                <CollectionProgressActions
                  collectionSlug={
                    collection.slug
                  }
                  nuggetIds={units.map(
                    (unit) => unit.id,
                  )}
                  firstNuggetSlug={
                    firstUnit?.slug ??
                    null
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* UNITS */}
        <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-[28px]">
                Chronological Blueprint Units
              </h2>

              <p className="mt-2 text-[14px] text-white/45">
                Follow the pathway in order
                or open any teaching
                individually.
              </p>
            </div>

            <span className="text-[13px] text-white/35">
              {units.length}{" "}
              {units.length === 1
                ? "Unit"
                : "Units"}
            </span>
          </div>

          {units.length > 0 ? (
            <div className="mt-7 space-y-3">
              {units.map(
                (unit, index) => (
                  <div
                    key={unit.slug}
                    className="grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-4 transition hover:border-[#C8A35A]/35 sm:grid-cols-[42px_70px_minmax(0,1fr)_90px_auto] sm:items-center"
                  >
                    {/* NUMBER */}
                    <span className="font-serif text-[18px] text-[#C8A35A]">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    {/* IMAGE */}
                    <div className="relative h-[64px] w-[70px] overflow-hidden rounded-md">
                      <Image
                        src={unit.image}
                        alt={unit.title}
                        fill
                        sizes="70px"
                        className="object-cover"
                      />
                    </div>

                    {/* TITLE */}
                    <div className="min-w-0">
                      <Link
                        href={`/nugget/${unit.slug}`}
                        className="font-serif text-[17px] leading-5 text-[#FAF9F6] transition hover:text-[#E0C48A]"
                      >
                        {unit.title}
                      </Link>

                      <p className="mt-1 text-[13px] text-white/40">
                        {
                          unit.scriptureRef
                        }
                      </p>
                    </div>

                    {/* DURATION */}
                    <span className="text-[13px] text-white/35">
                      {unit.duration}
                    </span>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/nugget/${unit.slug}`}
                        aria-label={`Open ${unit.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/50 transition hover:border-[#C8A35A]/50 hover:text-[#C8A35A]"
                      >
                        <BookOpen
                          size={15}
                        />
                      </Link>

                      <Link
                        href={`/nugget/${unit.slug}/reader`}
                        aria-label={`Read ${unit.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C8A35A]/35 text-[#C8A35A] transition hover:bg-[#C8A35A] hover:text-[#080808]"
                      >
                        <Headphones
                          size={15}
                        />
                      </Link>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="mt-7 rounded-xl border border-white/10 bg-[#111111] p-8 text-center">
              <h3 className="font-serif text-[20px]">
                No published units available
              </h3>

              <p className="mt-2 text-[14px] text-white/45">
                Some Nuggets in this
                collection may not be
                published in the backend yet.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}