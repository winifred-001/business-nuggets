import ReaderStudyNotes from "@/components/ReaderStudyNotes";
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
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_270px]">
          <article className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#E28906]">
              Nugget #{nugget.number} · {nugget.topic}
            </p>

            <h1 className="bn-hero-title mt-3 max-w-[800px] font-serif text-[40px] leading-[1.05] text-[#15120E]">
              {nugget.title}
            </h1>

            {nugget.scriptureText && (
              <blockquote className="mt-6 max-w-[800px] border-l-2 border-[#E28906] pl-5">
                <FormattedNuggetText className="font-serif whitespace-pre-line break-words text-[18px] italic leading-8 text-[#655D53]" text={`“${nugget.scriptureText}”`} />

                <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#E28906]">
                  {nugget.scriptureRef}
                </p>
              </blockquote>
            )}

            <section className="mt-9">
              <h2 className="bn-nugget-section-title font-serif text-[20px] leading-tight text-[#15120E]">
                Key Principles and Boundaries
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

            {nugget.details && (
              <section className="mt-9">
                <h2 className="bn-nugget-section-title font-serif text-[20px] leading-tight text-[#15120E]">Explanation: Full Biblical Context and Teaching</h2>
                <FormattedNuggetText className="mt-4 max-w-[820px] whitespace-pre-line break-words text-[14px] leading-7 text-[#4F4941]" text={nugget.details} />
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
                          <span className="shrink-0 font-semibold text-[#E28906]">
                            {index + 1}.
                          </span>

                          <FormattedNuggetText text={action} />
                        </li>
                      ),
                    )}
                  </ol>
                </section>
              )}

            {nugget.challenges?.length > 0 && (
              <section className="mt-9">
                <h2 className="bn-nugget-section-title font-serif text-[20px] leading-tight text-[#15120E]">Challenges &amp; Reflection</h2>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-[14px] leading-7 text-[#4F4941]">
                  {nugget.challenges.map((prompt, index) => <li key={index}><FormattedNuggetText text={prompt} /></li>)}
                </ul>
              </section>
            )}

            <Link
              href={`/nugget/${nugget.slug}`}
              className="mt-10 inline-flex items-center text-[13px] font-semibold text-[#E28906] transition hover:text-[#6F5224]"
            >
              ← Back to Nugget
            </Link>
          </article>

          <aside className="self-start lg:sticky lg:top-24">
            <ReaderStudyNotes key={nugget.id} nuggetId={nugget.id} title={nugget.title} slug={nugget.slug} />
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