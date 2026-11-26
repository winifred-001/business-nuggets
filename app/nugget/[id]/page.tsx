import FormattedNuggetText from "@/components/FormattedNuggetText";
import Image from "next/image";
import { displayTopicName } from "@/lib/topic-display";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Share2 } from "lucide-react";
import NuggetLibraryActions from "@/components/NuggetLibraryActions";
import AudioBar from "@/components/AudioBar";

import Navbar from "@/components/navbar";
import PremiumNuggetGate from "@/components/PremiumNuggetGate";
import NuggetAccessExpiryGate from "@/components/NuggetAccessExpiryGate";
import NuggetAccessLimitGate from "@/components/NuggetAccessLimitGate";
import NuggetAnalyticsTracker from "@/components/analytics/NuggetAnalyticsTracker";
import {
  getNuggetBySlugFromApi,
  requiresPremiumNuggetPreview,
  PremiumRequiredError,
  NuggetAccessError,
} from "@/lib/nuggets-api";
import {
  getServerMemberToken,
} from "@/lib/server-member-token";

export default async function NuggetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token =
    await getServerMemberToken();

  if (await requiresPremiumNuggetPreview(id, token)) {
    return <PremiumNuggetGate previewLimit guest={!token} />;
  }

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

    if (error instanceof NuggetAccessError) {
      return <NuggetAccessLimitGate message={error.message} code={error.code} />;
    }

    throw error;
  }

  if (!nugget) {
    notFound();
  }

  return (
    <NuggetAccessExpiryGate expiresAt={nugget.accessExpiresAt} durationHours={nugget.accessDurationHours} restored={nugget.accessRestored} grace={nugget.accessInGrace}>
    <div className="min-h-screen bg-[#F5F0E8] text-[#211E19]">
     <NuggetAnalyticsTracker nuggetId={nugget.id}/>
      <Navbar />

      <main>
        {/* HERO */}
        <section className="relative isolate min-h-[350px] overflow-hidden border-b border-white/[0.06]">
          <Image src={nugget.image || "/media-placeholder.svg"} alt="" fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/35 via-[#080808]/15 to-[#080808]/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/35 via-transparent to-transparent" />
          <div className="relative mx-auto flex min-h-[350px] max-w-[1280px] items-end px-5 pb-12 sm:px-8 lg:px-10">
            <div className="max-w-[950px]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#E28906]">
                Nugget #{nugget.number} · {displayTopicName(nugget.topic)}
              </p>

              <h1 className="bn-hero-title mt-4 max-w-[1000px] font-serif text-[40px] leading-[1.08] text-[#FAF9F6]">
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
                  <FormattedNuggetText className="font-serif whitespace-pre-line break-words text-[18px] italic leading-8 text-[#FAF9F6]/80" text={`“${nugget.scriptureText}”`} />

                  <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#E28906]">
                    {nugget.scriptureRef}
                  </p>
                </blockquote>
              )}

              {/* TABS */}
              <div className="mt-8 flex gap-7 overflow-x-auto border-b border-black/15">
                <Link
                  href={`/nugget/${nugget.slug}`}
                  className="relative shrink-0 pb-4 text-[13px] font-medium text-[#79500A]"
                >
                  Read Wisdom

                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#E28906]" />
                </Link>


              </div>

              {/* KEY PRINCIPLE */}
              <section className="pt-8">
                <h2 className="bn-nugget-section-title font-serif text-[20px] leading-tight text-[#211E19]">
                  Key Principles
                </h2>

                <FormattedNuggetText preview className="mt-4 whitespace-pre-line break-words text-[14px] leading-7 text-[#4F4941]" text={nugget.keyPrinciple ||
                    "Commentary for this Nugget will be added soon."} />
              </section>

              {/* MARKETPLACE APPLICATION */}
              {nugget.marketplaceApplication && (
                <section className="pt-9">
                  <h2 className="bn-nugget-section-title font-serif text-[20px] leading-tight text-[#211E19]">
                    Marketplace Application
                  </h2>

                  <FormattedNuggetText preview className="mt-4 whitespace-pre-line break-words text-[14px] leading-7 text-[#4F4941]" text={nugget.marketplaceApplication} />
                </section>
              )}

              <Link
                href={`/nugget/${nugget.slug}/reader`}
                className="bn-button mt-8 inline-flex rounded-lg border border-[#E28906]/40 px-5 py-3 text-[13px] font-semibold text-[#79500A] transition hover:bg-[#E28906]/10 hover:text-[#79500A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E28906]"
              >
                Read full teaching →
              </Link>
            </div>

            {/* RIGHT ACTIONS */}
            <aside className="min-w-0 self-start space-y-3 lg:sticky lg:top-24">
              <div className="rounded-xl border border-white/10 bg-[#111111] p-5 text-[#f9f5ed]">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#FAF9F6]">
                Nugget Actions
              </h2>

              <div className="mt-5 space-y-2">
                <NuggetLibraryActions key={nugget.slug} id={nugget.id} slug={nugget.slug} />

                <Link
  href={`/share-nugget/${nugget.slug}`}
  className="bn-button flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[14px] text-white/65 transition hover:bg-white/[0.04] hover:text-[#E28906]"
>
  <Share2
    size={16}
    className="text-[#E28906]"
  />

  Share Commentary
</Link>
              </div>
              </div>
                <div key={nugget.slug} data-nugget-audio-stack className="grid w-full min-w-0 grid-cols-1 gap-3">
                  <AudioBar
                    compact
                    trackKind="nugget"
                    title={nugget.title}
                    subtitle={`${nugget.scriptureRef} · ${displayTopicName(nugget.topic)}`}
                    audioSrc={nugget.nuggetAudioUrl || null}
                    slug={nugget.slug}
                    coverImage={nugget.image}
                  />
                  <AudioBar
                    compact
                    trackKind="music"
                    title={nugget.title}
                    subtitle={`${nugget.scriptureRef} · ${displayTopicName(nugget.topic)}`}
                    audioSrc={nugget.musicalAudioUrl || nugget.audioUrl || null}
                    coverImage={nugget.image}
                    slug={nugget.slug}
                  />
                </div>
            </aside>
          </div>
        </section>
      </main>


    </div>
    </NuggetAccessExpiryGate>
  );
}
