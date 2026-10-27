import { nuggetText } from "@/lib/nugget-text";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Maximize2,
  Play,
  Repeat2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";

import Navbar from "@/components/navbar";
import PremiumNuggetGate from "@/components/PremiumNuggetGate";
import ReaderProgressTracker from "@/components/ReaderProgressTracker";

import {
  getNuggetBySlugFromApi,
  PremiumRequiredError,
} from "@/lib/nuggets-api";
import {
  getServerMemberToken,
} from "@/lib/server-member-token";

export default async function ReaderViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token =
    await getServerMemberToken();

  let nugget = null;

  try {
    nugget =
      await getNuggetBySlugFromApi(
        id,
        token,
      );
  } catch (error) {
    if (
      error instanceof
      PremiumRequiredError
    ) {
      return (
        <PremiumNuggetGate />
      );
    }

    throw error;
  }

  if (!nugget) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-[96px] text-[#15120E]">
      <ReaderProgressTracker nuggetId={nugget.id} />

      <Navbar />

      <main className="mx-auto w-full max-w-[1180px] px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
        <nav
          aria-label="Reader breadcrumb"
          className="flex flex-wrap items-center gap-2 text-[13px] text-[#756E64]"
        >
          <Link
            href="/library"
            className="transition hover:text-[#9A7839]"
          >
            Wisdom Archive
          </Link>

          <span>/</span>

          <Link
            href={`/library?topic=${encodeURIComponent(
              nugget.topic,
            )}`}
            className="transition hover:text-[#9A7839]"
          >
            {nugget.topic}
          </Link>

          <span>/</span>

          <span className="text-[#9A7839]">
            {nugget.title}
          </span>
        </nav>

        <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_270px]">
          <article className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#9A7839]">
              Nugget #{nugget.number} · {nugget.topic}
            </p>

            <h1 className="bn-hero-title mt-3 max-w-[800px] font-serif text-[40px] leading-[1.05] text-[#15120E]">
              {nugget.title}
            </h1>

            {nugget.scriptureText && (
              <blockquote className="mt-6 max-w-[800px] border-l-2 border-[#C8A35A] pl-5">
                <p className="font-serif whitespace-pre-line break-words text-[18px] italic leading-8 text-[#655D53]">
                  “{nuggetText(nugget.scriptureText)}”
                </p>

                <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#9A7839]">
                  {nugget.scriptureRef}
                </p>
              </blockquote>
            )}

            <section className="mt-9">
              <h2 className="bn-nugget-section-title font-serif text-[22px] leading-tight text-[#15120E]">
                Scripture Context
              </h2>

              <p className="mt-4 max-w-[820px] whitespace-pre-line break-words text-[14px] leading-7 text-[#4F4941]">
                {nuggetText(nugget.keyPrinciple) ||
                  "Commentary for this Nugget will be added soon."}
              </p>
            </section>

            {nugget.details && (
              <section className="mt-9">
                <h2 className="bn-nugget-section-title font-serif text-[22px] leading-tight text-[#15120E]">Details</h2>
                <p className="mt-4 max-w-[820px] whitespace-pre-line break-words text-[14px] leading-7 text-[#4F4941]">{nuggetText(nugget.details)}</p>
              </section>
            )}

            {nugget.marketplaceApplication && (
              <section className="mt-9">
                <h2 className="bn-nugget-section-title font-serif text-[22px] leading-tight text-[#15120E]">
                  Marketplace Application
                </h2>

                <p className="mt-4 max-w-[820px] whitespace-pre-line break-words text-[14px] leading-7 text-[#4F4941]">
                  {nuggetText(nugget.marketplaceApplication)}
                </p>
              </section>
            )}

            {nugget.practicalActionPlan &&
              nugget.practicalActionPlan.length > 0 && (
                <section className="mt-9">
                  <h2 className="bn-nugget-section-title font-serif text-[22px] leading-tight text-[#15120E]">
                    Practical Action Plan
                  </h2>

                  <ol className="mt-4 space-y-3">
                    {nugget.practicalActionPlan.map(
                      (action, index) => (
                        <li
                          key={`${index}-${action}`}
                          className="flex gap-3 whitespace-pre-line break-words text-[14px] leading-7 text-[#4F4941]"
                        >
                          <span className="shrink-0 font-semibold text-[#9A7839]">
                            {index + 1}.
                          </span>

                          <span>{nuggetText(action)}</span>
                        </li>
                      ),
                    )}
                  </ol>
                </section>
              )}

            <Link
              href={`/nugget/${nugget.slug}`}
              className="mt-10 inline-flex items-center text-[13px] font-semibold text-[#9A7839] transition hover:text-[#6F5224]"
            >
              ← Back to Nugget
            </Link>
          </article>

          <aside className="self-start lg:sticky lg:top-24">
            <div className="border border-[#BCA46E] bg-[#F8F3EA] p-5">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#15120E]">
                My Study Notes
              </h2>

              <p className="mt-3 text-[13px] leading-5 text-[#756E64]">
                Take this in, then act. Write what you must execute each week instead of buying the next prosperity read.
              </p>

              <label
                htmlFor="study-notes"
                className="sr-only"
              >
                My study notes
              </label>

              <textarea
                id="study-notes"
                rows={7}
                placeholder="Write your notes here..."
                className="mt-4 w-full resize-none border border-[#BCA46E] bg-[#F5F0E8] p-3 text-[13px] leading-5 text-[#15120E] outline-none placeholder:text-[#9B9388] focus:border-[#9A7839]"
              />
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#DDD2C0] bg-[#F5F0E8]">
        <div className="mx-auto flex min-h-[82px] max-w-[1180px] items-center gap-5 px-5 sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-3 sm:w-[270px]">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded">
              <Image
                src="/images/musical.png"
                alt=""
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate font-serif text-[13px] font-semibold text-[#15120E]">
                The Joseph Storage Blueprint
              </p>

              <p className="mt-1 truncate text-[11px] text-[#756E64]">
                Genesis 41 · Strategic Reserve
              </p>
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 flex-col items-center md:flex">
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Shuffle"
                className="text-[#756E64] transition hover:text-[#15120E]"
              >
                <Shuffle size={14} />
              </button>

              <button
                type="button"
                aria-label="Previous track"
                className="text-[#756E64] transition hover:text-[#15120E]"
              >
                <SkipBack size={15} />
              </button>

              <button
                type="button"
                aria-label="Play"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8A35A] text-[#15120E]"
              >
                <Play
                  size={14}
                  fill="currentColor"
                />
              </button>

              <button
                type="button"
                aria-label="Next track"
                className="text-[#756E64] transition hover:text-[#15120E]"
              >
                <SkipForward size={15} />
              </button>

              <button
                type="button"
                aria-label="Repeat"
                className="text-[#756E64] transition hover:text-[#15120E]"
              >
                <Repeat2 size={14} />
              </button>
            </div>

            <div className="mt-2 flex w-full max-w-[520px] items-center gap-3">
              <span className="text-[10px] text-[#8A8175]">
                01:45
              </span>

              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[#D8CDBB]">
                <div className="h-full w-[38%] rounded-full bg-[#C8A35A]" />
              </div>

              <span className="text-[10px] text-[#8A8175]">
                {nugget.duration || "06:42"}
              </span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Play"
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8A35A] text-[#15120E] md:hidden"
          >
            <Play
              size={15}
              fill="currentColor"
            />
          </button>

          <div className="hidden items-center justify-end gap-4 sm:w-[150px] md:flex">
            <Volume2
              size={15}
              className="text-[#756E64]"
            />

            <button
              type="button"
              aria-label="Full screen"
              className="text-[#756E64] transition hover:text-[#15120E]"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}