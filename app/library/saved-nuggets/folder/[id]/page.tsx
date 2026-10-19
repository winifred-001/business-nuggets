"use client";

import Image from "next/image";
import Link from "next/link";

import {
  FolderOpen,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import AuthRouteGuard from "@/components/AuthRouteGuard";

import { API_URL } from "@/lib/api";
import { getPublishedNuggets } from "@/lib/nuggets-api";

import type { Nugget } from "@/types/nugget";

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
  userId: number;
  createdAt: string;
  updatedAt?: string;
  items: SavedFolderItem[];
};

export default function SavedFolderDetailPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const folderId =
    Number(params.id);

  const [
    folder,
    setFolder,
  ] =
    useState<SavedFolder | null>(
      null,
    );

  const [
    nuggets,
    setNuggets,
  ] =
    useState<Nugget[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    removingId,
    setRemovingId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    showDelete,
    setShowDelete,
  ] =
    useState(false);

  /* =========================================
     LOAD FOLDER
  ========================================= */

  async function loadFolder() {
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
        folderResponse,
        publishedNuggets,
      ] =
        await Promise.all([
          fetch(
            `${API_URL}/saved-folders`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          ),

          getPublishedNuggets(),
        ]);

      const folderData =
        await folderResponse
          .json()
          .catch(
            () => [],
          );

      if (
        !folderResponse.ok
      ) {
        setError(
          folderData.message ||
            "Could not load folder.",
        );

        return;
      }

      const found =
        Array.isArray(
          folderData,
        )
          ? folderData.find(
              (
                item: SavedFolder,
              ) =>
                Number(
                  item.id,
                ) ===
                folderId,
            )
          : null;

      if (!found) {
        setError(
          "Saved folder not found.",
        );

        return;
      }

      setFolder(found);

      setNuggets(
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

  useEffect(() => {
    if (
      Number.isNaN(
        folderId,
      )
    ) {
      setError(
        "Invalid folder.",
      );

      setLoading(false);

      return;
    }

    loadFolder();
  }, [folderId]);

  /* =========================================
     FOLDER NUGGETS
  ========================================= */

  const folderNuggets =
    useMemo(() => {
      if (!folder) {
        return [];
      }

      const ids =
        new Set(
          folder.items.map(
            (item) =>
              item.nuggetId,
          ),
        );

      return nuggets.filter(
        (nugget) =>
          ids.has(
            nugget.id,
          ),
      );
    }, [
      folder,
      nuggets,
    ]);

  /* =========================================
     REMOVE ITEM
  ========================================= */

  async function removeFromFolder(
    nuggetId: string,
  ) {
    const token =
      localStorage.getItem(
        "token",
      );

    if (
      !token ||
      !folder
    ) {
      return;
    }

    setRemovingId(
      nuggetId,
    );

    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/saved-folders/${folder.id}/items/${nuggetId}`,
          {
            method:
              "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(
              () => ({}),
            );

        setError(
          data.message ||
            "Could not remove Nugget.",
        );

        return;
      }

      setFolder(
        (current) =>
          current
            ? {
                ...current,

                items:
                  current.items.filter(
                    (item) =>
                      String(
                        item.nuggetId,
                      ) !==
                      String(
                        nuggetId,
                      ),
                  ),
              }
            : current,
      );
    } catch {
      setError(
        "Could not remove Nugget.",
      );
    } finally {
      setRemovingId(
        null,
      );
    }
  }

  /* =========================================
     DELETE FOLDER
  ========================================= */

  async function deleteFolder() {
    const token =
      localStorage.getItem(
        "token",
      );

    if (
      !token ||
      !folder
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/saved-folders/${folder.id}`,
          {
            method:
              "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(
              () => ({}),
            );

        setError(
          data.message ||
            "Could not delete folder.",
        );

        return;
      }

      router.push(
        "/library/saved-nuggets",
      );

      router.refresh();
    } catch {
      setError(
        "Could not delete folder.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
          <Link
            href="/library/saved-nuggets"
            className="text-[11px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
          >
            ← Saved Nuggets
          </Link>

          {loading && (
            <p className="mt-10 text-[12px] text-white/35">
              Loading folder...
            </p>
          )}

          {!loading &&
            error &&
            !folder && (
              <div className="mt-8 rounded-md border border-red-500/20 bg-red-500/[0.05] p-4">
                <p className="text-[12px] text-red-400">
                  {error}
                </p>
              </div>
            )}

          {!loading &&
            folder && (
              <>
                {/* HEADER */}

                <section className="mt-5 flex flex-col gap-6 border-b border-white/[0.07] pb-8 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                      Saved Folder
                    </p>

                    <h1 className="mt-2 font-serif text-[40px] leading-tight">
                      {
                        folder.name
                      }
                    </h1>

                    {folder.description && (
                      <p className="mt-3 max-w-[680px] text-[13px] leading-6 text-white/40">
                        {
                          folder.description
                        }
                      </p>
                    )}

                    <p className="mt-3 text-[10px] text-white/25">
                      {
                        folder.items
                          .length
                      }{" "}
                      {folder.items
                        .length === 1
                        ? "saved Nugget"
                        : "saved Nuggets"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowDelete(
                        true,
                      )
                    }
                    className="inline-flex w-fit items-center gap-2 rounded-md border border-red-500/20 px-4 py-2.5 text-[11px] text-red-400 transition hover:bg-red-500/[0.05]"
                  >
                    <Trash2
                      size={14}
                    />

                    Delete Folder
                  </button>
                </section>

                {/* ERROR */}

                {error && (
                  <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                    <p className="text-[11px] text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                {/* EMPTY */}

                {folderNuggets.length ===
                0 ? (
                  <section className="mt-8 flex min-h-[300px] flex-col items-center justify-center rounded-[10px] border border-white/10 bg-[#111111] px-6 text-center">
                    <FolderOpen
                      size={28}
                      className="text-[#C8A35A]"
                    />

                    <h2 className="mt-4 font-serif text-[20px]">
                      This folder is
                      empty
                    </h2>

                    <p className="mt-2 text-[11px] leading-6 text-white/35">
                      Add saved
                      Nuggets to this
                      folder from your
                      Saved Nuggets
                      library.
                    </p>

                    <Link
                      href="/library/saved-nuggets"
                      className="mt-5 rounded-md bg-[#C8A35A] px-5 py-2.5 text-[11px] font-semibold text-[#080808]"
                    >
                      Back to Saved
                      Nuggets
                    </Link>
                  </section>
                ) : (
                  <section className="mt-8">
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {folderNuggets.map(
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
                              <div className="relative h-40 overflow-hidden bg-[#181818]">
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
                              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                                {
                                  nugget.tag
                                }
                              </p>

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
                                  className="text-[10px] font-medium text-[#C8A35A]"
                                >
                                  Listen &amp;
                                  Read →
                                </Link>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFromFolder(
                                      nugget.id,
                                    )
                                  }
                                  disabled={
                                    removingId ===
                                    nugget.id
                                  }
                                  aria-label={`Remove ${nugget.title} from folder`}
                                  className="inline-flex items-center gap-1 text-[10px] text-white/30 transition hover:text-red-400 disabled:opacity-40"
                                >
                                  <Trash2
                                    size={
                                      13
                                    }
                                  />

                                  {removingId ===
                                  nugget.id
                                    ? "Removing"
                                    : "Remove"}
                                </button>
                              </div>
                            </div>
                          </article>
                        ),
                      )}
                    </div>
                  </section>
                )}
              </>
            )}
        </main>

        <Footer />

        {/* DELETE MODAL */}

        {showDelete &&
          folder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-5">
              <div className="w-full max-w-[420px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
                <h2 className="font-serif text-[24px]">
                  Delete Saved
                  Folder?
                </h2>

                <p className="mt-3 text-[12px] leading-6 text-white/40">
                  This will delete{" "}
                  <span className="text-white/75">
                    {
                      folder.name
                    }
                  </span>
                  . Your Nuggets will
                  remain saved in your
                  main Saved Nuggets
                  library.
                </p>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={
                      deleting
                    }
                    onClick={() =>
                      setShowDelete(
                        false,
                      )
                    }
                    className="rounded-md border border-white/10 px-4 py-2.5 text-[11px] text-white/55"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      deleting
                    }
                    onClick={
                      deleteFolder
                    }
                    className="rounded-md bg-red-500 px-4 py-2.5 text-[11px] font-semibold text-white disabled:opacity-40"
                  >
                    {deleting
                      ? "Deleting..."
                      : "Delete Folder"}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </AuthRouteGuard>
  );
}