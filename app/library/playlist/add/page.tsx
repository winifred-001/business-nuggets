"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Check,
  ListMusic,
  Plus,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import AuthRouteGuard from "@/components/AuthRouteGuard";

import { API_URL } from "@/lib/api";

type Nugget = {
  id: string;
  slug: string;
  number?: number;
  title: string;
  scriptureRef?: string;
  image?: string;
  duration?: string;
};

type PlaylistItem = {
  id: number;
  playlistId: number;
  nuggetId: string;
  createdAt: string;
};

type Playlist = {
  id: number;
  name: string;
  items: PlaylistItem[];
  createdAt?: string;
};

export default function AddToPlaylistPage() {
  const router = useRouter();

  const [nuggetId, setNuggetId] =
    useState<string | null>(null);

  const [nugget, setNugget] =
    useState<Nugget | null>(null);

  const [playlists, setPlaylists] =
    useState<Playlist[]>([]);

  const [selectedIds, setSelectedIds] =
    useState<number[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* CREATE PLAYLIST */

  const [showCreate, setShowCreate] =
    useState(false);

  const [newPlaylistName, setNewPlaylistName] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  /* =========================================================
     LOAD SCREEN
  ========================================================= */

  useEffect(() => {
    async function loadPage() {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const params =
        new URLSearchParams(
          window.location.search,
        );

      const requestedNuggetId =
        params.get("nuggetId");

      setNuggetId(
        requestedNuggetId,
      );

      try {
        const [
          nuggetResponse,
          playlistResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/nuggets`,
          ),

          fetch(
            `${API_URL}/playlists`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          ),
        ]);

        const nuggetData =
          await nuggetResponse
            .json()
            .catch(() => []);

        const playlistData =
          await playlistResponse
            .json()
            .catch(() => []);

        if (
          nuggetResponse.ok &&
          requestedNuggetId &&
          Array.isArray(
            nuggetData,
          )
        ) {
          const found =
            nuggetData.find(
              (item: Nugget) =>
                String(item.id) ===
                String(
                  requestedNuggetId,
                ),
            ) ?? null;

          setNugget(found);
        }

        if (
          !playlistResponse.ok
        ) {
          setError(
            playlistData.message ||
              "Could not load your playlists.",
          );

          return;
        }

        setPlaylists(
          Array.isArray(
            playlistData,
          )
            ? playlistData
            : [],
        );
      } catch {
        setError(
          "Could not connect to the server.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, []);

  /* =========================================================
     ALREADY ADDED
  ========================================================= */

  function alreadyAdded(
    playlist: Playlist,
  ) {
    if (!nuggetId) {
      return false;
    }

    return (
      playlist.items?.some(
        (item) =>
          String(
            item.nuggetId,
          ) ===
          String(nuggetId),
      ) ?? false
    );
  }

  /* =========================================================
     SELECT PLAYLIST
  ========================================================= */

  function togglePlaylist(
    playlistId: number,
  ) {
    setSelectedIds(
      (current) =>
        current.includes(
          playlistId,
        )
          ? current.filter(
              (id) =>
                id !==
                playlistId,
            )
          : [
              ...current,
              playlistId,
            ],
    );
  }

  /* =========================================================
     ADD TO PLAYLISTS
  ========================================================= */

  async function handleAdd() {
    const token =
      localStorage.getItem("token");

    if (
      !token ||
      !nuggetId ||
      selectedIds.length === 0
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const results =
        await Promise.all(
          selectedIds.map(
            async (
              playlistId,
            ) => {
              const response =
                await fetch(
                  `${API_URL}/playlists/${playlistId}/items`,
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
                      JSON.stringify(
                        {
                          nuggetId,
                        },
                      ),
                  },
                );

              const data =
                await response
                  .json()
                  .catch(
                    () => ({}),
                  );

              return {
                playlistId,
                ok: response.ok,
                data,
              };
            },
          ),
        );

      const failed =
        results.filter(
          (result) =>
            !result.ok,
        );

      if (
        failed.length > 0
      ) {
        setError(
          "The Nugget could not be added to some selected playlists.",
        );

        return;
      }

      setSuccess(
        selectedIds.length === 1
          ? "Nugget added to playlist."
          : `Nugget added to ${selectedIds.length} playlists.`,
      );

      setPlaylists(
        (current) =>
          current.map(
            (playlist) =>
              selectedIds.includes(
                playlist.id,
              )
                ? {
                    ...playlist,

                    items: [
                      ...(playlist.items ||
                        []),

                      {
                        id:
                          Date.now() +
                          playlist.id,

                        playlistId:
                          playlist.id,

                        nuggetId,

                        createdAt:
                          new Date().toISOString(),
                      },
                    ],
                  }
                : playlist,
          ),
      );

      setSelectedIds([]);
    } catch {
      setError(
        "Could not add the Nugget to your playlists.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     CREATE NEW PLAYLIST
  ========================================================= */

  async function handleCreatePlaylist() {
    const token =
      localStorage.getItem("token");

    const name =
      newPlaylistName.trim();

    if (!token || !name) {
      return;
    }

    setCreating(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/playlists`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                name,
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
                "Could not create playlist.",
        );

        return;
      }

      const createdPlaylist: Playlist =
        {
          ...data,
          items:
            data.items || [],
        };

      setPlaylists(
        (current) => [
          ...current,
          createdPlaylist,
        ],
      );

      setSelectedIds(
        (current) => [
          ...current,
          createdPlaylist.id,
        ],
      );

      setNewPlaylistName(
        "",
      );

      setShowCreate(false);
    } catch {
      setError(
        "Could not create playlist.",
      );
    } finally {
      setCreating(false);
    }
  }

  /* =========================================================
     CANCEL LINK
  ========================================================= */

  const cancelHref =
    nugget?.slug
      ? `/nugget/${nugget.slug}`
      : "/library/playlist";

  const availableCount =
    useMemo(
      () =>
        playlists.filter(
          (playlist) =>
            !alreadyAdded(
              playlist,
            ),
        ).length,
      [playlists, nuggetId],
    );

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto flex w-full max-w-[1280px] flex-1 items-start justify-center px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <section className="w-full max-w-[760px] rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-7">
            {/* HEADER */}

            <h1 className="bn-hero-title font-serif text-[40px] leading-tight">
              Add to Playlist
            </h1>

            <p className="mt-3 text-[13px] leading-6 text-white/40">
              Choose a destination
              for this teaching.
              Your selected
              playlist is
              highlighted below.
            </p>

            {/* LOADING */}

            {loading && (
              <p className="mt-8 text-[12px] text-white/35">
                Loading your
                playlists...
              </p>
            )}

            {!loading && (
              <>
                {/* NUGGET */}

                {nugget ? (
                  <div className="mt-7 flex items-center gap-4 rounded-lg border border-[#C8A35A]/35 bg-[#C8A35A]/[0.07] p-4">
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
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[#1A1A1A] text-[#C8A35A]">
                        <ListMusic
                          size={
                            18
                          }
                        />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h2 className="font-serif text-[17px] leading-5 text-white">
                        {
                          nugget.title
                        }
                      </h2>

                      <p className="mt-1 text-[10px] text-white/35">
                        Nugget
                        {nugget.number
                          ? ` #${nugget.number}`
                          : ""}

                        {nugget.scriptureRef
                          ? ` • ${nugget.scriptureRef}`
                          : ""}

                        {nugget.duration
                          ? ` • ${nugget.duration}`
                          : ""}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-7 rounded-lg border border-[#C8A35A]/25 bg-[#C8A35A]/[0.05] p-4">
                    <p className="text-[12px] text-white/50">
                      No Nugget was
                      selected for this
                      playlist action.
                    </p>

                    <Link
                      href="/library"
                      className="mt-2 inline-block text-[11px] text-[#C8A35A]"
                    >
                      Choose a Nugget
                      from the Library →
                    </Link>
                  </div>
                )}

                {/* COUNT */}

                <div className="mt-7 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                    Select Playlist
                  </p>

                  <p className="text-[10px] text-white/30">
                    {
                      selectedIds.length
                    }{" "}
                    selected
                  </p>
                </div>

                {/* PLAYLIST LIST */}

                <div className="mt-3 space-y-3">
                  {playlists.length ===
                    0 && (
                    <div className="rounded-lg border border-white/10 bg-[#18181B] px-4 py-6 text-center">
                      <p className="text-[12px] text-white/40">
                        You have no
                        playlists yet.
                      </p>
                    </div>
                  )}

                  {playlists.map(
                    (
                      playlist,
                    ) => {
                      const selected =
                        selectedIds.includes(
                          playlist.id,
                        );

                      const exists =
                        alreadyAdded(
                          playlist,
                        );

                      return (
                        <button
                          key={
                            playlist.id
                          }
                          type="button"
                          disabled={
                            exists
                          }
                          onClick={() =>
                            togglePlaylist(
                              playlist.id,
                            )
                          }
                          className={`flex w-full items-center gap-4 rounded-lg border px-4 py-4 text-left transition ${
                            exists
                              ? "cursor-default border-white/[0.06] bg-[#0D0D0D] opacity-55"
                              : selected
                                ? "border-[#C8A35A]/60 bg-[#C8A35A]/[0.12]"
                                : "border-white/10 bg-[#19191D] hover:border-white/20"
                          }`}
                        >
                          {/* CHECKBOX */}

                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border ${
                              selected
                                ? "border-[#C8A35A] bg-[#C8A35A]"
                                : exists
                                  ? "border-[#C8A35A]/50 bg-[#C8A35A]/20"
                                  : "border-white/25"
                            }`}
                          >
                            {(selected ||
                              exists) && (
                              <Check
                                size={
                                  11
                                }
                                strokeWidth={
                                  3
                                }
                                className={
                                  selected
                                    ? "text-[#080808]"
                                    : "text-[#C8A35A]"
                                }
                              />
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-serif text-[15px] text-white/85">
                              {
                                playlist.name
                              }
                            </h3>

                            <p className="mt-1 text-[10px] text-white/30">
                              {
                                playlist
                                  .items
                                  ?.length ||
                                0
                              }{" "}
                              Nuggets
                            </p>
                          </div>

                          {exists && (
                            <span className="text-[9px] font-semibold uppercase tracking-[0.05em] text-[#C8A35A]">
                              Already
                              Added
                            </span>
                          )}
                        </button>
                      );
                    },
                  )}
                </div>

                {/* CREATE PLAYLIST */}

                <div className="mt-4">
                  {!showCreate ? (
                    <button
                      type="button"
                      onClick={() =>
                        setShowCreate(
                          true,
                        )
                      }
                      className="inline-flex items-center gap-2 text-[11px] font-medium text-white/65 transition hover:text-[#C8A35A]"
                    >
                      <Plus
                        size={
                          14
                        }
                      />
                      Create New
                      Playlist
                    </button>
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-[#18181B] p-4">
                      <label
                        htmlFor="playlist-name"
                        className="text-[10px] font-semibold text-white/50"
                      >
                        Playlist Name
                      </label>

                      <input
                        id="playlist-name"
                        type="text"
                        value={
                          newPlaylistName
                        }
                        onChange={(
                          event,
                        ) =>
                          setNewPlaylistName(
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="e.g. Wisdom for Strategic Decisions"
                        className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#111111] px-3 text-[12px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/50"
                      />

                      <div className="mt-3 flex justify-end gap-3">
                        <button
                          type="button"
                          disabled={
                            creating
                          }
                          onClick={() => {
                            setShowCreate(
                              false,
                            );

                            setNewPlaylistName(
                              "",
                            );
                          }}
                          className="px-3 py-2 text-[10px] text-white/40"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={
                            creating ||
                            !newPlaylistName.trim()
                          }
                          onClick={
                            handleCreatePlaylist
                          }
                          className="rounded-md bg-[#C8A35A] px-4 py-2 text-[10px] font-semibold text-[#080808] disabled:opacity-40"
                        >
                          {creating
                            ? "Creating..."
                            : "Create Playlist"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

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
                      {
                        success
                      }
                    </p>
                  </div>
                )}

                {/* ACTIONS */}

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
                  <Link
                    href={
                      cancelHref
                    }
                    className="bn-button inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 px-4 text-[11px] text-white/55 transition hover:border-white/20 hover:text-white"
                  >
                    Cancel
                  </Link>

                  <button
                    type="button"
                    onClick={
                      handleAdd
                    }
                    disabled={
                      saving ||
                      !nuggetId ||
                      selectedIds.length ===
                        0
                    }
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#C8A35A] px-5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving
                      ? "Adding..."
                      : selectedIds.length >
                          1
                        ? `Add to ${selectedIds.length} Playlists`
                        : "Add to Playlist"}
                  </button>
                </div>

                {availableCount ===
                  0 &&
                  playlists.length >
                    0 && (
                    <p className="mt-3 text-right text-[10px] text-white/25">
                      This Nugget is
                      already in all of
                      your playlists.
                    </p>
                  )}
              </>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}