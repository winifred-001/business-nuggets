"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  Bookmark,
  Clock3,
  FolderOpen,
  FolderPlus,
  Search,
  Trash2,
} from "lucide-react";

import { API_URL } from "@/lib/api";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import AuthRouteGuard from "@/components/AuthRouteGuard";

import { getPublishedNuggets } from "@/lib/nuggets-api";
import type { Nugget } from "@/types/nugget";

type SavedNuggetRecord = {
  id: number;
  nuggetId: string;
  userId: number;
  createdAt: string;
};

type SavedFolderItem = {
  id: number;
  folderId: number;
  nuggetId: string;
  createdAt: string;
};

type SavedFolder = {
  id: number;
  name: string;
  description?: string | null;
  items: SavedFolderItem[];
};

const filters = [
  "All Saved",
  "Stewardship",
  "Leadership",
  "Covenant Strategy",
];

export default function SavedNuggetsPage() {
  const [savedRecords, setSavedRecords] =
    useState<SavedNuggetRecord[]>([]);

  const [apiNuggets, setApiNuggets] =
    useState<Nugget[]>([]);

  const [folders, setFolders] =
    useState<SavedFolder[]>([]);

  const [activeFilter, setActiveFilter] =
    useState("All Saved");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [folderMenuFor, setFolderMenuFor] =
    useState<string | null>(null);

  const [addingToFolder, setAddingToFolder] =
    useState(false);

  const [folderMessage, setFolderMessage] =
    useState("");

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    loadSavedNuggets();
    loadFolders();
  }, []);

  async function loadSavedNuggets() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setError(
        "Please log in to view your saved Nuggets.",
      );

      setLoading(false);
      return;
    }

    try {
      const [
        savedResponse,
        publishedNuggets,
      ] = await Promise.all([
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

      const data =
        await savedResponse
          .json()
          .catch(() => []);

      if (!savedResponse.ok) {
        setError(
          data.message ||
            "Unable to load saved Nuggets.",
        );

        return;
      }

      setSavedRecords(
        Array.isArray(data)
          ? data
          : [],
      );

      setApiNuggets(
        publishedNuggets,
      );

      setError("");
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadFolders() {
    const token =
      localStorage.getItem("token");

    if (!token) return;

    try {
      const response =
        await fetch(
          `${API_URL}/saved-folders`,
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
          .catch(() => []);

      if (response.ok) {
        setFolders(
          Array.isArray(data)
            ? data
            : [],
        );
      }
    } catch {
      console.error(
        "Could not load saved folders",
      );
    }
  }

  /* =========================================================
     REMOVE SAVED NUGGET
  ========================================================= */

  async function removeSavedNugget(
    nuggetId: string,
  ) {
    const token =
      localStorage.getItem("token");

    if (!token) return;

    try {
      const response =
        await fetch(
          `${API_URL}/saved-nuggets/${nuggetId}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      if (!response.ok) {
        return;
      }

      setSavedRecords(
        (current) =>
          current.filter(
            (record) =>
              record.nuggetId !==
              nuggetId,
          ),
      );
    } catch {
      console.error(
        "Unable to remove saved Nugget.",
      );
    }
  }

  /* =========================================================
     ADD TO REAL SAVED FOLDER
  ========================================================= */

  async function addNuggetToFolder(
    folderId: number,
    nuggetId: string,
  ) {
    const token =
      localStorage.getItem("token");

    if (!token) return;

    setAddingToFolder(true);
    setFolderMessage("");

    try {
      const response =
        await fetch(
          `${API_URL}/saved-folders/${folderId}/items`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              nuggetId,
            }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setFolderMessage(
          Array.isArray(
            data.message,
          )
            ? data.message.join(
                ", ",
              )
            : data.message ||
                "Could not add Nugget to folder.",
        );

        return;
      }

      setFolderMessage(
        data.message ||
          "Nugget added to folder.",
      );

      await loadFolders();

      setTimeout(() => {
        setFolderMenuFor(
          null,
        );

        setFolderMessage(
          "",
        );
      }, 1000);
    } catch {
      setFolderMessage(
        "Could not add Nugget to folder.",
      );
    } finally {
      setAddingToFolder(
        false,
      );
    }
  }

  /* =========================================================
     SAVED NUGGETS
  ========================================================= */

  const savedNuggets =
    useMemo(() => {
      const savedIds =
        new Set(
          savedRecords.map(
            (record) =>
              record.nuggetId,
          ),
        );

      return apiNuggets.filter(
        (nugget) =>
          savedIds.has(
            nugget.id,
          ),
      );
    }, [
      savedRecords,
      apiNuggets,
    ]);

  /* =========================================================
     SEARCH + FILTER
  ========================================================= */

  const visibleNuggets =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return savedNuggets.filter(
        (nugget) => {
          const matchesSearch =
            !query ||
            nugget.title
              .toLowerCase()
              .includes(
                query,
              ) ||
            nugget.topic
              .toLowerCase()
              .includes(
                query,
              ) ||
            nugget.tag
              .toLowerCase()
              .includes(
                query,
              ) ||
            nugget.scriptureRef
              .toLowerCase()
              .includes(
                query,
              );

          const matchesFilter =
            activeFilter ===
              "All Saved" ||
            nugget.topic
              .toLowerCase()
              .includes(
                activeFilter.toLowerCase(),
              ) ||
            nugget.tag
              .toLowerCase()
              .includes(
                activeFilter.toLowerCase(),
              );

          return (
            matchesSearch &&
            matchesFilter
          );
        },
      );
    }, [
      savedNuggets,
      searchQuery,
      activeFilter,
    ]);

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
          {/* =================================================
              HEADER
          ================================================= */}

          <section className="border-b border-white/[0.07] pb-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="bn-hero-title font-serif text-[40px] leading-tight">
                  Saved Nuggets
                </h1>

                <p className="mt-3 text-[13px] leading-6 text-white/40">
                  Your personal
                  library of timeless
                  business frameworks.
                </p>
              </div>

              {/* SEARCH */}

              <div className="relative w-full lg:w-[360px]">
                <Search
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />

                <input
                  type="text"
                  value={
                    searchQuery
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearchQuery(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Search saved Nuggets..."
                  className="h-11 w-full rounded-md border border-white/10 bg-[#111111] pl-11 pr-4 text-[12px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/50"
                />
              </div>
            </div>

            {/* FILTERS */}

            <div className="mt-7 flex flex-wrap gap-2">
              {filters.map(
                (filter) => {
                  const active =
                    activeFilter ===
                    filter;

                  return (
                    <button
                      key={
                        filter
                      }
                      type="button"
                      onClick={() =>
                        setActiveFilter(
                          filter,
                        )
                      }
                      className={`rounded-full px-4 py-2 text-[10px] font-medium transition ${
                        active
                          ? "bg-[#C8A35A] text-[#080808]"
                          : "border border-white/10 bg-[#111111] text-white/45 hover:border-[#C8A35A]/40 hover:text-[#C8A35A]"
                      }`}
                    >
                      {
                        filter
                      }
                    </button>
                  );
                },
              )}
            </div>

            {/* LOADING */}

            {loading && (
              <div className="py-16 text-center text-[12px] text-white/30">
                Loading saved
                Nuggets...
              </div>
            )}

            {/* ERROR */}

            {!loading &&
              error && (
                <div className="mt-8 rounded-lg border border-red-500/20 bg-red-500/[0.04] p-4">
                  <p className="text-[12px] text-red-400">
                    {error}
                  </p>
                </div>
              )}

            {/* SAVED NUGGET CARDS */}

            {!loading &&
              !error &&
              visibleNuggets.length >
                0 && (
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {visibleNuggets.map(
                    (
                      nugget,
                    ) => (
                      <article
                        key={
                          nugget.id
                        }
                        className="group overflow-hidden rounded-[10px] border border-white/10 bg-[#111111]"
                      >
                        <Link
                          href={`/nugget/${nugget.slug}`}
                        >
                          <div className="relative h-40 w-full overflow-hidden bg-[#181818]">
                            <Image
                              src={
                                nugget.image
                              }
                              alt={
                                nugget.title
                              }
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="object-cover transition duration-300 group-hover:scale-[1.03]"
                            />
                          </div>
                        </Link>

                        <div className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                              {
                                nugget.tag
                              }
                            </span>

                            <div className="flex items-center gap-1 text-[9px] text-white/25">
                              <Clock3
                                size={
                                  11
                                }
                              />

                              <span>
                                {
                                  nugget.duration
                                }
                              </span>
                            </div>
                          </div>

                          <Link
                            href={`/nugget/${nugget.slug}`}
                          >
                            <h2 className="mt-3 line-clamp-2 font-serif text-[18px] leading-6 text-white/90 transition group-hover:text-[#C8A35A]">
                              {
                                nugget.title
                              }
                            </h2>
                          </Link>

                          <p className="mt-2 text-[10px] italic text-white/30">
                            {
                              nugget.scriptureRef
                            }
                          </p>

                          <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                            <Link
                              href={`/nugget/${nugget.slug}`}
                              className="text-[10px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
                            >
                              Listen
                              &amp;
                              Read
                            </Link>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFolderMenuFor(
                                    nugget.id,
                                  );

                                  setFolderMessage(
                                    "",
                                  );
                                }}
                                className="rounded-md border border-white/10 px-2.5 py-1.5 text-[9px] text-white/50 transition hover:border-[#C8A35A]/40 hover:text-[#C8A35A]"
                              >
                                Add to
                                Folder
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  removeSavedNugget(
                                    nugget.id,
                                  )
                                }
                                aria-label={`Remove ${nugget.title} from saved Nuggets`}
                                className="text-[#C8A35A] transition hover:text-red-400"
                              >
                                <Trash2
                                  size={
                                    14
                                  }
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}

            {/* NO SEARCH RESULTS */}

            {!loading &&
              !error &&
              savedNuggets.length >
                0 &&
              visibleNuggets.length ===
                0 && (
                <div className="py-16 text-center">
                  <Search
                    size={27}
                    className="mx-auto text-white/20"
                  />

                  <h2 className="mt-4 font-serif text-[20px]">
                    No matching
                    Nuggets
                  </h2>

                  <p className="mt-2 text-[11px] text-white/30">
                    Try another
                    search or filter.
                  </p>
                </div>
              )}

            {/* NO SAVED NUGGETS */}

            {!loading &&
              !error &&
              savedNuggets.length ===
                0 && (
                <div className="py-16 text-center">
                  <Bookmark
                    size={29}
                    className="mx-auto text-[#C8A35A]"
                  />

                  <h2 className="mt-4 font-serif text-[20px]">
                    No saved Nuggets
                    yet
                  </h2>

                  <p className="mt-2 text-[11px] text-white/30">
                    Save Nuggets
                    from the Library
                    and they will
                    appear here.
                  </p>

                  <Link
                    href="/library"
                    className="bn-button mt-5 inline-flex rounded-md bg-[#C8A35A] px-5 py-2.5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                  >
                    Browse Library
                  </Link>
                </div>
              )}
          </section>

          {/* =================================================
              CUSTOM FOLDERS
          ================================================= */}

          <section className="py-12">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-serif text-[28px] leading-tight">
                  Custom Folders
                </h2>

                <p className="mt-2 text-[13px] leading-6 text-white/35">
                  Organize your
                  saved Nuggets into
                  focused business
                  folders.
                </p>
              </div>

              <Link
                href="/library/saved-nuggets/create-folder"
                className="bn-button flex w-fit items-center gap-2 rounded-md bg-[#C8A35A] px-5 py-2.5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
              >
                <FolderPlus
                  size={15}
                />

                Create Folder
              </Link>
            </div>

            {/* NO FOLDERS */}

            {folders.length ===
            0 ? (
              <div className="mt-8 flex min-h-[220px] flex-col items-center justify-center rounded-[10px] border border-white/10 bg-[#111111] px-6 text-center">
                <FolderOpen
                  size={27}
                  className="text-[#C8A35A]"
                />

                <h3 className="mt-4 font-serif text-[20px]">
                  No custom
                  folders yet
                </h3>

                <p className="mt-2 max-w-md text-[11px] leading-6 text-white/35">
                  Create folders to
                  group saved
                  Nuggets around
                  specific business
                  topics.
                </p>

                <Link
                  href="/library/saved-nuggets/create-folder"
                  className="mt-5 text-[11px] font-medium text-[#C8A35A]"
                >
                  Create your first
                  folder →
                </Link>
              </div>
            ) : (
              /* FOLDER CARDS */

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {folders.map(
                  (
                    folder,
                  ) => (
                    <Link
                      key={
                        folder.id
                      }
                      href={`/library/saved-nuggets/folder/${folder.id}`}
                      className="group rounded-[10px] border border-white/10 bg-[#111111] p-5 transition hover:border-[#C8A35A]/40"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C8A35A]/20 bg-[#C8A35A]/[0.05] text-[#C8A35A]">
                          <FolderOpen
                            size={
                              16
                            }
                          />
                        </div>

                        <span className="text-[9px] uppercase tracking-[0.08em] text-white/20">
                          {
                            folder
                              .items
                              ?.length ??
                            0
                          }{" "}
                          {(folder
                            .items
                            ?.length ??
                            0) ===
                          1
                            ? "Nugget"
                            : "Nuggets"}
                        </span>
                      </div>

                      <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                        Saved Folder
                      </p>

                      <h3 className="mt-2 font-serif text-[18px] text-white/90 transition group-hover:text-[#C8A35A]">
                        {
                          folder.name
                        }
                      </h3>

                      {folder.description && (
                        <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-white/35">
                          {
                            folder.description
                          }
                        </p>
                      )}

                      <span className="mt-5 inline-block text-[10px] font-medium text-[#C8A35A]">
                        Open Folder →
                      </span>
                    </Link>
                  ),
                )}
              </div>
            )}
          </section>
        </main>

        {/* ===================================================
            ADD TO FOLDER MODAL
        =================================================== */}

        {folderMenuFor && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-5"
            onMouseDown={(
              event,
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setFolderMenuFor(
                  null,
                );

                setFolderMessage(
                  "",
                );
              }
            }}
          >
            <div className="w-full max-w-[460px] rounded-[10px] border border-white/10 bg-[#111111] p-6 shadow-2xl">
              {/* HEADER */}

              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                    Saved Nuggets
                  </p>

                  <h2 className="mt-2 font-serif text-[24px]">
                    Add to Folder
                  </h2>

                  <p className="mt-2 text-[11px] leading-5 text-white/35">
                    Choose one of
                    your saved
                    folders for this
                    Nugget.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => {
                    setFolderMenuFor(
                      null,
                    );

                    setFolderMessage(
                      "",
                    );
                  }}
                  className="text-[18px] text-white/30 transition hover:text-white"
                >
                  <span aria-hidden="true" data-button-icon="small">×</span>
                </button>
              </div>

              {/* MESSAGE */}

              {folderMessage && (
                <div className="mt-4 rounded-md border border-[#C8A35A]/25 bg-[#C8A35A]/[0.06] px-4 py-3">
                  <p className="text-[11px] text-[#E0C48A]">
                    {
                      folderMessage
                    }
                  </p>
                </div>
              )}

              {/* FOLDERS */}

              <div className="mt-6 max-h-[340px] space-y-3 overflow-y-auto pr-1">
                {folders.length ===
                0 ? (
                  <div className="rounded-lg border border-white/10 bg-[#18181B] px-5 py-7 text-center">
                    <FolderPlus
                      size={22}
                      className="mx-auto text-[#C8A35A]"
                    />

                    <h3 className="mt-3 font-serif text-[17px]">
                      No saved
                      folders
                    </h3>

                    <p className="mt-2 text-[10px] leading-5 text-white/35">
                      Create a folder
                      before
                      organising your
                      saved Nuggets.
                    </p>
                  </div>
                ) : (
                  folders.map(
                    (
                      folder,
                    ) => {
                      const alreadyAdded =
                        folder.items?.some(
                          (
                            item,
                          ) =>
                            String(
                              item.nuggetId,
                            ) ===
                            String(
                              folderMenuFor,
                            ),
                        ) ??
                        false;

                      return (
                        <button
                          key={
                            folder.id
                          }
                          type="button"
                          disabled={
                            addingToFolder ||
                            alreadyAdded
                          }
                          onClick={() =>
                            addNuggetToFolder(
                              folder.id,
                              folderMenuFor,
                            )
                          }
                          className={`flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-4 text-left transition ${
                            alreadyAdded
                              ? "cursor-default border-[#C8A35A]/20 bg-[#C8A35A]/[0.05]"
                              : "border-white/10 bg-[#19191D] hover:border-[#C8A35A]/40"
                          } disabled:opacity-60`}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-serif text-[15px] text-white/85">
                              {
                                folder.name
                              }
                            </p>

                            <p className="mt-1 text-[10px] text-white/30">
                              {
                                folder
                                  .items
                                  ?.length ??
                                0
                              }{" "}
                              {(folder
                                .items
                                ?.length ??
                                0) ===
                              1
                                ? "Nugget"
                                : "Nuggets"}
                            </p>

                            {folder.description && (
                              <p className="mt-1 line-clamp-1 text-[9px] text-white/25">
                                {
                                  folder.description
                                }
                              </p>
                            )}
                          </div>

                          <span
                            className={`shrink-0 text-[10px] font-medium ${
                              alreadyAdded
                                ? "text-[#C8A35A]/60"
                                : "text-[#C8A35A]"
                            }`}
                          >
                            {alreadyAdded
                              ? "Added"
                              : addingToFolder
                                ? "..."
                                : "Add"}
                          </span>
                        </button>
                      );
                    },
                  )
                )}
              </div>

              {/* ACTIONS */}

              <div className="mt-6 border-t border-white/[0.07] pt-5">
                <Link
                  href="/library/saved-nuggets/create-folder"
                  className="bn-button flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#C8A35A] px-4 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                >
                  <FolderPlus
                    size={14}
                  />

                  Create New
                  Folder
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setFolderMenuFor(
                      null,
                    );

                    setFolderMessage(
                      "",
                    );
                  }}
                  className="mt-2 w-full px-4 py-2 text-[10px] text-white/35 transition hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}