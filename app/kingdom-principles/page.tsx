import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Coins,
  Compass,
  Scale,
  Sparkles,
  Users,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

import { getPublishedNuggets } from "@/lib/nuggets-api";
import { slugify } from "@/lib/nuggets";

const principleDetails = {
  "Integrity & Character": {
    label: "Integrity",
    description:
      "Build businesses where truth, fairness and character shape decisions, negotiations and reputation.",
    icon: Scale,
    number: "01",
  },

  "Money & Stewardship": {
    label: "Stewardship",
    description:
      "Manage capital, resources and opportunity with discipline, responsibility and long-term wisdom.",
    icon: Coins,
    number: "02",
  },

  "Leadership & Governance": {
    label: "Leadership",
    description:
      "Lead people and organizations with accountability, structure, service and sound governance.",
    icon: Users,
    number: "03",
  },

  "Strategy & Planning": {
    label: "Strategy",
    description:
      "Make thoughtful decisions, evaluate opportunities and prepare your business for what lies ahead.",
    icon: Compass,
    number: "04",
  },
} as const;

export default async function KingdomPrinciplesPage() {
  const nuggets = await getPublishedNuggets();

  const availablePrinciples = Object.entries(
    principleDetails,
  )
    .map(([topic, details]) => {
      const topicNuggets = nuggets.filter(
        (nugget) => nugget.topic === topic,
      );

      return {
        topic,
        ...details,
        count: topicNuggets.length,
        featuredNugget: topicNuggets[0],
      };
    })
    .filter((principle) => principle.count > 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/10">
          {/* subtle gold glow */}
          <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[#C8A35A]/10 blur-[120px]" />

          <div className="relative mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#C8A35A]/20 bg-[#C8A35A]/5 px-4 py-2">
                <Sparkles
                  size={14}
                  className="text-[#E0C48A]"
                />

                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E0C48A]">
                  Biblical Business Foundations
                </span>
              </div>

              <h1 className="mt-7 font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-7xl">
                Kingdom Principles
                <span className="block text-[#C8A35A]">
                  for the Marketplace
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#FAF9F6]/60 sm:text-base">
                Explore timeless principles from Scripture and
                discover how they apply to leadership,
                stewardship, strategy, character and everyday
                business decisions.
              </p>

              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link
                  href="#principles"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#C8A35A] px-6 text-sm font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                >
                  Explore the Principles
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/scripture-index"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/15 px-6 text-sm text-[#FAF9F6]/80 transition hover:border-[#C8A35A]/60 hover:text-[#E0C48A]"
                >
                  <BookOpen size={16} />
                  Scripture Index
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PRINCIPLES */}
        <section
          id="principles"
          className="border-b border-white/10"
        >
          <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C8A35A]">
                  Core Frameworks
                </p>

                <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
                  Principles that shape how you build
                </h2>
              </div>

              <p className="max-w-md text-sm leading-6 text-[#FAF9F6]/45">
                Each pathway brings together published
                Business Nuggets around one foundational area.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {availablePrinciples.map((principle) => {
                const Icon = principle.icon;

                return (
                  <Link
                    key={principle.topic}
                    href={`/topics/${slugify(
                      principle.topic,
                    )}`}
                    className="group relative min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#C8A35A]/50 sm:p-8"
                  >
                    <div className="absolute right-6 top-3 font-serif text-[90px] leading-none text-white/[0.025]">
                      {principle.number}
                    </div>

                    <div className="relative flex h-full flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#C8A35A]/25 bg-[#C8A35A]/10">
                          <Icon
                            size={20}
                            className="text-[#E0C48A]"
                          />
                        </div>

                        <span className="text-xs text-[#8A8781]">
                          {principle.count} Nugget
                          {principle.count === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="mt-auto pt-14">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C8A35A]">
                          {principle.label}
                        </p>

                        <h3 className="mt-3 font-serif text-3xl">
                          {principle.topic}
                        </h3>

                        <p className="mt-4 max-w-lg text-sm leading-7 text-[#FAF9F6]/50">
                          {principle.description}
                        </p>

                        <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[#E0C48A]">
                          Explore pathway

                          <ArrowRight
                            size={15}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-b border-white/10 bg-[#0B0B0B]">
          <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C8A35A]">
                Learn. Reflect. Apply.
              </p>

              <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
                Turn wisdom into practice
              </h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#111111] p-7">
                <span className="font-serif text-3xl text-[#C8A35A]">
                  01
                </span>

                <h3 className="mt-8 font-serif text-2xl">
                  Discover
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#FAF9F6]/50">
                  Start with a business challenge, principle
                  or Scripture that speaks to where you are.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#111111] p-7">
                <span className="font-serif text-3xl text-[#C8A35A]">
                  02
                </span>

                <h3 className="mt-8 font-serif text-2xl">
                  Understand
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#FAF9F6]/50">
                  Read the biblical principle and see how it
                  translates into modern marketplace thinking.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#111111] p-7">
                <span className="font-serif text-3xl text-[#C8A35A]">
                  03
                </span>

                <h3 className="mt-8 font-serif text-2xl">
                  Apply
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#FAF9F6]/50">
                  Use the practical action points to move the
                  wisdom from inspiration into your business.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SCRIPTURE CTA */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#111111] lg:grid-cols-[0.9fr_1.1fr]">
              <div className="flex items-center justify-center border-b border-white/10 p-12 lg:border-b-0 lg:border-r">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border border-[#C8A35A]/20 bg-[#C8A35A]/5">
                  <BookOpen
                    size={48}
                    strokeWidth={1.2}
                    className="text-[#E0C48A]"
                  />
                </div>
              </div>

              <div className="p-7 sm:p-10 lg:p-14">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C8A35A]">
                  Start with Scripture
                </p>

                <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
                  Explore the wisdom behind the principles.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-[#FAF9F6]/50">
                  Browse Business Nuggets by biblical book and
                  passage to discover the marketplace insight
                  connected to each Scripture.
                </p>

                <Link
                  href="/scripture-index"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[#E0C48A]"
                >
                  Open Scripture Index
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ACCESS CTA */}
        <section>
          <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="relative overflow-hidden rounded-3xl border border-[#C8A35A]/25 bg-[#111111] px-6 py-12 text-center sm:px-10 lg:py-16">
              <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 bg-[#C8A35A]/10 blur-[90px]" />

              <div className="relative mx-auto max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C8A35A]">
                  Continue the Journey
                </p>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl">
                  Build your business on wisdom that lasts.
                </h2>

                <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#FAF9F6]/50">
                  Explore the library and unlock deeper access
                  to the Business Nuggets experience when
                  you&apos;re ready.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/library"
                    className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/15 px-6 text-sm text-[#FAF9F6] transition hover:border-[#C8A35A]/60"
                  >
                    Explore Library
                  </Link>

                  <Link
                    href="/get-access"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#C8A35A] px-6 text-sm font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                  >
                    Get Access
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}