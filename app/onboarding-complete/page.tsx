"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import AuthRouteGuard from "@/components/AuthRouteGuard";
import Footer from "@/components/Footer";
import Navbar from "@/components/navbar";
import type { UserPreferences } from "@/lib/personalization";

export default function OnboardingCompletePage() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    interests: [],
    wisdomNeeds: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch(
          "/api/member/proxy/users/me/preferences",
          { cache: "no-store" },
        );

        const data = response.ok
          ? await response.json().catch(() => ({}))
          : {};

        setPreferences({
          interests: Array.isArray(data.interests) ? data.interests : [],
          wisdomNeeds: Array.isArray(data.wisdomNeeds) ? data.wisdomNeeds : [],
        });
      } finally {
        setLoading(false);
      }
    }

    void loadPreferences();
  }, []);

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto flex w-full max-w-[940px] flex-1 flex-col items-center px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <span className="rounded-full border border-[#C8A35A]/30 bg-[#C8A35A]/10 px-3 py-1 font-semibold text-[#C8A35A]">
            STEP 3 OF 3
          </span>

          <div className="mt-5 grid h-12 w-12 place-items-center rounded-full border border-[#C8A35A] text-[#C8A35A]">
            <Check size={22} strokeWidth={1.8} />
          </div>

          <section className="mt-7 w-full text-center">
            <h1 className="bn-hero-title font-serif leading-tight">
              Your Wisdom Stream Is Ready
            </h1>
            <p className="mx-auto mt-3 max-w-[680px] text-white/45">
              Your homepage and Recommendation Guide will now use the categories and
              Nuggets you selected. You can return and adjust them at any time.
            </p>
          </section>

          <section className="mt-8 w-full rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-7">
            <h2 className="font-serif">Your Selected Interests</h2>

            {loading ? (
              <p className="mt-5 text-white/35">Loading your choices...</p>
            ) : preferences.interests.length > 0 ? (
              <div className="mt-5 space-y-3">
                {preferences.interests.map((interest) => (
                  <div
                    key={interest}
                    className="flex items-start gap-3 rounded-lg border border-[#C8A35A]/35 bg-[#C8A35A]/10 px-4 py-4"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm bg-[#C8A35A] text-[#080808]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-serif text-white/90">{interest}</h3>
                      <p className="mt-1 text-white/40">
                        Recommendations will prioritize published Nuggets in and around this category.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-white/40">
                You skipped category selection. You can add interests whenever you are ready.
              </p>
            )}
          </section>

          {!loading && preferences.wisdomNeeds.length > 0 && (
            <section className="mt-5 w-full rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-7">
              <h2 className="font-serif">Your Starting Nuggets</h2>
              <p className="mt-2 text-white/40">
                These choices receive extra weight when your recommendations are ranked.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {preferences.wisdomNeeds.map((title) => (
                  <span
                    key={title}
                    className="rounded-full border border-[#C8A35A]/25 bg-[#C8A35A]/[0.08] px-3 py-2 text-[#E0C48A]"
                  >
                    {title}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/onboarding?edit=1"
              className="bn-button inline-flex min-h-11 items-center rounded-md border border-white/10 bg-[#111111] px-5 font-medium text-white/70 transition hover:border-[#C8A35A]/40 hover:text-[#C8A35A]"
            >
              Adjust Interests
            </Link>
            <Link
              href="/home"
              className="bn-button inline-flex min-h-11 items-center rounded-md bg-[#C8A35A] px-6 font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
            >
              Go to My Homepage
            </Link>
          </div>

          <Link
            href="/recommendations"
            className="mt-6 font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
          >
            Understand your recommendations → Recommendation Guide
          </Link>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}
