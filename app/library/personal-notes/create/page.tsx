"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import AuthRouteGuard from "@/components/AuthRouteGuard";

import { API_URL } from "@/lib/api";

type LinkedNugget = {
  id: string;
  slug: string;
  number?: number;
  title: string;
  scriptureRef?: string;
  scriptureText?: string;
  keyPrinciple?: string;
};

export default function CreateStudyNotePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [nuggetId, setNuggetId] =
    useState<string | null>(null);

  const [linkedNugget, setLinkedNugget] =
    useState<LinkedNugget | null>(null);

  const [loadingNugget, setLoadingNugget] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =========================================================
     READ OPTIONAL LINKED NUGGET FROM URL

     Example:
     /library/personal-notes/create?nuggetId=abc123
  ========================================================= */

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search,
      );

    const linkedId =
      params.get("nuggetId");

    if (!linkedId) return;

    setNuggetId(linkedId);

    async function loadLinkedNugget() {
      try {
        setLoadingNugget(true);

        const response =
          await fetch(
            `${API_URL}/nuggets`,
          );

        const data =
          await response.json();

        if (!response.ok) {
          return;
        }

        if (!Array.isArray(data)) {
          return;
        }

        const found =
          data.find(
            (item: LinkedNugget) =>
              String(item.id) ===
              String(linkedId),
          ) ?? null;

        setLinkedNugget(found);
      } catch {
        setLinkedNugget(null);
      } finally {
        setLoadingNugget(false);
      }
    }

    loadLinkedNugget();
  }, []);

  /* =========================================================
     SAVE NOTE
  ========================================================= */

  async function handleSaveNote() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setError(
        "Your session has expired. Please sign in again.",
      );

      return;
    }

    if (!content.trim()) {
      setError(
        "Write your reflection before saving the note.",
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/notes`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              title:
                title.trim() ||
                undefined,

              content:
                content.trim(),

              nuggetId:
                nuggetId ||
                undefined,
            }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          Array.isArray(
            data.message,
          )
            ? data.message.join(
                ", ",
              )
            : data.message ||
                "Could not save note.",
        );

        return;
      }

      router.push(
        "/library/personal-notes",
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
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
          {/* BREADCRUMB */}

          <Link
            href="/library/personal-notes"
            className="text-[11px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
          >
            ← My Journal &amp; Notes
          </Link>

          {/* HEADER */}

          <section className="mt-4">
            <h1 className="bn-hero-title font-serif text-[40px] leading-tight">
              Create a Study Note
            </h1>

            <p className="mt-3 max-w-[650px] text-[13px] leading-6 text-white/40">
              Turn a biblical business
              principle into a personal
              reflection and practical next
              step.
            </p>
          </section>

          {/* CONTENT */}

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
            {/* NOTE FORM */}

            <section className="rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
              <h2 className="font-serif text-[20px] text-white">
                New Journal Entry
              </h2>

              {/* LINKED NUGGET */}

              {loadingNugget ? (
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                  Loading linked Nugget...
                </p>
              ) : linkedNugget ? (
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                  Linked Nugget
                  {linkedNugget.number
                    ? ` #${linkedNugget.number}`
                    : ""}
                  {linkedNugget.scriptureRef
                    ? ` • ${linkedNugget.scriptureRef}`
                    : ""}
                </p>
              ) : (
                <p className="mt-3 text-[10px] uppercase tracking-[0.08em] text-white/25">
                  Personal Study Note
                </p>
              )}

              {/* TITLE */}

              <div className="mt-6">
                <label
                  htmlFor="note-title"
                  className="mb-2 block text-[10px] font-semibold text-white/55"
                >
                  Note Title
                </label>

                <input
                  id="note-title"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Negotiation Integrity Principle"
                  maxLength={120}
                  className="h-11 w-full rounded-md border border-white/10 bg-[#19191D] px-4 text-[12px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/60"
                />
              </div>

              {/* REFLECTION */}

              <div className="mt-5">
                <label
                  htmlFor="note-reflection"
                  className="mb-2 block text-[10px] font-semibold text-white/55"
                >
                  My Reflection
                </label>

                <textarea
                  id="note-reflection"
                  value={content}
                  onChange={(event) =>
                    setContent(
                      event.target.value,
                    )
                  }
                  placeholder="What does this principle mean for your business? Capture the decision, conversation or practical step you want to revisit..."
                  rows={8}
                  className="w-full resize-none rounded-md border border-white/10 bg-[#19191D] px-4 py-3 text-[12px] leading-6 text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/60"
                />
              </div>

              <p className="mt-3 text-[10px] text-white/25">
                Personal study note • Not
                shared with the community
              </p>

              {/* ERROR */}

              {error && (
                <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                  <p className="text-[11px] text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* ACTIONS */}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  href="/library/personal-notes"
                  className="bn-button inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 px-4 text-[11px] text-white/55 transition hover:border-white/20 hover:text-white"
                >
                  Cancel - My Notes
                </Link>

                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={
                    saving ||
                    !content.trim()
                  }
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#C8A35A] px-5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving
                    ? "Saving..."
                    : "Save Note"}
                </button>
              </div>
            </section>

            {/* SCRIPTURE FOUNDATION */}

            <aside>
              <section className="rounded-[10px] border border-[#C8A35A]/60 bg-[#111111] p-5 sm:p-6">
                <h2 className="font-serif text-[20px]">
                  Scripture Foundation
                </h2>

                {linkedNugget ? (
                  <>
                    {linkedNugget.scriptureText ? (
                      <blockquote className="mt-5 font-serif text-[17px] italic leading-7 text-[#F5F0E8]">
                        “
                        {
                          linkedNugget.scriptureText
                        }
                        ”
                      </blockquote>
                    ) : (
                      <p className="mt-5 text-[12px] leading-6 text-white/45">
                        This note is linked to{" "}
                        {
                          linkedNugget.title
                        }
                        .
                      </p>
                    )}

                    {linkedNugget.scriptureRef && (
                      <p className="mt-4 text-[11px] font-medium text-[#C8A35A]">
                        {
                          linkedNugget.scriptureRef
                        }
                      </p>
                    )}

                    <p className="mt-5 text-[11px] leading-5 text-white/35">
                      {
                        linkedNugget.title
                      }
                    </p>

                    <Link
                      href={`/nugget/${linkedNugget.slug}`}
                      className="mt-5 inline-block text-[11px] text-[#C8A35A] transition hover:text-[#E0C48A]"
                    >
                      Return to Commentary →
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="mt-5 text-[12px] leading-6 text-white/40">
                      This is a personal
                      journal entry and is not
                      currently linked to a
                      specific Business
                      Nugget.
                    </p>

                    <Link
                      href="/library"
                      className="mt-5 inline-block text-[11px] text-[#C8A35A]"
                    >
                      Explore Nuggets →
                    </Link>
                  </>
                )}
              </section>

              <p className="mt-4 text-[10px] leading-5 text-white/25">
                Reflection prompt: Where
                could your agreements make
                responsibilities more
                balanced and transparent?
              </p>
            </aside>
          </div>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}