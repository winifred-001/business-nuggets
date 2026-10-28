"use client";

import { nuggetExcerpt } from "@/lib/nugget-text";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  ListMusic,
  Plus,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { API_URL } from "@/lib/api";
import { nuggets } from "@/lib/nuggets";

type PlaylistItem = {
  id: number;
  playlistId: number;
  nuggetId: string;
  createdAt: string;
};

type Playlist = {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
  items: PlaylistItem[];
};

export default function PlaylistsPage() {
  const [playlists, setPlaylists] =
    useState<Playlist[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =========================================================
     LOAD PLAYLISTS
  ========================================================= */

  async function loadPlaylists() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setError(
        "Please log in to view your playlists.",
      );

      setLoading(false);

      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/playlists`,
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

      if (!response.ok) {
        setError(
          Array.isArray(
            data.message,
          )
            ? data.message.join(
                ", ",
              )
            : data.message ||
                "Could not load playlists.",
        );

        return;
      }

      setPlaylists(
        Array.isArray(data)
          ? data
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
    loadPlaylists();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        {/* HEADER */}

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="bn-hero-title font-serif text-[40px] leading-tight text-white">
              My Playlists
            </h1>

            <p className="mt-3 max-w-2xl text-[13px] leading-6 text-white/40">
              Premium audio modules
              structured for specific
              executive development paths.
            </p>
          </div>

          <Link
            href="/library/playlist/create"
            className="bn-button flex w-fit items-center gap-2 rounded-md bg-[#C8A35A] px-4 py-2.5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
          >
            <Plus size={14} />

            Create New Playlist
          </Link>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-[190px] animate-pulse rounded-xl border border-white/10 bg-[#101010]"
                />
              ),
            )}
          </div>
        )}

        {/* ERROR */}

        {!loading &&
          error && (
            <div className="mt-10 rounded-lg border border-red-500/20 bg-red-500/[0.04] p-4 text-[12px] text-red-300">
              {error}
            </div>
          )}

        {/* EMPTY STATE */}

        {!loading &&
          !error &&
          playlists.length ===
            0 && (
            <div className="mt-10 flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-white/10 bg-[#101010] px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black">
                <ListMusic
                  size={20}
                  className="text-[#C8A35A]"
                />
              </div>

              <h2 className="mt-4 font-serif text-[20px] text-white">
                No playlists yet
              </h2>

              <p className="mt-2 max-w-md text-[11px] leading-6 text-white/40">
                Create a playlist
                to organise Business
                Nuggets into focused
                learning paths.
              </p>

              <Link
                href="/library/playlist/create"
                className="bn-button mt-5 flex items-center gap-2 rounded-md bg-[#C8A35A] px-4 py-2.5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
              >
                <Plus
                  size={14}
                />

                Create New Playlist
              </Link>
            </div>
          )}

        {/* PLAYLIST CARDS */}

        {!loading &&
          !error &&
          playlists.length >
            0 && (
            <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {playlists.map(
                (
                  playlist,
                ) => (
                  <PlaylistCard
                    key={
                      playlist.id
                    }
                    playlist={
                      playlist
                    }
                  />
                ),
              )}
            </div>
          )}
      </main>

      <Footer />
    </div>
  );
}

/* =========================================================
   PLAYLIST CARD
========================================================= */

function PlaylistCard({
  playlist,
}: {
  playlist: Playlist;
}) {
  const playlistNuggets =
    useMemo(() => {
      const ids =
        new Set(
          playlist.items.map(
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
      playlist.items,
    ]);

  const previewNuggets =
    playlistNuggets.slice(
      0,
      4,
    );

  const totalSeconds =
    playlistNuggets.reduce(
      (
        total,
        nugget,
      ) => {
        if (
          !nugget.duration
        ) {
          return total;
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
          return total;
        }

        if (
          parts.length ===
          2
        ) {
          return (
            total +
            parts[0] *
              60 +
            parts[1]
          );
        }

        if (
          parts.length ===
          3
        ) {
          return (
            total +
            parts[0] *
              3600 +
            parts[1] *
              60 +
            parts[2]
          );
        }

        return total;
      },
      0,
    );

  const totalMinutes =
    Math.ceil(
      totalSeconds /
        60,
    );

  const description =
    playlistNuggets.length >
    0
      ? nuggetExcerpt(playlistNuggets[0].keyPrinciple)
      : "Build a focused collection of business nuggets for your learning path.";

  return (
    <article className="group flex min-h-[195px] flex-col rounded-xl border border-white/10 bg-[#101010] p-5 transition hover:border-[#C8A35A]/30">
      <div className="flex gap-4">
        <PlaylistPreview
          nuggets={
            previewNuggets
          }
        />

        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-[18px] leading-snug text-white">
            {playlist.name}
          </h2>

          <p className="mt-1 text-[10px] text-white/35">
            {
              playlist.items
                .length
            }{" "}
            {playlist.items
              .length === 1
              ? "Nugget"
              : "Nuggets"}

            {totalMinutes >
              0 && (
              <>
                {" "}
                •{" "}
                {
                  totalMinutes
                }{" "}
                mins
              </>
            )}
          </p>
        </div>
      </div>

      <p className="mt-5 line-clamp-2 text-[11px] leading-5 text-white/40">
        {description}
      </p>

      <Link
        href={`/library/playlist/${playlist.id}`}
        className="mt-auto flex items-center justify-between pt-5 text-[11px] font-medium text-[#C8A35A]"
      >
        <span>
          Open Playlist
        </span>

        <ArrowRight
          size={14}
          className="transition-transform group-hover:translate-x-1"
        />
      </Link>
    </article>
  );
}

/* =========================================================
   PREVIEW
========================================================= */

function PlaylistPreview({
  nuggets: playlistNuggets,
}: {
  nuggets: typeof nuggets;
}) {
  if (
    playlistNuggets.length ===
    0
  ) {
    return (
      <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#181818]">
        <ListMusic
          size={20}
          className="text-[#C8A35A]"
        />
      </div>
    );
  }

  return (
    <div className="grid h-[82px] w-[82px] shrink-0 grid-cols-2 grid-rows-2 overflow-hidden rounded-md bg-[#181818]">
      {[0, 1, 2, 3].map(
        (index) => {
          const nugget =
            playlistNuggets[
              index %
                playlistNuggets.length
            ];

          return (
            <div
              key={index}
              className="relative overflow-hidden"
            >
              <Image
                src={
                  nugget.image
                }
                alt=""
                fill
                sizes="41px"
                className="object-cover"
              />
            </div>
          );
        },
      )}
    </div>
  );
}