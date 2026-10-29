import FormattedNuggetText from "@/components/FormattedNuggetText";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReaderAudioBar from "@/components/ReaderAudioBar";

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
                <FormattedNuggetText className="font-serif whitespace-pre-line break-words text-[18px] italic leading-8 text-[#655D53]" text={`“${nugget.scriptureText}”`} />

                <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#9A7839]">
                  {nugget.scriptureRef}
                </p>
              </blockquote>
            )}

            {nugget.details && (
              <section className="mt-9">
                <h2 className="bn-nugget-section-title font-serif text-[20px] leading-tight text-[#15120E]">Explanation</h2>
                <FormattedNuggetText className="mt-4 max-w-[820px] whitespace-pre-line break-words text-[14px] leading-7 text-[#4F4941]" text={nugget.details} />
              </section>
            )}

            <section className="mt-9">
              <h2 className="bn-nugget-section-title font-serif text-[20px] leading-tight text-[#15120E]">
                Key Principles
              </h2>

              <FormattedNuggetText className="mt-4 max-w-[820px] whitespace-pre-line break-words text-[14px] leading-7 text-[#4F4941]" text={nugget.keyPrinciple ||
                  "Commentary for this Nugget will be added soon."} />
            </section>

            {nugget.marketplaceApplication && (
              <section className="mt-9">
                <h2 className="bn-nugget-section-title font-serif text-[20px] leading-tight text-[#15120E]">
                  Marketplace Application
                </h2>

                <FormattedNuggetText className="mt-4 max-w-[820px] whitespace-pre-line break-words text-[14px] leading-7 text-[#4F4941]" text={nugget.marketplaceApplication} />
              </section>
            )}

            {nugget.practicalActionPlan &&
              nugget.practicalActionPlan.length > 0 && (
                <section className="mt-9">
                  <h2 className="bn-nugget-section-title font-serif text-[20px] leading-tight text-[#15120E]">
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

                          <FormattedNuggetText text={action} />
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

      <ReaderAudioBar
        key={`${nugget.slug}-${nugget.nuggetAudioUrl || ""}`}
        title={nugget.title}
        subtitle={`${nugget.scriptureRef} · ${nugget.topic}`}
        slug={nugget.slug}
        coverImage={nugget.image}
        audioSrc={nugget.nuggetAudioUrl || null}
      />
    </div>
  );
}