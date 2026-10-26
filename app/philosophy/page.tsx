import Link from "next/link";

import InformationLayout from "@/components/InformationLayout";

export default function PhilosophyPage() {
  return (
    <InformationLayout
      eyebrow="About"
      title="Our Philosophy"
      introduction="Timeless Biblical Wisdom for Today's Marketplace."
    >
        {/* HERO PHILOSOPHY */}

        <section className="mt-10">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#C8A35A]">
            Wisdom Before Action
          </p>

          <h2 className="mt-5 max-w-[720px] font-serif text-[34px] leading-[1.08] sm:text-[40px]">
            Ancient principles.
            Thoughtful decisions.
            Responsible business.
          </h2>

          <p className="mt-5 max-w-[850px] text-[12px] leading-6 text-white/40">
            Business Nuggets from
            the Bible connects
            biblical teaching with
            the questions executives
            face: how to lead,
            steward resources, plan
            wisely and act with
            character. The aim is
            reflection that informs
            responsible action—not a
            shortcut to success.
          </p>
        </section>

        {/* SCRIPTURE */}

        <section className="mt-8 rounded-[10px] border border-[#C8A35A]/45 bg-[#111111] px-6 py-6 sm:px-7">
          <blockquote className="font-serif text-[18px] italic leading-7 text-white/85 sm:text-[20px]">
            “A false balance is an
            abomination to the Lord,
            but a just weight is his
            delight.”
          </blockquote>

          <p className="mt-4 text-[9px] uppercase tracking-[0.08em] text-[#C8A35A]">
            Proverbs 11:1
          </p>
        </section>

        {/* PRINCIPLES */}

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h3 className="font-serif text-[18px]">
              Read Scripture in Context
            </h3>

            <p className="mt-4 text-[11px] leading-6 text-white/40">
              Begin with the
              passage, its setting
              and its meaning.
              Business application
              should remain
              distinguishable from
              the biblical text.
            </p>
          </article>

          <article className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h3 className="font-serif text-[18px]">
              Steward Resources Responsibly
            </h3>

            <p className="mt-4 text-[11px] leading-6 text-white/40">
              Treat capital, time and
              entrusted work as
              responsibilities.
              Consider risks,
              obligations and the
              people affected by each
              decision.
            </p>
          </article>

          <article className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h3 className="font-serif text-[18px]">
              Lead with Integrity
            </h3>

            <p className="mt-4 text-[11px] leading-6 text-white/40">
              Honest measures and
              transparent terms
              matter. Seek fairness
              in agreements,
              accountability in
              leadership and respect
              in relationships.
            </p>
          </article>
        </section>

        {/* DISCERNMENT */}

        <section className="mt-10">
          <h2 className="font-serif text-[28px]">
            Apply with Discernment
          </h2>

          <p className="mt-4 max-w-[850px] text-[11px] leading-6 text-white/40">
            Commentary and cinematic
            musicals offer ways to
            explore a principle. They
            do not replace Scripture,
            professional advice or
            your responsibility to
            evaluate a decision.
            Consult qualified legal,
            financial or other
            advisers where
            appropriate, and do not
            interpret a teaching as a
            promise of commercial
            results.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/library"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#C8A35A] px-5 text-[10px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
            >
              Explore the Wisdom Archive
            </Link>

            <Link
              href="/scripture"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 bg-[#111111] px-5 text-[10px] text-white/65 transition hover:border-[#C8A35A]/35 hover:text-[#C8A35A]"
            >
              Browse Scripture Index
            </Link>
          </div>
        </section>
    </InformationLayout>
  );
}