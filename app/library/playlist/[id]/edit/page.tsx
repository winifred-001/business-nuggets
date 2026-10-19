"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  GripVertical,
  Lock,
  Trash2,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import AuthRouteGuard from "@/components/AuthRouteGuard";

import { API_URL } from "@/lib/api";

type PlaylistItem = {
  id: number;
  playlistId: number;
  nuggetId: string;
  createdAt: string;
};

type Playlist = {
  id: number;
  name: string;
  userId?: number;
  createdAt?: string;
  items: PlaylistItem[];
};

type Nugget = {
  id: string;
  slug: string;
  title: string;
  scriptureRef?: string;
  image?: string;
  duration?: string;
};

export default function EditPlaylistPage() {
  const params = useParams();
  const router = useRouter();

  const playlistId =
    Number(params.id);

  const [playlist, setPlaylist] =
    useState<Playlist | null>(null);

  const [nuggets, setNuggets] =
    useState<Nugget[]>([]);

  const [name, setName] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [removingId, setRemovingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =========================================================
     LOAD PLAYLIST + NUGGETS
  ========================================================= */

  async function loadPlaylist() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [
        playlistResponse,
        nuggetsResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/playlists`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        ),

        fetch(
          `${API_URL}/nuggets`,
        ),
      ]);

      const playlistData =
        await playlistResponse
          .json()
          .catch(() => []);

      const nuggetsData =
        await nuggetsResponse
          .json()
          .catch(() => []);

      if (!playlistResponse.ok) {
        setError(
          playlistData.message ||
            "Could not load playlist.",
        );

        return;
      }

      const found =
        Array.isArray(
          playlistData,
        )
          ? playlistData.find(
              (
                item: Playlist,
              ) =>
                Number(item.id) ===
                playlistId,
            )
          : null;

      if (!found) {
        setError(
          "Playlist not found.",
        );

        return;
      }

      setPlaylist(found);

      setName(
        found.name || "",
      );

      setNuggets(
        nuggetsResponse.ok &&
          Array.isArray(
            nuggetsData,
          )
          ? nuggetsData
          : [],
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
        playlistId,
      )
    ) {
      setError(
        "Invalid playlist.",
      );

      setLoading(false);
      return;
    }

    loadPlaylist();
  }, [playlistId]);

  /* =========================================================
     NUGGETS IN PLAYLIST
  ========================================================= */

  const playlistNuggets =
    useMemo(() => {
      if (!playlist) {
        return [];
      }

      return playlist.items
        .map((item) => {
          const nugget =
            nuggets.find(
              (nugget) =>
                String(
                  nugget.id,
                ) ===
                String(
                  item.nuggetId,
                ),
            );

          return nugget
            ? {
                ...nugget,
                playlistItemId:
                  item.id,
              }
            : null;
        })
        .filter(
          Boolean,
        ) as Array<
        Nugget & {
          playlistItemId: number;
        }
      >;
    }, [
      playlist,
      nuggets,
    ]);

  /* =========================================================
     TOTAL DURATION
  ========================================================= */

  const totalMinutes =
    useMemo(() => {
      let totalSeconds = 0;

      playlistNuggets.forEach(
        (nugget) => {
          if (
            !nugget.duration
          ) {
            return;
          }

          const parts =
            nugget.duration
              .split(":")
              .map(Number);

          if (
            parts.some(
              Number.isNaN,
            )
          ) {
            return;
          }

          if (
            parts.length === 2
          ) {
            totalSeconds +=
              parts[0] * 60 +
              parts[1];
          }

          if (
            parts.length === 3
          ) {
            totalSeconds +=
              parts[0] *
                3600 +
              parts[1] *
                60 +
              parts[2];
          }
        },
      );

      return Math.ceil(
        totalSeconds / 60,
      );
    }, [
      playlistNuggets,
    ]);

  /* =========================================================
     SAVE NAME
  ========================================================= */

  async function saveChanges() {
    const token =
      localStorage.getItem("token");

    if (
      !token ||
      !playlist
    ) {
      return;
    }

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      setError(
        "Enter a playlist name.",
      );

      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `${API_URL}/playlists/${playlist.id}`,
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
                name:
                  trimmedName,
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
                "Could not update playlist.",
        );

        return;
      }

      setPlaylist(
        (current) =>
          current
            ? {
                ...current,
                name:
                  trimmedName,
              }
            : current,
      );

      setSuccess(
        "Playlist changes saved.",
      );
    } catch {
      setError(
        "Could not update playlist.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     REMOVE NUGGET
  ========================================================= */

  async function removeNugget(
    nuggetId: string,
  ) {
    const token =
      localStorage.getItem("token");

    if (
      !token ||
      !playlist
    ) {
      return;
    }

    setRemovingId(
      nuggetId,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `${API_URL}/playlists/${playlist.id}/items/${nuggetId}`,
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
            .catch(() => ({}));

        setError(
          data.message ||
            "Could not remove Nugget.",
        );

        return;
      }

      setPlaylist(
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

      setSuccess(
        "Nugget removed from playlist.",
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

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
          {/* BACK */}

          <Link
            href={`/library/playlist/${playlistId}`}
            className="text-[11px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
          >
            ← Back to Playlist
          </Link>

          {/* HEADER */}

          <section className="mt-4">
            <h1 className="font-serif text-[40px] leading-tight">
              Edit Playlist
            </h1>

            <p className="mt-3 text-[13px] leading-6 text-white/40">
              Update the details and
              order of your listening
              path.
            </p>
          </section>

          {/* LOADING */}

          {loading && (
            <p className="mt-10 text-[12px] text-white/35">
              Loading playlist...
            </p>
          )}

          {!loading &&
            error &&
            !playlist && (
              <div className="mt-8 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-4">
                <p className="text-[12px] text-red-400">
                  {error}
                </p>
              </div>
            )}

          {!loading &&
            playlist && (
              <div className="mt-8 grid gap-7 lg:grid-cols-[360px_minmax(0,1fr)]">
                {/* =========================================
                    LEFT — DETAILS
                ========================================= */}

                <section className="h-fit rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
                  <h2 className="font-serif text-[20px]">
                    Details &amp;
                    Privacy
                  </h2>

                  {/* NAME */}

                  <div className="mt-6">
                    <label
                      htmlFor="playlist-name"
                      className="mb-2 block text-[10px] font-semibold text-white/55"
                    >
                      Playlist Name
                    </label>

                    <input
                      id="playlist-name"
                      type="text"
                      value={name}
                      onChange={(
                        event,
                      ) =>
                        setName(
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="Playlist name"
                      className="h-11 w-full rounded-md border border-white/10 bg-[#19191D] px-4 text-[12px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/60"
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div className="mt-5">
                    <label className="mb-2 block text-[10px] font-semibold text-white/55">
                      Description
                    </label>

                    <div className="rounded-md border border-white/[0.07] bg-[#151515] px-4 py-3">
                      <p className="text-[11px] leading-5 text-white/30">
                        Playlist
                        descriptions
                        are not stored
                        by the backend
                        yet.
                      </p>
                    </div>
                  </div>

                  {/* PRIVACY */}

                  <div className="mt-5">
                    <p className="mb-2 text-[10px] font-semibold text-white/55">
                      Privacy
                    </p>

                    <div className="rounded-md border border-[#C8A35A]/40 bg-[#C8A35A]/[0.10] p-4">
                      <div className="flex gap-3">
                        <span className="mt-0.5 text-[#C8A35A]">
                          <Lock
                            size={
                              15
                            }
                          />
                        </span>

                        <div>
                          <p className="text-[12px] font-medium text-[#F5F0E8]">
                            Private
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-white/35">
                            Only you
                            can access
                            this
                            playlist
                            in your
                            workspace.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 text-[10px] leading-5 text-white/25">
                    Playlist sharing
                    is not enabled
                    yet, so existing
                    playlists remain
                    private to the
                    signed-in user.
                  </p>
                </section>

                {/* =========================================
                    RIGHT — PLAYLIST ITEMS
                ========================================= */}

                <section>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                      {
                        playlistNuggets.length
                      }{" "}
                      {playlistNuggets.length ===
                      1
                        ? "item"
                        : "items"}

                      {totalMinutes >
                        0 &&
                        ` • ${totalMinutes} min total duration`}
                    </p>
                  </div>

                  {/* ITEMS */}

                  <div className="mt-4 space-y-3">
                    {playlistNuggets.length ===
                    0 ? (
                      <div className="rounded-lg border border-white/10 bg-[#111111] px-5 py-10 text-center">
                        <p className="text-[12px] text-white/35">
                          This playlist
                          has no
                          Nuggets yet.
                        </p>

                        <Link
                          href="/library"
                          className="mt-3 inline-block text-[11px] text-[#C8A35A]"
                        >
                          Browse Library
                          →
                        </Link>
                      </div>
                    ) : (
                      playlistNuggets.map(
                        (
                          nugget,
                          index,
                        ) => (
                          <article
                            key={
                              nugget.id
                            }
                            className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#111111] p-3 sm:gap-4"
                          >
                            {/* POSITION */}

                            <div className="hidden shrink-0 items-center gap-2 text-white/20 sm:flex">
                              <GripVertical
                                size={
                                  15
                                }
                              />

                              <span className="w-4 text-[9px]">
                                {String(
                                  index +
                                    1,
                                ).padStart(
                                  2,
                                  "0",
                                )}
                              </span>
                            </div>

                            {/* IMAGE */}

                            {nugget.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  nugget.image
                                }
                                alt=""
                                className="h-14 w-14 shrink-0 rounded-md object-cover"
                              />
                            ) : (
                              <div className="h-14 w-14 shrink-0 rounded-md bg-[#19191D]" />
                            )}

                            {/* INFO */}

                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/nugget/${nugget.slug}`}
                                className="font-serif text-[15px] leading-5 text-white/85 transition hover:text-[#C8A35A]"
                              >
                                {
                                  nugget.title
                                }
                              </Link>

                              <p className="mt-1 text-[10px] text-white/30">
                                {
                                  nugget.scriptureRef
                                }

                                {nugget.duration &&
                                  ` • ${nugget.duration}`}
                              </p>
                            </div>

                            {/* REMOVE */}

                            <button
                              type="button"
                              disabled={
                                removingId ===
                                nugget.id
                              }
                              onClick={() =>
                                removeNugget(
                                  nugget.id,
                                )
                              }
                              className="inline-flex shrink-0 items-center gap-2 px-2 py-2 text-[10px] text-[#C8A35A] transition hover:text-red-400 disabled:opacity-40"
                            >
                              <Trash2
                                size={
                                  13
                                }
                              />

                              <span className="hidden sm:inline">
                                {removingId ===
                                nugget.id
                                  ? "Removing..."
                                  : "Remove"}
                              </span>
                            </button>
                          </article>
                        ),
                      )
                    )}
                  </div>

                  {/* NOTE */}

                  {playlistNuggets.length >
                    1 && (
                    <p className="mt-4 text-[10px] leading-5 text-white/25">
                      The current
                      playlist order
                      is shown above.
                      Drag-and-drop
                      reordering will
                      be connected
                      when playlist
                      item positions
                      are added to
                      the backend.
                    </p>
                  )}

                  {/* FEEDBACK */}

                  {error && (
                    <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                      <p className="text-[11px] text-red-400">
                        {error}
                      </p>
                    </div>
                  )}

                  {success && (
                    <div className="mt-5 rounded-md border border-[#C8A35A]/25 bg-[#C8A35A]/[0.06] px-4 py-3">
                      <p className="text-[11px] text-[#E0C48A]">
                        {success}
                      </p>
                    </div>
                  )}

                  {/* ACTIONS */}

                  <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
                    <Link
                      href={`/library/playlist/${playlist.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 px-4 text-[11px] text-white/55 transition hover:border-white/20 hover:text-white"
                    >
                      Cancel - Playlist
                      Detail
                    </Link>

                    <button
                      type="button"
                      onClick={
                        saveChanges
                      }
                      disabled={
                        saving ||
                        !name.trim()
                      }
                      className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#C8A35A] px-5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </section>
              </div>
            )}
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}