import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bookmark,
  ListPlus,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Play,
  Repeat2,
  Volume2,
  Maximize2,
} from "lucide-react";

import Navbar from "@/components/navbar";

import { getNuggetBySlug } from "@/lib/nuggets";
import { getNuggetBySlugFromApi } from "@/lib/nuggets-api";

export default async function NuggetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let nugget = null;

  try {
    nugget = await getNuggetBySlugFromApi(id);
  } catch {
    nugget = null;
  }

  if (!nugget) {
    nugget = getNuggetBySlug(id);
  }

  if (!nugget) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#080808] pb-[96px] text-[#FAF9F6]">
      <Navbar />

      <main>
        {/* HERO */}
        <section className="relative min-h-[350px] overflow-hidden border-b border-white/[0.06]">
          <Image
            src={nugget.image}
            alt={nugget.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          <div className="absolute inset-0 bg-black/45" />

          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-black/25 to-black/20" />

          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-black/10" />

          <div className="relative mx-auto flex min-h-[350px] max-w-[1280px] items-end px-5 pb-12 sm:px-8 lg:px-10">
            <div className="max-w-[950px]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                Nugget #{nugget.number} · {nugget.topic}
              </p>

              <h1 className="mt-4 max-w-[1000px] font-serif text-[40px] leading-[1.08] text-[#FAF9F6]">
                {nugget.title}
              </h1>
            </div>
          </div>
        </section>

        {/* BODY */}
        <section className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_270px]">
            {/* LEFT CONTENT */}
            <div className="min-w-0">
              {/* SCRIPTURE */}
              {nugget.scriptureText && (
                <blockquote className="rounded-xl border border-white/10 bg-[#111111] p-6">
                  <p className="font-serif text-[18px] italic leading-8 text-[#FAF9F6]/80">
                    “{nugget.scriptureText}”
                  </p>

                  <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                    {nugget.scriptureRef}
                  </p>
                </blockquote>
              )}

              {/* TABS */}
              <div className="mt-8 flex gap-7 overflow-x-auto border-b border-white/[0.08]">
                <Link
                  href={`/nugget/${nugget.slug}`}
                  className="relative shrink-0 pb-4 text-[13px] font-medium text-[#C8A35A]"
                >
                  Read Wisdom

                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#C8A35A]" />
                </Link>

                <Link
                 href={`/nugget/${nugget.slug}/audio`}
                 className="shrink-0 pb-4 text-[13px] text-white/45 transition hover:text-[#C8A35A]"
                >
                 Listen Commentary
                </Link>

                <button
                  type="button"
                  className="shrink-0 pb-4 text-[13px] text-white/45 transition hover:text-white"
                >
                  Listen Commentary
                </button>
              </div>

              {/* KEY PRINCIPLE */}
              <section className="pt-8">
                <h2 className="font-serif text-[28px] leading-tight text-[#FAF9F6]">
                  Key Principle
                </h2>

                <p className="mt-4 text-[14px] leading-7 text-white/50">
                  {nugget.keyPrinciple ||
                    "Commentary for this Nugget will be added soon."}
                </p>
              </section>

              {/* MARKETPLACE APPLICATION */}
              {nugget.marketplaceApplication && (
                <section className="pt-9">
                  <h2 className="font-serif text-[28px] leading-tight text-[#FAF9F6]">
                    Marketplace Application
                  </h2>

                  <p className="mt-4 text-[14px] leading-7 text-white/50">
                    {nugget.marketplaceApplication}
                  </p>
                </section>
              )}

              {/* PRACTICAL ACTION PLAN */}
              {nugget.practicalActionPlan &&
                nugget.practicalActionPlan.length > 0 && (
                  <section className="pt-9">
                    <h2 className="font-serif text-[28px] leading-tight text-[#FAF9F6]">
                      Practical Action Plan
                    </h2>

                    <div className="mt-5 space-y-3">
                      {nugget.practicalActionPlan.map(
                        (action, index) => (
                          <div
                            key={action}
                            className="flex gap-4 rounded-lg border border-white/[0.08] bg-[#111111] p-4"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#C8A35A]/40 text-[13px] font-semibold text-[#C8A35A]">
                              {index + 1}
                            </span>

                            <p className="text-[14px] leading-6 text-white/55">
                              {action}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                )}
            </div>

            {/* RIGHT ACTIONS */}
            <aside className="self-start rounded-xl border border-white/10 bg-[#111111] p-5 lg:sticky lg:top-24">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#FAF9F6]">
                Nugget Actions
              </h2>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[14px] text-white/65 transition hover:bg-white/[0.04] hover:text-[#E0C48A]"
                >
                  <Bookmark
                    size={16}
                    className="text-[#C8A35A]"
                  />

                  Save to Library
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[14px] text-white/65 transition hover:bg-white/[0.04] hover:text-[#E0C48A]"
                >
                  <ListPlus
                    size={16}
                    className="text-[#C8A35A]"
                  />

                  Add to Playlist
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[14px] text-white/65 transition hover:bg-white/[0.04] hover:text-[#E0C48A]"
                >
                  <Share2
                    size={16}
                    className="text-[#C8A35A]"
                  />

                  Share Commentary
                </button>
              </div>
            </aside>
          </div>
        </section>
      </main>

      {/* FIXED AUDIO PLAYER */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#111111]">
        <div className="mx-auto flex min-h-[84px] max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-10">
          {/* TRACK INFO */}
          <div className="flex min-w-0 items-center gap-3 sm:w-[270px]">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md">
              <Image
                src="/images/musical.png"
                alt=""
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate font-serif text-[13px] text-[#FAF9F6]">
                The Joseph Storage Blueprint
              </p>

              <p className="mt-1 truncate text-[11px] text-white/35">
                Genesis 41 · Strategic Reserve
              </p>
            </div>
          </div>

          {/* CENTER PLAYER */}
          <div className="hidden min-w-0 flex-1 flex-col items-center md:flex">
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Shuffle"
                className="text-white/40 hover:text-white"
              >
                <Shuffle size={14} />
              </button>

              <button
                type="button"
                aria-label="Previous track"
                className="text-white/55 hover:text-white"
              >
                <SkipBack size={15} />
              </button>

              <button
                type="button"
                aria-label="Play"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8A35A] text-[#080808]"
              >
                <Play
                  size={14}
                  fill="currentColor"
                />
              </button>

              <button
                type="button"
                aria-label="Next track"
                className="text-white/55 hover:text-white"
              >
                <SkipForward size={15} />
              </button>

              <button
                type="button"
                aria-label="Repeat"
                className="text-white/40 hover:text-white"
              >
                <Repeat2 size={14} />
              </button>
            </div>

            <div className="mt-2 flex w-full max-w-[520px] items-center gap-3">
              <span className="text-[10px] text-white/30">
                01:45
              </span>

              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[38%] rounded-full bg-[#C8A35A]" />
              </div>

              <span className="text-[10px] text-white/30">
                {nugget.duration || "06:42"}
              </span>
            </div>
          </div>

          {/* MOBILE PLAY */}
          <button
            type="button"
            aria-label="Play"
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8A35A] text-[#080808] md:hidden"
          >
            <Play
              size={15}
              fill="currentColor"
            />
          </button>

          {/* RIGHT CONTROLS */}
          <div className="hidden items-center justify-end gap-4 sm:w-[180px] md:flex">
            <Volume2
              size={15}
              className="text-white/55"
            />

            <button
              type="button"
              aria-label="Full screen"
              className="text-white/55 hover:text-white"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}