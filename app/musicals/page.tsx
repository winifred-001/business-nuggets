import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Search,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

import { getPublishedNuggets } from "@/lib/nuggets-api";

import type { Nugget } from "@/types/nugget";

type MusicalNugget = Nugget & {
  musicalTitle?: string | null;
  musicalImage?: string | null;
  musicalAudioUrl?: string | null;
  audioUrl?: string | null;
  featured?: boolean;
};

const musicalImages = [
  "/images/musical.png",
  "/images/cinematic-musical1.png",
  "/images/cinematic-musical2.png",
  "/images/cinematic-musical3.png",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getMusicalImage(
  nugget: MusicalNugget,
  index: number,
) {
  return (
    nugget.musicalImage ??
    musicalImages[
      index % musicalImages.length
    ]
  );
}

export default async function MusicalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
  }>;
}) {
  const { q = "" } =
    await searchParams;

  let nuggets: MusicalNugget[] = [];
  let loadError = false;

  try {
    nuggets =
      (await getPublishedNuggets()) as MusicalNugget[];
  } catch (error) {
    console.error(
      "Failed to load Musicals:",
      error,
    );

    loadError = true;
  }

  /*
   * Until Musicals get their own backend
   * model, published Nuggets are the source
   * of truth for this screen.
   *
   * If musical-specific fields are added to
   * the API later, this page already knows
   * how to use them.
   */
  const musicalNuggets = nuggets.filter(
    (nugget) =>
      Boolean(
        nugget.musicalAudioUrl ||
          nugget.audioUrl ||
          nugget.duration,
      ),
  );

  const featured =
    musicalNuggets.find(
      (nugget) =>
        nugget.featured,
    ) ??
    musicalNuggets.find(
      (nugget) =>
        nugget.isGold,
    ) ??
    musicalNuggets[0] ??
    null;

  const normalizedQuery =
    normalize(q);

  const archive =
    musicalNuggets
      .filter(
        (nugget) =>
          nugget.slug !==
          featured?.slug,
      )
      .filter((nugget) => {
        if (!normalizedQuery) {
          return true;
        }

        const searchable =
          normalize(
            [
              nugget.musicalTitle ??
                "",
              nugget.title,
              nugget.topic,
              nugget.tag,
              nugget.book,
              nugget.scriptureRef,
            ].join(" "),
          );

        return searchable.includes(
          normalizedQuery,
        );
      });

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-10 lg:py-14">
        {/* HEADER */}
        <section>
          <Link
            href="/library"
            className="text-[13px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
          >
            ← Library
          </Link>

          <h1 className="mt-5 font-serif text-[40px] leading-tight">
            Wisdom Cinematic Musicals
          </h1>

          <p className="mt-3 max-w-[720px] text-[14px] leading-6 text-white/45">
            Immersive audio teachings layered
            over professional cinematic
            soundtracks and ambient
            soundscapes.
          </p>
        </section>

        {/* ERROR */}
        {loadError && (
          <div className="mt-8 rounded-xl border border-[#B54A4A]/35 bg-[#B54A4A]/10 p-5 text-[14px] text-[#E2A2A2]">
            Could not load the Musical
            Archive. Make sure the backend is
            running.
          </div>
        )}

        {/* FEATURED MUSICAL */}
        {!loadError && featured && (
          <section className="mt-9 overflow-hidden rounded-xl border border-[#C8A35A]/60 bg-[#111111] p-5 sm:p-6">
            <div className="grid gap-7 md:grid-cols-[280px_minmax(0,1fr)] md:items-center">
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <Image
                  src={getMusicalImage(
                    featured,
                    0,
                  )}
                  alt={
                    featured.musicalTitle ??
                    featured.title
                  }
                  fill
                  priority
                  sizes="280px"
                  className="object-cover"
                />
              </div>

              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C8A35A]">
                  Featured Suite ·{" "}
                  {featured.scriptureRef}
                </p>

                <h2 className="mt-3 max-w-[720px] font-serif text-[28px] leading-tight">
                  {featured.musicalTitle ??
                    featured.title}
                </h2>

                <p className="mt-3 text-[13px] text-white/45">
                  {featured.topic}
                </p>

                {featured.keyPrinciple && (
                  <p className="mt-4 max-w-[720px] text-[14px] leading-6 text-white/45">
                    {featured.keyPrinciple}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/nugget/${featured.slug}/musical`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#C8A35A] px-5 text-[13px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                  >
                    Open Musical

                    <ArrowRight
                      size={14}
                    />
                  </Link>

                  <Link
                    href={`/nugget/${featured.slug}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-5 text-[13px] font-medium text-white/65 transition hover:border-[#C8A35A]/50 hover:text-white"
                  >
                    Read Exposition
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SEARCH */}
        <section className="mt-10">
          <p className="mb-3 text-[13px] font-medium text-white/60">
            Discover a musical
          </p>

          <form
            action="/musicals"
            method="get"
            className="relative"
          >
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
            />

            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search title, creator or scripture..."
              className="h-12 w-full rounded-lg border border-white/10 bg-[#181818] pl-11 pr-4 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-[#C8A35A]/55"
            />
          </form>
        </section>

        {/* ARCHIVE */}
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-[28px]">
                Explore the Musical Archive
              </h2>

              {q && (
                <p className="mt-2 text-[13px] text-white/40">
                  {archive.length}{" "}
                  {archive.length === 1
                    ? "result"
                    : "results"}{" "}
                  for “{q}”
                </p>
              )}
            </div>

            {q && (
              <Link
                href="/musicals"
                className="text-[13px] font-medium text-[#C8A35A]"
              >
                Clear search
              </Link>
            )}
          </div>

          {archive.length > 0 ? (
            <div className="mt-6 space-y-4">
              {archive.map(
                (nugget, index) => (
                  <article
                    key={
                      nugget.slug
                    }
                    className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#111111] p-4 transition hover:border-[#C8A35A]/35 sm:flex-row sm:items-center"
                  >
                    {/* COVER */}
                    <Link
                      href={`/nugget/${nugget.slug}/musical`}
                      className="relative h-[88px] w-full shrink-0 overflow-hidden rounded-lg sm:w-[105px]"
                    >
                      <Image
                        src={getMusicalImage(
                          nugget,
                          index + 1,
                        )}
                        alt={
                          nugget.musicalTitle ??
                          nugget.title
                        }
                        fill
                        sizes="105px"
                        className="object-cover"
                      />
                    </Link>

                    {/* DETAILS */}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/nugget/${nugget.slug}/musical`}
                        className="font-serif text-[18px] leading-6 transition hover:text-[#E0C48A]"
                      >
                        {nugget.musicalTitle ??
                          nugget.title}
                      </Link>

                      <p className="mt-1 text-[13px] text-white/40">
                        {nugget.scriptureRef}
                        {" · "}
                        {nugget.topic}
                      </p>
                    </div>

                    {/* DURATION */}
                    <span className="shrink-0 text-[13px] text-white/35">
                      {nugget.duration}
                    </span>

                    {/* ACTION */}
                    <Link
                      href={`/nugget/${nugget.slug}/musical`}
                      className="inline-flex shrink-0 items-center gap-2 text-[13px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
                    >
                      Open Musical

                      <ArrowRight
                        size={13}
                      />
                    </Link>
                  </article>
                ),
              )}
            </div>
          ) : !loadError ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-[#111111] p-9 text-center">
              <h3 className="font-serif text-[20px]">
                No Musicals found
              </h3>

              <p className="mt-2 text-[14px] text-white/45">
                {q
                  ? "Try another title, Scripture reference or business topic."
                  : "Published Musical teachings will appear here automatically."}
              </p>
            </div>
          ) : null}

          {/* BOTTOM LINKS */}
          <div className="mt-8 flex flex-wrap gap-6">
            <Link
              href="/library?tab=Topics+Index"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-[#C8A35A]"
            >
              Explore Topics

              <ArrowRight
                size={13}
              />
            </Link>

            <Link
              href="/library?tab=Scripture+Matrix"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-[#C8A35A]"
            >
              Browse Scripture Index

              <ArrowRight
                size={13}
              />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}