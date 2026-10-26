"use client";

import Link from "next/link";

import {
  Check,
  FolderPlus,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import AuthRouteGuard from "@/components/AuthRouteGuard";

import { API_URL } from "@/lib/api";
import { getPublishedNuggets } from "@/lib/nuggets-api";

import type { Nugget } from "@/types/nugget";

type SavedNuggetRecord = {
  id: number;
  nuggetId: string;
  userId: number;
  createdAt: string;
};

export default function CreateSavedFolderPage() {
  const router =
    useRouter();

  const [
    savedRecords,
    setSavedRecords,
  ] = useState<
    SavedNuggetRecord[]
  >([]);

  const [
    nuggets,
    setNuggets,
  ] = useState<Nugget[]>(
    [],
  );

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<string[]>(
    [],
  );

  const [
    folderName,
    setFolderName,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =========================================
     LOAD SAVED NUGGETS
  ========================================= */

  useEffect(() => {
    async function loadSavedContent() {
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
          savedResponse,
          publishedNuggets,
        ] =
          await Promise.all([
            fetch(
              `${API_URL}/saved-nuggets`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            ),

            getPublishedNuggets(),
          ]);

        const savedData =
          await savedResponse
            .json()
            .catch(
              () => [],
            );

        if (
          !savedResponse.ok
        ) {
          setError(
            savedData.message ||
              "Could not load saved Nuggets.",
          );

          return;
        }

        setSavedRecords(
          Array.isArray(
            savedData,
          )
            ? savedData
            : [],
        );

        setNuggets(
          publishedNuggets,
        );
      } catch {
        setError(
          "Could not connect to the server.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSavedContent();
  }, []);

  /* =========================================
     REAL SAVED NUGGETS
  ========================================= */

  const savedNuggets =
    useMemo(() => {
      const ids =
        new Set(
          savedRecords.map(
            (record) =>
              record.nuggetId,
          ),
        );

      return nuggets.filter(
        (nugget) =>
          ids.has(
            nugget.id,
          ),
      );
    }, [
      savedRecords,
      nuggets,
    ]);

  /* =========================================
     SELECT
  ========================================= */

  function toggleNugget(
    nuggetId: string,
  ) {
    setSelectedIds(
      (current) =>
        current.includes(
          nuggetId,
        )
          ? current.filter(
              (id) =>
                id !==
                nuggetId,
            )
          : [
              ...current,
              nuggetId,
            ],
    );
  }

  /* =========================================
     CREATE FOLDER
  ========================================= */

  async function createFolder() {
    const token =
      localStorage.getItem(
        "token",
      );

    if (!token) {
      return;
    }

    if (
      !folderName.trim()
    ) {
      setError(
        "Enter a folder name.",
      );

      return;
    }

    if (
      selectedIds.length ===
      0
    ) {
      setError(
        "Select at least one saved Nugget.",
      );

      return;
    }

    setCreating(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/saved-folders`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                name:
                  folderName.trim(),

                description:
                  description.trim() ||
                  undefined,

                nuggetIds:
                  selectedIds,
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
                "Could not create folder.",
        );

        return;
      }

      router.push(
        "/library/saved-nuggets",
      );

      router.refresh();
    } catch {
      setError(
        "Could not create folder.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
          {/* BACK */}

          <Link
            href="/library/saved-nuggets"
            className="text-[11px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
          >
            ← Saved Nuggets
          </Link>

          {/* HEADER */}

          <section className="mt-4">
            <h1 className="bn-hero-title font-serif text-[40px] leading-tight">
              Create a Saved Folder
            </h1>

            <p className="mt-3 text-[13px] leading-6 text-white/40">
              Group bookmarked
              teachings around a
              specific business
              focus.
            </p>
          </section>

          {/* CONTENT */}

          <div className="mt-8 grid gap-7 lg:grid-cols-[360px_minmax(0,1fr)]">
            {/* LEFT */}

            <section className="h-fit rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
              <h2 className="font-serif text-[20px]">
                Folder Details
              </h2>

              <div className="mt-6">
                <label
                  htmlFor="folder-name"
                  className="mb-2 block text-[10px] font-semibold text-white/55"
                >
                  Folder Name
                </label>

                <input
                  id="folder-name"
                  type="text"
                  value={
                    folderName
                  }
                  onChange={(
                    event,
                  ) => {
                    setFolderName(
                      event
                        .target
                        .value,
                    );

                    setError(
                      "",
                    );
                  }}
                  placeholder="e.g. Wisdom for Vendor Agreements"
                  maxLength={
                    100
                  }
                  className="h-11 w-full rounded-md border border-white/10 bg-[#19191D] px-4 text-[12px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/60"
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="folder-description"
                  className="mb-2 block text-[10px] font-semibold text-white/55"
                >
                  Description
                </label>

                <textarea
                  id="folder-description"
                  value={
                    description
                  }
                  onChange={(
                    event,
                  ) =>
                    setDescription(
                      event
                        .target
                        .value,
                    )
                  }
                  rows={6}
                  maxLength={
                    300
                  }
                  placeholder="What would you like to study together?"
                  className="w-full resize-none rounded-md border border-white/10 bg-[#19191D] px-4 py-3 text-[12px] leading-6 text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/60"
                />
              </div>

              <p className="mt-4 text-[10px] leading-5 text-white/25">
                Folders organize
                your saved Nuggets.
                They do not change
                your playlists or
                remove content from
                your library.
              </p>
            </section>

            {/* RIGHT */}

            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                  Select Saved
                  Content
                </p>

                <p className="text-[10px] uppercase tracking-[0.06em] text-[#C8A35A]">
                  {
                    selectedIds.length
                  }{" "}
                  selected
                </p>
              </div>

              {loading && (
                <p className="mt-5 text-[12px] text-white/35">
                  Loading saved
                  Nuggets...
                </p>
              )}

              {!loading &&
                savedNuggets.length ===
                  0 && (
                  <div className="mt-4 rounded-[10px] border border-white/10 bg-[#111111] p-8 text-center">
                    <FolderPlus
                      size={
                        24
                      }
                      className="mx-auto text-[#C8A35A]"
                    />

                    <h3 className="mt-4 font-serif text-[18px]">
                      No saved
                      Nuggets yet
                    </h3>

                    <p className="mt-2 text-[11px] text-white/35">
                      Save some
                      Nuggets before
                      creating a
                      folder.
                    </p>

                    <Link
                      href="/library"
                      className="mt-4 inline-block text-[11px] text-[#C8A35A]"
                    >
                      Browse Library →
                    </Link>
                  </div>
                )}

              {!loading &&
                savedNuggets.length >
                  0 && (
                  <div className="mt-4 space-y-3">
                    {savedNuggets.map(
                      (
                        nugget,
                      ) => {
                        const selected =
                          selectedIds.includes(
                            nugget.id,
                          );

                        return (
                          <button
                            key={
                              nugget.id
                            }
                            type="button"
                            onClick={() =>
                              toggleNugget(
                                nugget.id,
                              )
                            }
                            className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${
                              selected
                                ? "border-[#C8A35A]/60 bg-[#C8A35A]/[0.13]"
                                : "border-white/10 bg-[#19191D] hover:border-white/20"
                            }`}
                          >
                            {/* CHECK */}

                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border ${
                                selected
                                  ? "border-[#C8A35A] bg-[#C8A35A]"
                                  : "border-white/25"
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
                                  className="text-[#080808]"
                                />
                              )}
                            </span>

                            {/* INFO */}

                            <div className="min-w-0 flex-1">
                              <h3 className="font-serif text-[15px] leading-5 text-white/85">
                                {
                                  nugget.title
                                }
                              </h3>

                              <p className="mt-1 text-[10px] text-white/30">
                                {
                                  nugget.scriptureRef
                                }

                                {nugget.duration &&
                                  ` • ${nugget.duration}`}
                              </p>
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}

              {error && (
                <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                  <p className="text-[11px] text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* ACTIONS */}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
                <Link
                  href="/library/saved-nuggets"
                  className="bn-button inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 px-4 text-[11px] text-white/55 transition hover:border-white/20 hover:text-white"
                >
                  Cancel - Saved
                  Nuggets
                </Link>

                <button
                  type="button"
                  onClick={
                    createFolder
                  }
                  disabled={
                    creating ||
                    !folderName.trim() ||
                    selectedIds.length ===
                      0
                  }
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#C8A35A] px-5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creating
                    ? "Creating..."
                    : "Create Folder"}
                </button>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}