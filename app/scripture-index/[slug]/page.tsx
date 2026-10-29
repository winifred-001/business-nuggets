import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Clock3,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

import { BIBLE_BOOKS } from "@/lib/bible-books";
import { getPublishedNuggets } from "@/lib/nuggets-api";
import { slugify } from "@/lib/nuggets";

import type { Nugget } from "@/types/nugget";

const bookDescriptions: Record<
  string,
  string
> = {
  Genesis:
    "Origins, enterprise, stewardship, negotiation and long-term strategy.",

  Exodus:
    "Leadership systems, delegation, organizational structure and governance.",

  Leviticus:
    "Standards, integrity, ethical transactions and marketplace justice.",

  Numbers:
    "Order, responsibility, preparation and collective accountability.",

  Deuteronomy:
    "Stewardship, remembrance, covenant responsibility and wise leadership.",

  Proverbs:
    "Solomonic core wisdom dedicated to character cultivation, market ethics, and tactical operational intelligence.",

  Ecclesiastes:
    "Capital evaluation, diversification, perspective and the limits of material success.",

  Psalms:
    "Reflection, trust, resilience and leadership rooted in dependence on God.",

  Nehemiah:
    "Building, adversity, operational leadership and financial justice.",

  Matthew:
    "Stewardship, accountability and marketplace principles through the teachings of Christ.",

  Luke:
    "Faithful resource management, responsibility and practical stewardship.",
};

