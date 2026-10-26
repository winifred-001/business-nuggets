"use client";

import { API_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
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

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();

  const playlistId = Number(params.id);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function loadPlaylist() {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in to view this playlist.");
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
          data.message || "Could not load playlist."
        );
        return;
      }

      const found = data.find(
        (item: Playlist) => item.id === playlistId
      );

      if (!found) {
        setError("Playlist not found.");
        return;
      }

      setPlaylist(found);
      setError("");
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  async function deletePlaylist() {
  const token = localStorage.getItem("token");

  if (!token || !playlist) return;

  setDeleting(true);

  try {
    const response = await fetch(
      `${API_URL}/playlists/${playlist.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();

      alert(data.message || "Could not delete playlist");
      return;
    }

    setShowDeleteModal(false);
    router.push("/library/playlist");
  } catch {
    alert("Could not connect to the server");
  } finally {
    setDeleting(false);
  }
}
  async function removeFromPlaylist(
    nuggetId: string
  ) {
    const token = localStorage.getItem("token");

    if (!token || !playlist) return;

    try {
      const response = await fetch(
        `${API_URL}/playlists/${playlist.id}/items/${nuggetId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await loadPlaylist();
      }
    } catch {
      console.error(
        "Could not remove nugget from playlist"
      );
    }
  }

  const playlistNuggets = useMemo(() => {
    if (!playlist) return [];

    const ids = new Set(
      playlist.items.map(
        (item) => item.nuggetId
      )
    );

    return nuggets.filter((nugget) =>
      ids.has(nugget.id)
    );
  }, [playlist]);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <Link
          href="/library/playlist"
          className="text-sm text-amber-300 hover:text-amber-200"
        >
          ← Back to Playlists
        </Link>

        {loading && (
          <p className="mt-10 text-gray-500">
            Loading playlist...
          </p>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          playlist && (
            <>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="bn-hero-title font-serif text-3xl font-semibold sm:text-4xl">
                    {playlist.name}
                  </h1>

                  <p className="mt-2 text-sm text-gray-500">
                    {playlist.items.length}{" "}
                    {playlist.items.length === 1
                      ? "nugget"
                      : "nuggets"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
  <Link
    href={`/library/playlist/${playlist.id}/edit`}
    className="bn-button rounded-md border border-[#C8A35A]/40 px-4 py-2 text-[11px] text-[#C8A35A] transition hover:bg-[#C8A35A]/10"
  >
    Edit Playlist
  </Link>

  <button
    type="button"
    onClick={() => setShowDeleteModal(true)}
    disabled={deleting}
    className="rounded-md border border-red-900/60 px-4 py-2 text-[11px] text-red-400 transition hover:bg-red-950/30 disabled:opacity-50"
  >
    Delete Playlist
  </button>
</div>
              </div>

              {playlistNuggets.length ===
              0 ? (
                <div className="mt-10 rounded-xl border border-white/10 bg-[#101010] p-8 text-center">
                  <p className="text-gray-500">
                    No nuggets in this playlist
                    yet.
                  </p>
                </div>
              ) : (
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {playlistNuggets.map(
                    (nugget) => (
                      <article
                        key={nugget.id}
                        className="overflow-hidden rounded-xl border border-white/10 bg-[#101010]"
                      >
                        <Link
                          href={`/nuggets/${nugget.slug}`}
                        >
                          <div className="relative h-40 w-full overflow-hidden">
                            <Image
                              src={
                                nugget.image
                              }
                              alt={
                                nugget.title
                              }
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="object-cover"
                            />
                          </div>
                        </Link>

                        <div className="p-4">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-amber-300">
                            {nugget.tag}
                          </p>

                          <Link
                            href={`/nuggets/${nugget.slug}`}
                          >
                            <h2 className="mt-3 font-serif text-base leading-snug hover:text-amber-300">
                              {
                                nugget.title
                              }
                            </h2>
                          </Link>

                          <p className="mt-2 text-xs text-gray-500">
                            {
                              nugget.scriptureRef
                            }
                          </p>

                          <div className="mt-5 flex items-center justify-between">
                            <Link
                              href={`/nuggets/${nugget.slug}`}
                              className="text-xs text-amber-300 hover:text-amber-200"
                            >
                              Listen & Read
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                removeFromPlaylist(
                                  nugget.id
                                )
                              }
                              className="text-gray-500 transition hover:text-red-400"
                              aria-label={`Remove ${nugget.title}`}
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </>
          )}
      </main>

      {showDeleteModal && playlist && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
      <h2 className="font-serif text-xl font-semibold text-white">
        Delete Folder?
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-gray-400">
        Are you sure you want to delete{" "}
        <span className="font-medium text-white">
          {playlist.name}
        </span>
        ? The folder and its playlist items will be removed.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => setShowDeleteModal(false)}
          disabled={deleting}
          className="flex-1 rounded-md border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={deletePlaylist}
          disabled={deleting}
          className="flex-1 rounded-md bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  </div>
)}

      <Footer />
    </div>
  );
}