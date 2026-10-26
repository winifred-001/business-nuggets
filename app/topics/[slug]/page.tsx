import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Clock3,
  Headphones,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import FollowTopicButton from "@/components/FollowTopicButton";

import { getPublishedNuggets } from "@/lib/nuggets-api";
import { getServerMemberToken } from "@/lib/server-member-token";
import { slugify } from "@/lib/nuggets";

import type { Nugget } from "@/types/nugget";

export default async function TopicDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    segment?: string | string[];
  }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const token = await getServerMemberToken();

  let nuggets: Nugget[] = [];

  try {
    nuggets = await getPublishedNuggets(token);
  } catch (error) {
    console.error(
      "Failed to load topic Nuggets:",
      error,
    );
  }

  const availableTopics = [
    ...new Set(
      nuggets
        .map((nugget) => nugget.topic)
        .filter(Boolean),
    ),
  ];

  const topic = availableTopics.find(
    (item) => slugify(item) === slug,
  );

  if (!topic) {
    notFound();
  }

  const topicNuggets = nuggets.filter(
    (nugget) => nugget.topic === topic,
  );

  const featured =
    topicNuggets.find(
      (nugget) => nugget.isGold,
    ) ?? topicNuggets[0] ?? null;

  const segments = [
    ...new Set(
      topicNuggets
        .map((nugget) => nugget.tag)
        .filter(Boolean),
    ),
  ];

  const selectedSegment =
    typeof query.segment === "string"
      ? query.segment
      : "";

  const displayedNuggets = selectedSegment
    ? topicNuggets.filter(
        (nugget) =>
          nugget.tag === selectedSegment,
      )
    : topicNuggets;

  const heroImage =
    featured?.image ??
    topicNuggets[0]?.image ??
    "/images/visiting-homepage2.png";

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main>
        <section className="relative min-h-[330px] overflow-hidden border-b border-white/[0.06]">
          <Image
            src={heroImage}
            alt={topic}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-black/65" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/95 via-[#080808]/65 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />

          <div className="relative mx-auto flex min-h-[330px] max-w-[1280px] items-center px-5 py-12 sm:px-8 lg:px-10">
            <div className="w-full">
              <Link
                href="/library?tab=Topics+Index"
                className="text-[13px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
              >
                ← Core Wisdom Pathway
              </Link>

              <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-[760px]">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#C8A35A]">
                    Core Wisdom Pathway
                  </p>

                  <h1 className="bn-hero-title mt-3 font-serif text-[40px] leading-tight text-white">
                    {topic}
                  </h1>

                  <p className="mt-4 max-w-[700px] text-[14px] leading-6 text-white/55">
                    Explore biblical business wisdom, practical principles and marketplace applications connected to {topic}.
                  </p>

                  <p className="mt-3 text-[13px] text-white/40">
                    {topicNuggets.length}{" "}
                    {topicNuggets.length === 1
                      ? "published Nugget"
                      : "published Nuggets"}
                  </p>
                </div>

                <FollowTopicButton topic={topic} />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-10">
          {featured && (
            <section>
              <h2 className="font-serif text-[28px]">
                Featured {topic} Wisdom
              </h2>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="overflow-hidden rounded-xl border border-[#C8A35A]/55 bg-[#111111]">
                  <div className="grid md:grid-cols-[270px_minmax(0,1fr)]">
                    <div className="relative min-h-[250px]">
                      <Image
                        src={featured.image}
                        alt={featured.title}
                        fill
                        sizes="270px"
                        className="object-cover"
                      />

                      {featured.isGold && (
                        <span className="absolute right-3 top-3 rounded border border-[#C8A35A]/50 bg-[#080808]/90 px-2.5 py-1.5 text-[12px] font-semibold text-[#E0C48A]">
                          GOLD
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col justify-center p-6 lg:p-7">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                        Featured Wisdom · {featured.scriptureRef}
                      </p>

                      <h3 className="mt-3 max-w-[520px] font-serif text-[24px] leading-tight">
                        {featured.title}
                      </h3>

                      {featured.keyPrinciple && (
                        <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-white/45">
                          {featured.keyPrinciple}
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/nugget/${featured.slug}/audio`}
                          className="bn-button inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#C8A35A] px-5 text-[13px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                        >
                          <Headphones size={15} />
                          Listen Audio
                        </Link>

                        <Link
                          href={`/nugget/${featured.slug}`}
                          className="bn-button inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-5 text-[13px] font-medium text-white transition hover:border-[#C8A35A]/50"
                        >
                          Read Commentary
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="self-start rounded-xl border border-white/10 bg-[#111111] p-5">
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em]">
                    Subtopics & Segments
                  </h3>

                  <div className="mt-4 space-y-2">
                    <Link
                      href={`/topics/${slug}`}
                      className={`bn-button ${`block rounded-md border px-3 py-2.5 text-[13px] transition ${
                        !selectedSegment
                          ? "border-[#C8A35A]/45 bg-[#C8A35A]/10 text-[#C8A35A]"
                          : "border-white/10 bg-[#161616] text-white/50 hover:border-[#C8A35A]/30"
                      }`}`}
                    >
                      All {topic}
                    </Link>

                    {segments.map((segment) => (
                      <Link
                        key={segment}
                        href={`/topics/${slug}?segment=${encodeURIComponent(segment)}`}
                        className={`bn-button ${`block rounded-md border px-3 py-2.5 text-[13px] transition ${
                          selectedSegment === segment
                            ? "border-[#C8A35A]/45 bg-[#C8A35A]/10 text-[#C8A35A]"
                            : "border-white/10 bg-[#161616] text-white/50 hover:border-[#C8A35A]/30 hover:text-white"
                        }`}`}
                      >
                        {segment}
                      </Link>
                    ))}
                  </div>
                </aside>
              </div>
            </section>
          )}

          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-[28px]">
                  {selectedSegment
                    ? `${selectedSegment} Nuggets`
                    : `All ${topic} Nuggets`}
                </h2>

                <p className="mt-2 text-[14px] text-white/45">
                  {displayedNuggets.length}{" "}
                  {displayedNuggets.length === 1
                    ? "Nugget"
                    : "Nuggets"}{" "}
                  available
                </p>
              </div>

              {selectedSegment && (
                <Link
                  href={`/topics/${slug}`}
                  className="text-[13px] font-medium text-[#C8A35A]"
                >
                  Clear segment
                </Link>
              )}
            </div>

            {displayedNuggets.length > 0 ? (
              <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {displayedNuggets.map((nugget) => (
                  <Link
                    key={nugget.slug}
                    href={`/nugget/${nugget.slug}`}
                    className="group overflow-hidden rounded-xl border border-white/10 bg-[#111111] transition hover:border-[#C8A35A]/45"
                  >
                    <div className="relative h-[185px] overflow-hidden">
                      <Image
                        src={nugget.image}
                        alt={nugget.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />

                      {nugget.isGold && (
                        <span className="absolute right-3 top-3 rounded border border-[#C8A35A]/50 bg-[#080808]/90 px-2.5 py-1.5 text-[12px] font-semibold text-[#E0C48A]">
                          GOLD
                        </span>
                      )}
                    </div>

                    <div className="flex min-h-[190px] flex-col p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#C8A35A]">
                          {nugget.tag}
                        </span>

                        <span className="flex items-center gap-1.5 text-[13px] text-white/35">
                          <Clock3 size={13} />
                          {nugget.duration}
                        </span>
                      </div>

                      <h3 className="mt-3 font-serif text-[19px] leading-[1.2]">
                        {nugget.title}
                      </h3>

                      <p className="mt-3 text-[13px] text-white/40">
                        {nugget.scriptureRef}
                      </p>

                      <span className="mt-auto inline-flex items-center gap-2 pt-5 text-[13px] font-medium text-[#C8A35A]">
                        Listen & Read
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-xl border border-white/10 bg-[#111111] p-8 text-center">
                <p className="text-[14px] text-white/50">
                  No published Nuggets are available in this segment yet.
                </p>
              </div>
            )}
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}