export default async function ScriptureIndexDetailPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  let nuggets: Nugget[] = [];

  try {
    nuggets =
      await getPublishedNuggets();
  } catch (error) {
    console.error(
      "Failed to load Scripture Nuggets:",
      error,
    );
  }

  const availableBooks = BIBLE_BOOKS;

  const book = availableBooks.find(
    (item) =>
      slugify(item) === slug,
  );

  if (!book) {
    notFound();
  }

  /*
   * Nuggets belonging to this book.
   */
  const bookNuggets = nuggets
    .filter(
      (nugget) =>
        nugget.book === book,
    )
    .sort((a, b) =>
      a.scriptureRef.localeCompare(
        b.scriptureRef,
        undefined,
        {
          numeric: true,
        },
      ),
    );

  /*
   * Prefer Gold Nuggets for featured
   * wisdom, then use remaining entries.
   */
  const featuredNuggets = [
    ...bookNuggets,
  ]
    .sort((a, b) => {
      if (
        a.isGold &&
        !b.isGold
      ) {
        return -1;
      }

      if (
        !a.isGold &&
        b.isGold
      ) {
        return 1;
      }

      return 0;
    })
    .slice(0, 2);

  /*
   * Related books come from actual
   * backend data.
   */
  const relatedBooks =
    availableBooks
      .filter(
        (item) =>
          item !== book,
      )
      .map((item) => ({
        title: item,

        count: nuggets.filter(
          (nugget) =>
            nugget.book === item,
        ).length,
      }))
      .sort(
        (a, b) =>
          b.count - a.count,
      )
      .slice(0, 6);

  const featuredHeading =
    book === "Proverbs"
      ? "Featured Solomon Wisdom"
      : `Featured ${book} Wisdom`;

  const description =
    bookDescriptions[book] ??
    `Explore published biblical business wisdom, marketplace principles and practical applications from the book of ${book}.`;

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main>
        {/* HEADER */}
        <section className="border-b border-white/[0.06]">
          <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
            <Link
              href="/library?tab=Scripture+Matrix"
              className="text-[13px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              ← Scripture Index
            </Link>

            <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-[800px]">
                <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#C8A35A]">
                  Scripture Index Detail
                </p>

                <h1 className="bn-hero-title mt-3 font-serif text-[40px] leading-tight text-[#FAF9F6]">
                  The Book of {book}
                </h1>

                <p className="mt-4 max-w-[760px] text-[14px] leading-7 text-white/50">
                  {description}
                </p>
              </div>

              {/* ASSOCIATED COUNT */}
              <div className="w-fit min-w-[150px] rounded-lg border border-[#C8A35A]/50 bg-[#111111] px-6 py-5">
                <p className="font-serif text-[28px] leading-none text-[#C8A35A]">
                  {bookNuggets.length}
                </p>

                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                  Associated{" "}
                  {bookNuggets.length ===
                  1
                    ? "Nugget"
                    : "Nuggets"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-10">
          {/* FEATURED */}
          <section>
            <h2 className="font-serif text-[28px]">
              {featuredHeading}
            </h2>

            {featuredNuggets.length >
            0 ? (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {featuredNuggets.map(
                  (nugget) => (
                    <Link
                      key={
                        nugget.slug
                      }
                      href={`/nugget/${nugget.slug}`}
                      className="group flex min-h-[145px] overflow-hidden rounded-xl border border-white/10 bg-[#111111] transition hover:border-[#C8A35A]/45"
                    >
                      {/* IMAGE */}
                      <div className="relative w-[145px] shrink-0 sm:w-[180px]">
                        <Image
                          src={
                            nugget.image
                          }
                          alt={
                            nugget.title
                          }
                          fill
                          sizes="180px"
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      </div>

                      {/* CONTENT */}
                      <div className="flex min-w-0 flex-1 flex-col justify-center p-5">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#C8A35A]">
                          {
                            nugget.scriptureRef
                          }
                        </p>

                        <h3 className="mt-2 font-serif text-[18px] leading-[1.2]">
                          {
                            nugget.title
                          }
                        </h3>

                        <div className="mt-3 flex items-center gap-2 text-[13px] text-white/40">
                          <Clock3
                            size={
                              13
                            }
                          />

                          {
                            nugget.duration
                          }

                          <span>
                            •
                          </span>

                          <span>
                            {
                              nugget.topic
                            }
                          </span>
                        </div>
                      </div>
                    </Link>
                  ),
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-white/10 bg-[#111111] p-8 text-center">
                <p className="text-[14px] text-white/45">
                  No featured wisdom is
                  available from {book} yet.
                </p>
              </div>
            )}
          </section>

          {/* FULL LIST */}
          <section className="mt-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-[28px]">
                  Full Scripture Listing
                </h2>

                <p className="mt-2 text-[14px] text-white/40">
                  All published Nuggets from
                  the Book of {book}.
                </p>
              </div>

              <div className="text-[13px] text-white/40">
                Sort by:{" "}
                <span className="text-[#C8A35A]">
                  Verse Order
                </span>
              </div>
            </div>

            {bookNuggets.length >
            0 ? (
              <div className="mt-6 divide-y divide-white/[0.07] border-y border-white/[0.07]">
                {bookNuggets.map(
                  (nugget) => (
                    <div
                      key={
                        nugget.slug
                      }
                      className="grid gap-3 py-5 sm:grid-cols-[150px_minmax(0,1fr)_90px_90px] sm:items-center"
                    >
                      <Link
                        href={`/nugget/${nugget.slug}`}
                        className="text-[13px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
                      >
                        {
                          nugget.scriptureRef
                        }
                      </Link>

                      <Link
                        href={`/nugget/${nugget.slug}`}
                        className="min-w-0 font-serif text-[16px] leading-5 text-[#FAF9F6] transition hover:text-[#E0C48A]"
                      >
                        {
                          nugget.title
                        }
                      </Link>

                      <span className="text-[13px] text-white/35">
                        {
                          nugget.duration
                        }
                      </span>

                      <Link
                        href={`/nugget/${nugget.slug}`}
                        className="bn-button w-fit rounded border border-[#C8A35A]/50 px-3 py-1.5 text-[12px] font-medium text-[#C8A35A] transition hover:bg-[#C8A35A] hover:text-[#080808]"
                      >
                        Access
                      </Link>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-white/10 bg-[#111111] p-8 text-center">
                <p className="text-[14px] text-white/45">
                  No published Nuggets are
                  available from {book} yet.
                </p>
              </div>
            )}
          </section>

          {/* RELATED BOOKS */}
          {relatedBooks.length > 0 && (
            <section className="mt-12">
              <h2 className="font-serif text-[28px]">
                Related Wisdom Books
              </h2>

              <div className="mt-5 flex flex-wrap gap-3">
                {relatedBooks.map(
                  (item) => (
                    <Link
                      key={
                        item.title
                      }
                      href={`/scripture-index/${slugify(
                        item.title,
                      )}`}
                      className="bn-button inline-flex items-center gap-3 rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-[13px] text-white/55 transition hover:border-[#C8A35A]/45 hover:text-white"
                    >
                      {
                        item.title
                      }

                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/35">
                        {
                          item.count
                        }
                      </span>

                      <ArrowRight
                        size={13}
                        className="text-[#C8A35A]"
                      />
                    </Link>
                  ),
                )}
              </div>
            </section>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}