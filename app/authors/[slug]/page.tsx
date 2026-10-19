import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  Music2,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

import {
  getAuthorBySlug,
} from "@/lib/authors";

type AuthorDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AuthorDetailsPage({
  params,
}: AuthorDetailsPageProps) {
  const { slug } =
    await params;

  const author =
    getAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
        {/* BACK */}

        <Link
          href="/authors"
          className="inline-flex items-center gap-2 text-[10px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
        >
          <ArrowLeft
            size={12}
          />

          Authors &amp;
          Creators
        </Link>

        {/* AUTHOR HEADER */}

        <section className="mt-7 rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
            {
              author.roleLabel
            }
          </p>

          <h1 className="mt-3 font-serif text-[40px] leading-tight">
            {author.name}
          </h1>

          <p className="mt-5 max-w-[850px] text-[12px] leading-6 text-white/40">
            {
              author.description
            }
          </p>
        </section>

        {/* ABOUT */}

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
              About the Creator
            </p>

            <h2 className="mt-3 font-serif text-[28px]">
              Creative Contribution
            </h2>

            <p className="mt-4 text-[11px] leading-6 text-white/40">
              {author.bio}
            </p>
          </article>

          <aside className="rounded-[10px] border border-[#C8A35A]/30 bg-[#C8A35A]/[0.08] p-5 sm:p-6">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
              Credit Note
            </p>

            <p className="mt-4 text-[11px] leading-6 text-white/45">
              Credits on Business
              Nuggets identify the
              contribution attached
              to a specific work.
              They should not be
              read as claims about
              roles or credentials
              that are not explicitly
              listed.
            </p>
          </aside>
        </section>

        {/* CREDITED WORKS */}

        <section className="mt-10">
          <h2 className="font-serif text-[28px] leading-tight">
            Credited Works
          </h2>

          <p className="mt-3 text-[11px] leading-6 text-white/35">
            Explore the works where
            {` ${author.name} `}
            is credited.
          </p>

          <div className="mt-6 space-y-4">
            {author.works.map(
              (work) => (
                <Link
                  key={
                    work.title
                  }
                  href={
                    work.href
                  }
                  className="group flex items-center gap-4 rounded-[10px] border border-white/10 bg-[#111111] p-4 transition hover:border-[#C8A35A]/35"
                >
                  <div className="flex h-[58px] w-[72px] shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-[#181818] text-[#C8A35A]">
                    <Music2
                      size={20}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-[16px] leading-5 text-white/90 transition group-hover:text-[#C8A35A]">
                      {
                        work.title
                      }
                    </h3>

                    <p className="mt-1 text-[9px] leading-4 text-white/30">
                      {
                        work.subtitle
                      }
                    </p>
                  </div>

                  <span className="hidden shrink-0 text-[9px] font-medium text-[#C8A35A] sm:block">
                    {
                      work.type
                    }{" "}
                    →
                  </span>
                </Link>
              ),
            )}
          </div>
        </section>

        {/* BOTTOM LINKS */}

        <section className="mt-10 rounded-[10px] border border-white/10 bg-[#111111] p-5">
          <div className="flex flex-wrap gap-5">
            <Link
              href="/authors"
              className="text-[9px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              Browse All Authors →
            </Link>

            <Link
              href="/musicals"
              className="text-[9px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              Explore Musicals →
            </Link>

            <Link
              href="/philosophy"
              className="text-[9px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              Our Philosophy →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}