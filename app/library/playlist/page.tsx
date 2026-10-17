"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ListMusic,
  Plus,
  X,
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
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [playlistName, setPlaylistName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function loadPlaylists() {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in to view your playlists.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/playlists`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Could not load playlists."
        );

        return;
      }

      setPlaylists(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlaylists();
  }, []);

  async function createPlaylist() {
    const token = localStorage.getItem("token");

    if (!token) return;

    const trimmedName = playlistName.trim();

    if (!trimmedName) {
      setCreateError("Enter a playlist name.");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const response = await fetch(
        `${API_URL}/playlists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: trimmedName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setCreateError(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Could not create playlist."
        );

        return;
      }

      setPlaylistName("");
      setShowCreateModal(false);

      await loadPlaylists();
    } catch {
      setCreateError("Could not connect to the server.");
    } finally {
      setCreating(false);
    }
  }

  function closeCreateModal() {
    if (creating) return;

    setShowCreateModal(false);
    setPlaylistName("");
    setCreateError("");
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              My Playlists
            </h1>

            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/40 sm:text-sm">
              Premium audio modules structured for specific
              executive development paths.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex w-fit items-center gap-2 rounded-md bg-[#C9A227] px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-[#DDB93A]"
          >
            <Plus size={14} />
            Create New Playlist
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[190px] animate-pulse rounded-xl border border-white/10 bg-[#101010]"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-10 rounded-lg border border-red-500/20 bg-red-500/[0.04] p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          playlists.length === 0 && (
            <div className="mt-10 flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-white/10 bg-[#101010] px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black">
                <ListMusic
                  size={20}
                  className="text-[#C9A227]"
                />
              </div>

              <h2 className="mt-4 font-serif text-xl text-white">
                No playlists yet
              </h2>

              <p className="mt-2 max-w-md text-xs leading-relaxed text-white/40">
                Create a playlist to organise business nuggets
                into focused learning paths.
              </p>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-5 flex items-center gap-2 rounded-md bg-[#C9A227] px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-[#DDB93A]"
              >
                <Plus size={14} />
                Create New Playlist
              </button>
            </div>
          )}

        {/* Playlist cards */}
        {!loading &&
          !error &&
          playlists.length > 0 && (
            <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {playlists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                />
              ))}
            </div>
          )}
      </main>

      <Footer />

      {/* Create playlist modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="font-serif text-2xl text-white">
                  Create New Playlist
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-white/40">
                  Create a collection for nuggets you want to
                  study together.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                aria-label="Close"
                className="rounded-md p-1 text-white/40 transition hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                Playlist Name
              </label>

              <input
                type="text"
                value={playlistName}
                onChange={(event) => {
                  setPlaylistName(event.target.value);
                  setCreateError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    createPlaylist();
                  }
                }}
                placeholder="e.g. Leadership & Strategy"
                autoFocus
                className="w-full rounded-md border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#C9A227]"
              />
            </div>

            {createError && (
              <p className="mt-3 text-xs text-red-400">
                {createError}
              </p>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="rounded-md border border-white/10 px-4 py-2.5 text-xs text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createPlaylist}
                disabled={
                  creating || !playlistName.trim()
                }
                className="rounded-md bg-[#C9A227] px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-[#DDB93A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? "Creating..."
                  : "Create Playlist"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaylistCard({
  playlist,
}: {
  playlist: Playlist;
}) {
  const playlistNuggets = useMemo(() => {
    const ids = new Set(
      playlist.items.map((item) => item.nuggetId)
    );

    return nuggets.filter((nugget) =>
      ids.has(nugget.id)
    );
  }, [playlist.items]);

  const previewNuggets = playlistNuggets.slice(0, 4);

  const totalSeconds = playlistNuggets.reduce(
    (total, nugget) => {
      const [minutes, seconds] = nugget.duration
        .split(":")
        .map(Number);

      if (
        Number.isNaN(minutes) ||
        Number.isNaN(seconds)
      ) {
        return total;
      }

      return total + minutes * 60 + seconds;
    },
    0
  );

  const totalMinutes = Math.ceil(totalSeconds / 60);

  const description =
    playlistNuggets.length > 0
      ? playlistNuggets[0].keyPrinciple
      : "Build a focused collection of business nuggets for your learning path.";

  return (
    <article className="group flex min-h-[195px] flex-col rounded-xl border border-white/10 bg-[#101010] p-5 transition hover:border-white/20">
      <div className="flex gap-4">
        {/* 2 x 2 image collage */}
        <PlaylistPreview
          nuggets={previewNuggets}
        />

        {/* Main information */}
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-[17px] font-semibold leading-snug text-white">
            {playlist.name}
          </h2>

          <p className="mt-1 text-[10px] text-white/35">
            {playlist.items.length}{" "}
            {playlist.items.length === 1
              ? "Nugget"
              : "Nuggets"}
            {totalMinutes > 0 && (
              <> • {totalMinutes} mins</>
            )}
          </p>
        </div>
      </div>

      <p className="mt-5 line-clamp-2 text-[11px] leading-relaxed text-white/40">
        {description}
      </p>

      <Link
        href={`/library/playlist/${playlist.id}`}
        className="mt-auto flex items-center justify-between pt-5 text-[11px] font-medium text-[#C9A227]"
      >
        <span>Open Playlist</span>

        <ArrowRight
          size={14}
          className="transition-transform group-hover:translate-x-1"
        />
      </Link>
    </article>
  );
}

function PlaylistPreview({
  nuggets: playlistNuggets,
}: {
  nuggets: typeof nuggets;
}) {
  if (playlistNuggets.length === 0) {
    return (
      <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#181818]">
        <ListMusic
          size={20}
          className="text-[#C9A227]"
        />
      </div>
    );
  }

  return (
    <div className="grid h-[82px] w-[82px] shrink-0 grid-cols-2 grid-rows-2 overflow-hidden rounded-md bg-[#181818]">
      {[0, 1, 2, 3].map((index) => {
        const nugget =
          playlistNuggets[
            index % playlistNuggets.length
          ];

        return (
          <div
            key={index}
            className="relative overflow-hidden"
          >
            <Image
              src={nugget.image}
              alt=""
              fill
              sizes="41px"
              className="object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}