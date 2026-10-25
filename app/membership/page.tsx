"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Crown,
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
import PremiumCheckout from "@/components/PremiumCheckout";

import { API_URL } from "@/lib/api";
import { getPublishedNuggets } from "@/lib/nuggets-api";

import type { Nugget } from "@/types/nugget";

type User = {
  id: number;
  name: string;
  email: string;
  role?: string;
  membershipTier?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: string | null;
};

export default function MembershipPage() {
  const [user, setUser] =
    useState<User | null>(null);

  const [goldNuggets, setGoldNuggets] =
    useState<Nugget[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadMembership() {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [userResponse, nuggets] =
          await Promise.all([
            fetch(
              `${API_URL}/users/me`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            ),
            getPublishedNuggets(token),
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

    void loadMembership();
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
          <Link
            href="/workspace"
            className="text-[12px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
          >
            ← My Wisdom Workspace
          </Link>

          <section className="mt-4">
            <h1 className="font-serif text-[44px] leading-tight">
              Your BNB Premium Membership
            </h1>

            <p className="mt-4 max-w-[760px] text-[16px] leading-7 text-white/55">
              Manage your current access, choose a Premium plan and complete payment securely with Paystack.
            </p>
          </section>

          {error && (
            <div className="mt-7 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
              <p className="text-[15px] leading-6 text-red-300">
                {error}
              </p>
            </div>
          )}

          {!loading &&
            !error && (
              <section className="mt-8 rounded-[12px] border border-[#C8A35A]/55 bg-[#111111] p-5 sm:p-6">
                <h2 className="font-serif text-[28px]">
                  {user?.name ||
                    "BNB Member"}
                </h2>

                <div className="mt-4">
                  <span className="inline-flex items-center gap-2 rounded-sm bg-[#C8A35A]/15 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#C8A35A]">
                    <Crown size={14} />
                    {isPremium
                      ? "BNB Premium • Current Membership"
                      : "Free Access • Current Membership"}
                  </span>
                </div>

                <p className="mt-5 max-w-[850px] text-[16px] leading-7 text-white/55">
                  {isPremium
                    ? "Your account has full access to every published Business Nugget, including Reader, Audio and Musical experiences."
                    : "Your account currently has Free Access. You can open the 10 free Nuggets selected by the admin and upgrade to unlock the complete library."}
                </p>

                {isPremium && (
                  <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-white/45">
                    <span>
                      Plan: {user?.subscriptionPlan || "Premium"}
                    </span>
                    <span>
                      Status: {user?.subscriptionStatus || "active"}
                    </span>
                    {user?.subscriptionExpiresAt && (
                      <span>
                        Access until: {new Date(
                          user.subscriptionExpiresAt,
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/library/account"
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/10 bg-[#080808] px-4 text-[14px] font-medium text-white/75 transition hover:border-[#C8A35A]/35 hover:text-white"
                  >
                    Billing &amp; Membership Help →
                  </Link>

                  <a
                    href="mailto:support@businessnuggets.example"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#C8A35A] px-4 text-[14px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                  >
                    <Mail size={15} />
                    Contact Support →
                  </a>
                </div>
              </section>
            )}

          {!loading && (
            <PremiumCheckout
              isPremium={Boolean(
                isPremium,
              )}
            />
          )}

          <section className="mt-10 grid gap-5 lg:grid-cols-2">
            <article className="rounded-[12px] border border-white/10 bg-[#111111] p-5 sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-[#181818] text-white/50">
                <Library size={18} />
              </div>

              <h2 className="mt-5 font-serif text-[28px]">
                Free Access
              </h2>

              <p className="mt-4 text-[16px] leading-7 text-white/55">
                The admin selects up to 10 published Nuggets that Free members can open. The rest of the library remains visible but locked for Free accounts.
              </p>

              <Link
                href="/library"
                className="mt-5 inline-block text-[14px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
              >
                Browse All Nuggets →
              </Link>
            </article>

            <article className="rounded-[12px] border border-[#C8A35A]/45 bg-[#111111] p-5 sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#C8A35A]/25 bg-[#C8A35A]/[0.06] text-[#C8A35A]">
                <Crown size={18} />
              </div>

              <h2 className="mt-5 font-serif text-[28px]">
                BNB Premium Access
              </h2>

              <p className="mt-4 text-[16px] leading-7 text-white/55">
                Premium unlocks the complete published library. Once payment is verified, all Nuggets open normally without Gold lock messaging.
              </p>

              <Link
                href="/library"
                className="mt-5 inline-block text-[14px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
              >
                Explore Full Library →
              </Link>
            </article>
          </section>

          {!isPremium && (
            <section className="mt-12">
              <h2 className="font-serif text-[32px] leading-tight">
                Premium Teachings
              </h2>

              <p className="mt-3 text-[16px] leading-7 text-white/50">
                Free members will see Gold identification on locked Nuggets.
              </p>

              {loading && (
                <div className="mt-6 space-y-4">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-[88px] animate-pulse rounded-[10px] border border-white/10 bg-[#111111]"
                    />
                  ))}
                </div>
              )}

              {!loading &&
                goldNuggets.length === 0 && (
                  <div className="mt-6 rounded-[10px] border border-white/10 bg-[#111111] p-6">
                    <p className="text-[16px] leading-7 text-white/50">
                      No published Gold teachings are available yet.
                    </p>
                  </div>
                )}

              {!loading &&
                goldNuggets.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {goldNuggets.map((nugget) => (
                      <Link
                        key={nugget.id}
                        href={`/nugget/${nugget.slug}`}
                        className="group flex items-center gap-4 rounded-[10px] border border-white/10 bg-[#111111] p-4 transition hover:border-[#C8A35A]/40"
                      >
                        <div className="relative h-[64px] w-[80px] shrink-0 overflow-hidden rounded-md bg-[#181818]">
                          <Image
                            src={nugget.image}
                            alt={nugget.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-[22px] leading-6 text-white/90 transition group-hover:text-[#C8A35A]">
                              {nugget.title}
                            </h3>

                            <span className="rounded-sm bg-[#C8A35A]/15 px-2 py-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#C8A35A]">
                              Gold
                            </span>
                          </div>

                          <p className="mt-1 text-[14px] text-white/40">
                            {nugget.scriptureRef}
                            {nugget.topic &&
                              ` • ${nugget.topic}`}
                            {nugget.duration &&
                              ` • ${nugget.duration}`}
                          </p>
                        </div>

                        <span className="hidden shrink-0 text-[14px] font-medium text-[#C8A35A] sm:block">
                          Unlock →
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
            </section>
          )}

          <section className="mt-10 rounded-[10px] border border-[#C8A35A]/20 bg-[#C8A35A]/[0.14] px-5 py-4">
            <p className="text-[15px] font-semibold text-[#E0C48A]">
              Membership questions?
            </p>

            <p className="mt-2 text-[16px] leading-7 text-white/50">
              Plan prices are controlled from the Admin Subscriptions page. Payments are verified by the backend before Premium access is activated.
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}
