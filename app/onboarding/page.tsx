"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Check,
} from "lucide-react";

import { useRouter } from "next/navigation";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import AuthRouteGuard from "@/components/AuthRouteGuard";

import { API_URL } from "@/lib/api";

const interests = [
  "Leadership & Governance",
  "Money & Stewardship",
  "Strategy & Planning",
  "Entrepreneurship & Innovation",
  "Integrity & Character",
  "People & Teams",
  "Negotiation & Covenant",
  "Global Expansion & Reserves",
];

const wisdomTopics = [
  "Strategic Principles",
  "Managing Public Funds",
  "Strategic Risk-Free Scaling",
  "Executive Burnout",
];

export default function InterestsPage() {
  const router =
    useRouter();

  const [
    selectedInterests,
    setSelectedInterests,
  ] = useState<string[]>([]);

  const [
    selectedWisdom,
    setSelectedWisdom,
  ] = useState<string[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =========================================
     LOAD EXISTING PREFERENCES
  ========================================= */

  useEffect(() => {
    async function loadPreferences() {
      const token =
        localStorage.getItem(
          "token",
        );

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/users/me/preferences`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const data =
          await response
            .json()
            .catch(
              () => ({}),
            );

        if (response.ok) {
          setSelectedInterests(
            Array.isArray(
              data.interests,
            )
              ? data.interests
              : [],
          );

          setSelectedWisdom(
            Array.isArray(
              data.wisdomNeeds,
            )
              ? data.wisdomNeeds
              : [],
          );
        }
      } catch {
        console.error(
          "Could not load preferences.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, []);

  function toggleInterest(
    interest: string,
  ) {
    setSelectedInterests(
      (current) =>
        current.includes(
          interest,
        )
          ? current.filter(
              (item) =>
                item !==
                interest,
            )
          : [
              ...current,
              interest,
            ],
    );

    setError("");
  }

  function toggleWisdom(
    topic: string,
  ) {
    setSelectedWisdom(
      (current) =>
        current.includes(
          topic,
        )
          ? current.filter(
              (item) =>
                item !== topic,
            )
          : [
              ...current,
              topic,
            ],
    );

    setError("");
  }

  async function savePreferences() {
    const token =
      localStorage.getItem(
        "token",
      );

    if (!token) {
      return;
    }

    if (
      selectedInterests.length ===
      0
    ) {
      setError(
        "Choose at least one business interest.",
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/users/me/preferences`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                interests:
                  selectedInterests,

                wisdomNeeds:
                  selectedWisdom,
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (!response.ok) {
        setError(
          Array.isArray(
            data.message,
          )
            ? data.message.join(
                ", ",
              )
            : data.message ||
                "Could not save your preferences.",
        );

        return;
      }

      router.push(
        "/home",
      );

      router.refresh();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          {/* STEP */}

          <div className="flex flex-wrap items-center justify-center gap-2 text-center">
            <span className="rounded-full bg-[#C8A35A] px-2.5 py-1 text-[9px] font-semibold text-[#080808]">
              STEP 2 OF 3
            </span>

            <span className="text-[10px] text-white/35">
              Customizing your
              wisdom stream
            </span>
          </div>

          {/* HEADING */}

          <div className="mt-8 text-center">
            <h1 className="font-serif text-[28px] leading-tight text-white">
              What interests you?
            </h1>

            <p className="mx-auto mt-3 max-w-[540px] text-[11px] leading-6 text-white/45">
              Select the
              biblical-business
              topics that align
              with your
              professional
              challenges.
            </p>
          </div>

          {/* INTERESTS */}

          {loading ? (
            <p className="mt-10 text-[11px] text-white/30">
              Loading your
              preferences...
            </p>
          ) : (
            <>
              <div className="mt-8 grid w-full max-w-[850px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {interests.map(
                  (
                    interest,
                  ) => {
                    const selected =
                      selectedInterests.includes(
                        interest,
                      );

                    return (
                      <button
                        key={
                          interest
                        }
                        type="button"
                        onClick={() =>
                          toggleInterest(
                            interest,
                          )
                        }
                        className={`flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2 text-[10px] transition ${
                          selected
                            ? "border-[#C8A35A] bg-[#C8A35A] text-[#080808]"
                            : "border-white/10 bg-[#151515] text-white/60 hover:border-[#C8A35A]/50 hover:text-white"
                        }`}
                      >
                        {selected && (
                          <Check
                            size={
                              11
                            }
                            strokeWidth={
                              3
                            }
                          />
                        )}

                        {
                          interest
                        }
                      </button>
                    );
                  },
                )}
              </div>

              {/* WISDOM NEEDS */}

              <section className="mt-8 w-full max-w-[760px] rounded-[10px] border border-white/10 bg-[#111111] px-5 py-6">
                <h2 className="font-serif text-[18px]">
                  What do you need
                  wisdom about
                  today?
                </h2>

                <p className="mt-2 text-[10px] leading-5 text-white/30">
                  These can change
                  over time. They
                  help prioritize
                  what appears in
                  your
                  recommendations.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {wisdomTopics.map(
                    (
                      topic,
                    ) => {
                      const selected =
                        selectedWisdom.includes(
                          topic,
                        );

                      return (
                        <button
                          key={
                            topic
                          }
                          type="button"
                          onClick={() =>
                            toggleWisdom(
                              topic,
                            )
                          }
                          className={`flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2 text-[10px] transition ${
                            selected
                              ? "border-[#C8A35A] bg-[#C8A35A]/15 text-[#E0C48A]"
                              : "border-white/10 bg-[#181818] text-white/55 hover:border-[#C8A35A]/40 hover:text-white"
                          }`}
                        >
                          {selected && (
                            <Check
                              size={
                                11
                              }
                            />
                          )}

                          {
                            topic
                          }
                        </button>
                      );
                    },
                  )}
                </div>
              </section>

              {/* ERROR */}

              {error && (
                <div className="mt-5 w-full max-w-[760px] rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                  <p className="text-center text-[10px] text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* CONTINUE */}

              <button
                type="button"
                onClick={
                  savePreferences
                }
                disabled={
                  saving ||
                  selectedInterests.length ===
                    0
                }
                className="mt-8 min-h-10 rounded-md bg-[#C8A35A] px-7 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? "Saving..."
                  : "Continue to My Homepage"}
              </button>
            </>
          )}
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}