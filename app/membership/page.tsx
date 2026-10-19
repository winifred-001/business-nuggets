"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Crown,
  Headphones,
  Library,
  Mail,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import AuthRouteGuard from "@/components/AuthRouteGuard";

import { API_URL } from "@/lib/api";
import { getPublishedNuggets } from "@/lib/nuggets-api";

import type { Nugget } from "@/types/nugget";

type User = {
  id: number;
  name: string;
  email: string;
  role?: string;

  /*
   * This will start working automatically
   * once we add it to the backend/admin side.
   */
  membershipTier?: string;
};

export default function MembershipPage() {
  const [user, setUser] =
    useState<User | null>(
      null,
    );

  const [
    goldNuggets,
    setGoldNuggets,
  ] = useState<Nugget[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =========================================
     LOAD USER + PREMIUM TEACHINGS
  ========================================= */

  useEffect(() => {
    async function loadMembership() {
      const token =
        localStorage.getItem(
          "token",
        );

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [
          userResponse,
          nuggets,
        ] = await Promise.all([
          fetch(
            `${API_URL}/users/me`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          ),

          getPublishedNuggets(),
        ]);

        const userData =
          await userResponse
            .json()
            .catch(() => ({}));

        if (!userResponse.ok) {
          setError(
            userData.message ||
              "Could not load membership information.",
          );

          return;
        }

        setUser(userData);

        setGoldNuggets(
          nuggets
            .filter(
              (nugget) =>
                nugget.isGold,
            )
            .slice(0, 3),
        );
      } catch {
        setError(
          "Could not connect to the server.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadMembership();
  }, []);

  const isPremium =
    user?.membershipTier
      ?.toLowerCase() ===
    "premium";

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
          {/* BACK */}

          <Link
            href="/workspace"
            className="text-[10px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
          >
            ← My Wisdom Workspace
          </Link>

          {/* HEADER */}

          <section className="mt-3">
            <h1 className="font-serif text-[40px] leading-tight">
              Your BNB Premium Membership
            </h1>

            <p className="mt-3 text-[13px] leading-6 text-white/40">
              Understand your
              current access and the
              GOLD labels throughout
              the archive.
            </p>
          </section>

          {/* ERROR */}

          {error && (
            <div className="mt-7 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
              <p className="text-[11px] text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* MEMBERSHIP SUMMARY */}

          {!loading &&
            !error && (
              <section className="mt-8 rounded-[10px] border border-[#C8A35A]/55 bg-[#111111] p-5 sm:p-6">
                <h2 className="font-serif text-[20px]">
                  {user?.name ||
                    "BNB Member"}
                </h2>

                <div className="mt-4">
                  <span className="inline-flex items-center gap-2 rounded-sm bg-[#C8A35A]/15 px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-[0.05em] text-[#C8A35A]">
                    <Crown
                      size={10}
                    />

                    {isPremium
                      ? "BNB Premium • Current Membership"
                      : "Free Access • Current Membership"}
                  </span>
                </div>

                <p className="mt-5 max-w-[850px] text-[11px] leading-6 text-white/40">
                  {isPremium
                    ? "Your account currently has BNB Premium access to full-length scripture commentary and premium teachings marked GOLD."
                    : "Your account currently has Free Access. You can explore the library, follow topics and discover teachings that are available without GOLD access."}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/library/account"
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 bg-[#080808] px-4 text-[10px] font-medium text-white/70 transition hover:border-[#C8A35A]/35 hover:text-white"
                  >
                    Billing &amp;
                    Membership Help →
                  </Link>

                  <a
                    href="mailto:support@businessnuggets.example"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#C8A35A] px-4 text-[10px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                  >
                    <Mail
                      size={13}
                    />

                    Contact Support →
                  </a>
                </div>
              </section>
            )}

          {/* ACCESS CARDS */}

          <section className="mt-6 grid gap-5 lg:grid-cols-2">
            {/* FREE */}

            <article className="rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#181818] text-white/50">
                <Library
                  size={16}
                />
              </div>

              <h2 className="mt-5 font-serif text-[20px]">
                Free Access
              </h2>

              <p className="mt-4 text-[11px] leading-6 text-white/40">
                Explore the library,
                core topics,
                challenges and
                scripture index.
                Discover teachings
                that are not marked
                GOLD.
              </p>

              <Link
                href="/library"
                className="mt-5 inline-block text-[10px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
              >
                Browse All Nuggets →
              </Link>
            </article>

            {/* PREMIUM */}

            <article className="rounded-[10px] border border-[#C8A35A]/45 bg-[#111111] p-5 sm:p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C8A35A]/25 bg-[#C8A35A]/[0.06] text-[#C8A35A]">
                <Crown
                  size={16}
                />
              </div>

              <h2 className="mt-5 font-serif text-[20px]">
                BNB Premium Access
              </h2>

              <p className="mt-4 text-[11px] leading-6 text-white/40">
                Access full-length
                scripture commentary,
                including premium
                teachings marked
                GOLD. Continue
                building your
                personal study
                workspace.
              </p>

              <Link
                href="/library"
                className="mt-5 inline-block text-[10px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
              >
                Explore GOLD Teachings →
              </Link>
            </article>
          </section>

          {/* PREMIUM TEACHINGS */}

          <section className="mt-10">
            <h2 className="font-serif text-[28px] leading-tight">
              Recognize Premium Teachings
            </h2>

            <p className="mt-3 text-[11px] leading-6 text-white/35">
              Teachings marked GOLD
              belong to the premium
              collection.
            </p>

            {loading && (
              <div className="mt-6 space-y-4">
                {[1, 2].map(
                  (item) => (
                    <div
                      key={
                        item
                      }
                      className="h-[88px] animate-pulse rounded-[10px] border border-white/10 bg-[#111111]"
                    />
                  ),
                )}
              </div>
            )}

            {!loading &&
              goldNuggets.length ===
                0 && (
                <div className="mt-6 rounded-[10px] border border-white/10 bg-[#111111] p-6">
                  <p className="text-[11px] leading-6 text-white/35">
                    No published
                    GOLD teachings
                    are available
                    yet.
                  </p>
                </div>
              )}

            {!loading &&
              goldNuggets.length >
                0 && (
                <div className="mt-6 space-y-4">
                  {goldNuggets.map(
                    (
                      nugget,
                    ) => (
                      <Link
                        key={
                          nugget.id
                        }
                        href={`/nugget/${nugget.slug}`}
                        className="group flex items-center gap-4 rounded-[10px] border border-white/10 bg-[#111111] p-4 transition hover:border-[#C8A35A]/40"
                      >
                        <div className="relative h-[58px] w-[72px] shrink-0 overflow-hidden rounded-md bg-[#181818]">
                          <Image
                            src={
                              nugget.image
                            }
                            alt={
                              nugget.title
                            }
                            fill
                            sizes="72px"
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-[15px] leading-5 text-white/90 transition group-hover:text-[#C8A35A]">
                              {
                                nugget.title
                              }
                            </h3>

                            <span className="rounded-sm bg-[#C8A35A]/15 px-2 py-1 text-[7px] font-semibold uppercase tracking-[0.05em] text-[#C8A35A]">
                              Gold
                            </span>
                          </div>

                          <p className="mt-1 text-[9px] text-white/30">
                            {
                              nugget.scriptureRef
                            }

                            {nugget.topic &&
                              ` • ${nugget.topic}`}

                            {nugget.duration &&
                              ` • ${nugget.duration}`}
                          </p>
                        </div>

                        <span className="hidden shrink-0 text-[9px] font-medium text-[#C8A35A] sm:block">
                          Listen &amp;
                          Read →
                        </span>
                      </Link>
                    ),
                  )}
                </div>
              )}
          </section>

          {/* MEMBERSHIP QUESTIONS */}

          <section className="mt-8 rounded-[8px] border border-[#C8A35A]/20 bg-[#C8A35A]/[0.14] px-5 py-4">
            <p className="text-[10px] font-semibold text-[#E0C48A]">
              Membership questions?
            </p>

            <p className="mt-2 text-[10px] leading-5 text-white/35">
              For billing details or
              changes to your
              membership, use
              Support. No price,
              renewal date or
              payment schedule is
              shown here until the
              membership system
              provides those details.
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}