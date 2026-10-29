import cardStyles from "@/app/topic-cards.module.css";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Clock3,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import FollowChallengeButton from "@/components/FollowChallengeButton";

import { getPublishedNuggets } from "@/lib/nuggets-api";
import { getServerMemberToken } from "@/lib/server-member-token";
import { slugify } from "@/lib/nuggets";

import type { Nugget } from "@/types/nugget";

const challengeCopy: Record<
  string,
  { description: string }
> = {
  "Starting a Business": {
    description:
      "Build on a strong foundation with biblical wisdom for planning, stewardship, launch and sustainable growth.",
  },
  "Money & Cashflow Problems": {
    description:
      "In times of market instability or cash access constraints, Scripture commands strategic prudence, debt management and structural agility. Explore curated biblical blueprints for navigating capital struggles.",
  },
  "Managing Difficult People": {
    description:
      "Explore biblical principles for accountability, communication, boundaries, delegation and healthier working relationships.",
  },
  "Strategic Decision Making": {
    description:
      "Approach important decisions with biblical wisdom for counsel, risk, preparation, timing and long-term thinking.",
  },
  "Scaling & Growth Pressures": {
    description:
      "Discover principles for delegation, structure, stewardship and sustainable expansion without losing operational clarity.",
  },
  "Leadership Burnout": {
    description:
      "Explore biblical wisdom for sustainable leadership, rest, delegation, resilience and long-term effectiveness.",
  },
};

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const token = await getServerMemberToken();

  let nuggets: Nugget[] = [];

  try {
    nuggets = await getPublishedNuggets(token);
  } catch (error) {
    console.error(
      "Failed to load challenge Nuggets:",
      error,
    );
  }

  const availableChallenges = [
    ...new Set(
      nuggets.flatMap(
        (nugget) =>
          nugget.challenges ?? [],
      ),
    ),
  ];

  const challenge =
    availableChallenges.find(
      (item) =>
        slugify(item) === slug,
    );

  if (!challenge) {
    notFound();
  }

  const challengeNuggets =
    nuggets.filter((nugget) =>
      nugget.challenges?.includes(
        challenge,
      ),
    );

  const sortedSolutions = [
    ...challengeNuggets,
  ].sort((a, b) => {
    if (a.isGold && !b.isGold) {
      return -1;
    }
    if (!a.isGold && b.isGold) {
      return 1;
    }
    return 0;
  });

  const description =
    challengeCopy[challenge]
      ?.description ??
    `Explore biblical business wisdom and practical marketplace principles for navigating ${challenge.toLowerCase()}.`;

  const relatedChallenges =
    availableChallenges
      .filter(
        (item) =>
          item !== challenge,
      )
      .map((item) => ({
        title: item,
        count: nuggets.filter(
          (nugget) =>
            nugget.challenges?.includes(
              item,
            ),
        ).length,
      }))
      .sort(
        (a, b) =>
          b.count - a.count,
      )
      .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main>
        <section className="border-b border-white/[0.06]">
          <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
            <Link
              href="/library?tab=Challenges"
              className="text-[13px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              ← Challenges
            </Link>

            <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[820px]">
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#C8A35A]">
                  I Need Wisdom About...
                </p>

                <h1 className="bn-hero-title mt-3 font-serif text-[40px] leading-tight text-[#FAF9F6]">
                  {challenge}
                </h1>

                <p className="mt-4 max-w-[800px] text-[14px] leading-7 text-white/50">
                  {description}
                </p>

                <p className="mt-3 text-[13px] text-white/35">
                  {challengeNuggets.length}{" "}
                  {challengeNuggets.length === 1
                    ? "published Nugget"
                    : "published Nuggets"}
                </p>
              </div>

              <FollowChallengeButton challenge={challenge} />
            </div>
          </div>
        </section>

        <section className="bn-challenge-content mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-[28px] leading-tight">
                Curated Blueprint Solutions
              </h2>

              <p className="mt-2 text-[14px] leading-6 text-white/45">
                Biblical strategies selected for this marketplace challenge.
              </p>
            </div>
          </div>

          {sortedSolutions.length > 0 ? (
            <div role="region" aria-label="Challenge Nuggets" tabIndex={0} className={`mt-7 ${cardStyles.grid} ${cardStyles.nuggets} ${cardStyles.fourColumns}`}>
              {sortedSolutions.map((nugget) => (
                <Link
                  key={nugget.slug}
                  href={`/nugget/${nugget.slug}`}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111111] transition hover:border-[#C8A35A]/45"
                >
                  <div className="relative h-[165px] shrink-0 overflow-hidden">
                    <Image
                      src={nugget.image}
                      alt={nugget.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />

                    {nugget.isGold && (
                      <span className="absolute right-3 top-3 rounded border border-[#C8A35A]/50 bg-[#080808]/90 px-2.5 py-1.5 text-[12px] font-semibold text-[#E0C48A]">
                        GOLD
                      </span>
                    )}
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 line-clamp-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#C8A35A]">
                        {nugget.tag || nugget.topic}
                      </span>

                      <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-white/35">
                        <Clock3 size={13} />
                        {nugget.duration}
                      </span>
                    </div>

                    <h3 className="bn-topic-card-title mt-3 line-clamp-2 break-words font-serif">
                      {nugget.title}
                    </h3>

                    <p className="mt-3 text-[13px] leading-5 text-white/40">
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
              <h3 className="font-serif text-[20px]">
                No solutions published yet
              </h3>

              <p className="mt-2 text-[14px] text-white/45">
                Nuggets associated with this challenge will appear here automatically.
              </p>
            </div>
          )}

          {relatedChallenges.length > 0 && (
            <section className="mt-12 border-t border-white/[0.06] pt-10">
              <h2 className="font-serif text-[28px]">
                Related Marketplace Challenges
              </h2>

              <p className="mt-2 text-[14px] text-white/45">
                Explore other business situations covered by the Wisdom Archive.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {relatedChallenges.map((item) => (
                  <Link
                    key={item.title}
                    href={`/challenges/${slugify(item.title)}`}
                    className="bn-button group inline-flex items-center gap-3 rounded-lg border border-white/10 bg-[#111111] px-4 py-3 transition hover:border-[#C8A35A]/45"
                  >
                    <span className="text-[13px] text-white/65 transition group-hover:text-white">
                      {item.title}
                    </span>

                    <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[11px] text-white/35">
                      {item.count}
                    </span>

                    <ArrowRight
                      size={13}
                      className="text-[#C8A35A]"
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
