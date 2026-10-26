"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Clock3,
  GripVertical,
  Headphones,
  ListMusic,
  Pencil,
  Play,
  Trash2,
  X,
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

import { getPublishedNuggets } from "@/lib/nuggets-api";

import type { Nugget } from "@/types/nugget";

type PlaylistItem = {
  id: number;
  playlistId: number;
  nuggetId: string;
};

type Playlist = {
  id: number;
  name: string;
  userId: number;
  createdAt?: string;
  items: PlaylistItem[];
};

type ResolvedItem = {
  playlistItemId: number;
  nugget: Nugget;
};

export default function PlaylistDetailPage() {
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const playlistId = Number(
    params.id,
  );

  const [playlist, setPlaylist] =
    useState<Playlist | null>(null);

  const [nuggets, setNuggets] =
    useState<Nugget[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [editMode, setEditMode] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [removingId, setRemovingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    async function loadPlaylist() {
      const token =
        localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);

        const [
          playlistResponse,
          nuggetData,
        ] = await Promise.all([
          fetch(
            "http://localhost:3001/playlists",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          ),

          getPublishedNuggets(),
        ]);

        if (!playlistResponse.ok) {
          throw new Error(
            "Could not load playlists.",
          );
        }

        const playlists =
          (await playlistResponse.json()) as Playlist[];

        const found =
          playlists.find(
            (item) =>
              item.id === playlistId,
          ) ?? null;

        if (!found) {
          setError(
            "Playlist not found.",
          );

          setPlaylist(null);
          return;
        }

        setPlaylist(found);

        setNuggets(
          Array.isArray(nuggetData)
            ? nuggetData
            : [],
        );

        setError("");
      } catch (err) {
        console.error(err);

        setError(
          "Could not load this playlist.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlaylist();
  }, [playlistId, router]);

  const resolvedItems =
    useMemo<ResolvedItem[]>(() => {
      if (!playlist) {
        return [];
      }

      return playlist.items
        .map((item) => {
          const nugget =
            nuggets.find(
              (entry) =>
                entry.id ===
                item.nuggetId,
            );

          if (!nugget) {
            return null;
          }

          return {
            playlistItemId:
              item.id,

            nugget,
          };
        })
        .filter(
          (
            item,
          ): item is ResolvedItem =>
            Boolean(item),
        );
    }, [playlist, nuggets]);

  const firstNugget =
    resolvedItems[0]?.nugget ??
    null;

  const totalSeconds =
    useMemo(() => {
      return resolvedItems.reduce(
        (total, item) =>
          total +
          durationToSeconds(
            item.nugget.duration,
          ),
        0,
      );
    }, [resolvedItems]);

  const totalDuration =
    formatTotalDuration(
      totalSeconds,
    );

  async function removeNugget(
    nuggetId: string,
  ) {
    if (!playlist) return;

    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setRemovingId(nuggetId);

      const response = await fetch(
        `http://localhost:3001/playlists/${playlist.id}/items/${nuggetId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          "Could not remove item.",
        );
      }

      setPlaylist((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          items:
            current.items.filter(
              (item) =>
                item.nuggetId !==
                nuggetId,
            ),
        };
      });

      setMessage(
        "Nugget removed from playlist.",
      );
    } catch (err) {
      console.error(err);

      setMessage(
        "Could not remove this Nugget.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  async function deletePlaylist() {
    if (!playlist) return;

    const confirmed =
      window.confirm(
        `Delete "${playlist.name}"?`,
      );

    if (!confirmed) return;

    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `http://localhost:3001/playlists/${playlist.id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          "Could not delete playlist.",
        );
      }

      router.push("/library");
    } catch (err) {
      console.error(err);

      setMessage(
        "Could not delete the playlist.",
      );

      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:px-10">
          <div className="rounded-xl border border-white/10 bg-[#111111] p-10 text-center text-[14px] text-white/50">
            Loading playlist...
          </div>
        </main>
      </div>
    );
  }

  if (
    error ||
    !playlist
  ) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:px-10">
          <div className="rounded-xl border border-white/10 bg-[#111111] p-10 text-center">
            <h1 className="bn-hero-title font-serif text-[28px]">
              Playlist unavailable
            </h1>

            <p className="mt-3 text-[14px] text-white/45">
              {error}
            </p>

            <Link
              href="/library"
              className="bn-button mt-6 inline-flex rounded-lg bg-[#C8A35A] px-5 py-3 text-[13px] font-semibold text-[#080808]"
            >
              Back to Library
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main>
        <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-10">
          {/* PLAYLIST HEADER */}
          <section className="rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-7">
            <div className="grid gap-7 md:grid-cols-[190px_minmax(0,1fr)] md:items-center">
              {/* COVER */}
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <Image
                  src={
                    firstNugget?.image ??
                    "/images/playlist-details.png"
                  }
                  alt={playlist.name}
                  fill
                  priority
                  sizes="190px"
                  className="object-cover"
                />
              </div>

              {/* INFO */}
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C8A35A]">
                  Curated Personal Playlist
                </p>

                <h1 className="bn-hero-title mt-3 font-serif text-[40px] leading-tight">
                  {playlist.name}
                </h1>

                <p className="mt-3 max-w-[760px] text-[14px] leading-6 text-white/45">
                  Your personal collection of
                  biblical business wisdom,
                  saved together for focused
                  listening and study.
                </p>

                {playlist.createdAt && (
                  <p className="mt-3 text-[13px] text-white/30">
                    Created{" "}
                    {formatDate(
                      playlist.createdAt,
                    )}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-4 text-[13px] text-white/40">
                  <span>
                    {
                      resolvedItems.length
                    }{" "}
                    {resolvedItems.length ===
                    1
                      ? "item"
                      : "items"}
                  </span>

                  <span className="h-1 w-1 rounded-full bg-white/25" />

                  <span>
                    {totalDuration} Total
                    Duration
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {firstNugget ? (
                    <Link
                      href={`/nugget/${firstNugget.slug}/audio?playlist=${playlist.id}`}
                      className="bn-button inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#C8A35A] px-5 text-[13px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                    >
                      <Play
                        size={14}
                        fill="currentColor"
                      />

                      Play All
                    </Link>
                  ) : (
                    <button
                      disabled
                      type="button"
                      className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-lg bg-[#C8A35A]/40 px-5 text-[13px] font-semibold text-[#080808]/50"
                    >
                      <Play size={14} />

                      Play All
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setEditMode(
                        (current) =>
                          !current,
                      )
                    }
                    className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-5 text-[13px] font-medium transition ${
                      editMode
                        ? "border-[#C8A35A] bg-[#C8A35A]/10 text-[#C8A35A]"
                        : "border-white/15 text-white/65 hover:border-[#C8A35A]/50"
                    }`}
                  >
                    {editMode ? (
                      <X size={14} />
                    ) : (
                      <Pencil
                        size={14}
                      />
                    )}

                    {editMode
                      ? "Finish Editing"
                      : "Edit Playlist"}
                  </button>

                  <button
                    type="button"
                    disabled={deleting}
                    onClick={
                      deletePlaylist
                    }
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#B54A4A]/40 px-5 text-[13px] font-medium text-[#D66B6B] transition hover:bg-[#B54A4A]/10 disabled:opacity-50"
                  >
                    <Trash2
                      size={14}
                    />

                    {deleting
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>

                {message && (
                  <p className="mt-4 text-[13px] text-[#C8A35A]">
                    {message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* PLAYLIST ITEMS */}
          <section className="mt-8">
            {resolvedItems.length >
            0 ? (
              <div className="space-y-3">
                {resolvedItems.map(
                  (
                    item,
                    index,
                  ) => {
                    const nugget =
                      item.nugget;

                    return (
                      <div
                        key={
                          nugget.id
                        }
                        className="grid gap-4 rounded-lg border border-white/10 bg-[#111111] p-4 transition hover:border-[#C8A35A]/35 sm:grid-cols-[28px_36px_64px_minmax(0,1fr)_auto] sm:items-center"
                      >
                        {/* DRAG DECORATION */}
                        <GripVertical
                          size={15}
                          className="hidden text-white/20 sm:block"
                        />

                        {/* NUMBER */}
                        <span className="text-[13px] text-white/30">
                          {String(
                            index + 1,
                          ).padStart(
                            2,
                            "0",
                          )}
                        </span>

                        {/* IMAGE */}
                        <div className="relative h-14 w-16 overflow-hidden rounded-md">
                          <Image
                            src={
                              nugget.image
                            }
                            alt={
                              nugget.title
                            }
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>

                        {/* DETAILS */}
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#C8A35A]">
                            {nugget.tag ||
                              nugget.topic}
                          </p>

                          <Link
                            href={`/nugget/${nugget.slug}`}
                            className="mt-1 block truncate font-serif text-[16px] text-[#FAF9F6] transition hover:text-[#E0C48A]"
                          >
                            {nugget.title}
                          </Link>

                          <p className="mt-1 text-[12px] text-white/35">
                            {
                              nugget.scriptureRef
                            }
                          </p>
                        </div>

                        {/* RIGHT */}
                        <div className="flex items-center gap-3 sm:justify-end">
                          <Link
                            href={`/nugget/${nugget.slug}/musical`}
                            aria-label="Open Musical"
                            className="text-[#C8A35A] transition hover:text-[#E0C48A]"
                          >
                            <Headphones
                              size={
                                15
                              }
                            />
                          </Link>

                          <Link
                            href={`/nugget/${nugget.slug}`}
                            aria-label="Open Nugget"
                            className="text-white/45 transition hover:text-white"
                          >
                            <BookOpen
                              size={
                                15
                              }
                            />
                          </Link>

                          <span className="flex items-center gap-1.5 text-[12px] text-white/30">
                            <Clock3
                              size={
                                13
                              }
                            />

                            {
                              nugget.duration
                            }
                          </span>

                          <Link
                            href={`/nugget/${nugget.slug}/audio?playlist=${playlist.id}`}
                            aria-label={`Play ${nugget.title}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C8A35A]/40 text-[#C8A35A] transition hover:bg-[#C8A35A] hover:text-[#080808]"
                          >
                            <Play
                              size={
                                12
                              }
                              fill="currentColor"
                            />
                          </Link>

                          {editMode && (
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
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#B54A4A]/30 text-[#D66B6B] transition hover:bg-[#B54A4A]/10 disabled:opacity-40"
                              aria-label={`Remove ${nugget.title}`}
                            >
                              <Trash2
                                size={
                                  13
                                }
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#111111] p-10 text-center">
                <ListMusic
                  size={28}
                  className="mx-auto text-[#C8A35A]"
                />

                <h2 className="mt-4 font-serif text-[28px]">
                  This playlist is empty
                </h2>

                <p className="mt-2 text-[14px] text-white/45">
                  Add Nuggets from the audio
                  player or Nugget detail
                  screen.
                </p>

                <Link
                  href="/library"
                  className="bn-button mt-6 inline-flex rounded-lg bg-[#C8A35A] px-5 py-3 text-[13px] font-semibold text-[#080808]"
                >
                  Browse Library
                </Link>
              </div>
            )}
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function durationToSeconds(
  duration: string,
) {
  const parts = duration
    .split(":")
    .map(Number);

  if (
    parts.length !== 2 ||
    parts.some(Number.isNaN)
  ) {
    return 0;
  }

  return (
    parts[0] * 60 +
    parts[1]
  );
}

function formatTotalDuration(
  seconds: number,
) {
  if (!seconds) {
    return "0 Min";
  }

  const minutes =
    Math.floor(seconds / 60);

  const remainingSeconds =
    seconds % 60;

  if (minutes < 60) {
    return remainingSeconds
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes} Min`;
  }

  const hours =
    Math.floor(minutes / 60);

  const remainingMinutes =
    minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(
  value: string,
) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}