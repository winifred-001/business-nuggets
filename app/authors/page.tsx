import Link from "next/link";

import {
  ArrowRight,
  Music2,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

import {
  authors,
} from "@/lib/authors";

export default function AuthorsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
        {/* BACK */}

        <Link
          href="/"
          className="text-[10px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
        >
          ← Home
        </Link>

        {/* HEADER */}

        <section className="mt-3">
          <h1 className="font-serif text-[40px] leading-tight">
            Authors &amp; Creators
          </h1>

          <p className="mt-3 text-[13px] leading-6 text-white/40">
            Discover the named
            creators behind the
            platform&apos;s cinematic
            wisdom works.
          </p>
        </section>

        {/* AUTHORS */}

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          {authors.map(
            (author) => (
              <article
                key={
                  author.slug
                }
                className="rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6"
              >
                <h2 className="font-serif text-[20px]">
                  {
                    author.name
                  }
                </h2>

                <p className="mt-4 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                  {
                    author.roleLabel
                  }
                </p>

                <p className="mt-4 text-[11px] leading-6 text-white/40">
                  {
                    author.description
                  }
                </p>

                {/* WORKS */}

                <div className="mt-5 space-y-3">
                  {author.works
                    .slice(
                      0,
                      1,
                    )
                    .map(
                      (
                        work,
                      ) => (
                        <Link
                          key={
                            work.title
                          }
                          href={
                            work.href
                          }
                          className="group flex items-center gap-4 rounded-[8px] border border-white/10 bg-[#0C0C0C] p-3 transition hover:border-[#C8A35A]/35"
                        >
                          <div className="flex h-[52px] w-[62px] shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-[#181818] text-[#C8A35A]">
                            <Music2
                              size={
                                19
                              }
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-serif text-[14px] leading-5 text-white/90">
                              {
                                work.title
                              }
                            </h3>

                            <p className="mt-1 text-[8px] leading-4 text-white/30">
                              {
                                work.subtitle
                              }
                            </p>
                          </div>

                          <span className="hidden shrink-0 text-[8px] text-[#C8A35A] sm:block">
                            {
                              work.type
                            }{" "}
                            →
                          </span>
                        </Link>
                      ),
                    )}
                </div>

                <Link
                  href={`/authors/${author.slug}`}
                  className="mt-5 inline-flex min-h-9 items-center gap-2 rounded-md bg-[#C8A35A] px-4 text-[9px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                >
                  View{" "}
                  {author.name}
                  <ArrowRight
                    size={12}
                  />
                </Link>
              </article>
            ),
          )}
        </section>

        {/* CREDIT EXPLANATION */}

        <section className="mt-6 rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
          <h2 className="font-serif text-[20px]">
            Understanding the Credits
          </h2>

          <p className="mt-4 max-w-[950px] text-[11px] leading-6 text-white/40">
            Production, narration
            and musical
            collaboration are
            distinct
            contributions. This
            directory preserves the
            credits shown on the
            works; it does not infer
            narration roles,
            biographies or
            credentials where they
            have not been supplied.
          </p>

          <div className="mt-5 flex flex-wrap gap-5">
            <Link
              href="/musicals"
              className="text-[9px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              Explore Wisdom
              Musicals →
            </Link>

            <span className="text-white/20">
              •
            </span>

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