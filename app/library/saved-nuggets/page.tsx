"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  Clock3,
  FolderPlus,
  Search,
  Trash2,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { nuggets } from "@/lib/nuggets";

type SavedNuggetRecord = {
  id: number;
  nuggetId: string;
  userId: number;
  createdAt: string;
};

const filters = [
  "All Saved",
  "Stewardship",
  "Leadership",
  "Covenant Strategy",
];

export default function SavedNuggetsPage() {
  const [savedRecords, setSavedRecords] = useState<SavedNuggetRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState("All Saved");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderMenuFor, setFolderMenuFor] = useState<string | null>(null);
  const [addingToFolder, setAddingToFolder] = useState(false);
  const [folderMessage, setFolderMessage] = useState("");

  useEffect(() => {
    loadSavedNuggets();
    loadPlaylists();
  }, []);

  async function loadSavedNuggets() {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in to view your saved nuggets.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3001/saved-nuggets",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to load saved nuggets.");
        return;
      }

      setSavedRecords(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function removeSavedNugget(nuggetId: string) {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:3001/saved-nuggets/${nuggetId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      setSavedRecords((current) =>
        current.filter(
          (record) => record.nuggetId !== nuggetId
        )
      );
    } catch {
      console.error("Unable to remove saved nugget.");
    }
  }

  async function addNuggetToPlaylist(
  playlistId: number,
  nuggetId: string
) {
  const token = localStorage.getItem("token");

  if (!token) return;

  setAddingToFolder(true);
  setFolderMessage("");

  try {
    const response = await fetch(
      `http://localhost:3001/playlists/${playlistId}/items`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nuggetId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setFolderMessage(data.message || "Could not add nugget");
      return;
    }

    setFolderMessage(data.message);

    await loadPlaylists();

    setTimeout(() => {
      setFolderMenuFor(null);
      setFolderMessage("");
    }, 1200);
  } catch {
    setFolderMessage("Could not add nugget");
  } finally {
    setAddingToFolder(false);
  }
}
  async function loadPlaylists() {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetch("http://localhost:3001/playlists", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      setPlaylists(Array.isArray(data) ? data : []);
    }
  } catch {
    console.error("Could not load playlists");
  }
}

async function createFolder() {
  const token = localStorage.getItem("token");

  if (!token || !folderName.trim()) return;

  setCreatingFolder(true);

  try {
    const response = await fetch("http://localhost:3001/playlists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: folderName.trim(),
      }),
    });

    if (response.ok) {
      setFolderName("");
      setShowFolderInput(false);
      await loadPlaylists();
    }
  } catch {
    console.error("Could not create folder");
  } finally {
    setCreatingFolder(false);
  }
}

  const savedNuggets = useMemo(() => {
    const savedIds = new Set(
      savedRecords.map((record) => record.nuggetId)
    );

    return nuggets.filter((nugget) =>
      savedIds.has(nugget.id)
    );
  }, [savedRecords]);

  const visibleNuggets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return savedNuggets.filter((nugget) => {
      const matchesSearch =
        !query ||
        nugget.title.toLowerCase().includes(query) ||
        nugget.topic.toLowerCase().includes(query) ||
        nugget.tag.toLowerCase().includes(query) ||
        nugget.scriptureRef.toLowerCase().includes(query);

      const matchesFilter =
        activeFilter === "All Saved" ||
        nugget.topic
          .toLowerCase()
          .includes(activeFilter.toLowerCase()) ||
        nugget.tag
          .toLowerCase()
          .includes(activeFilter.toLowerCase());

      return matchesSearch && matchesFilter;
    });
  }, [savedNuggets, searchQuery, activeFilter]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="border-b border-white/10 pb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
                Saved Nuggets
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Your personal library of timeless business frameworks.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-[360px]">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved nuggets..."
                className="h-11 w-full rounded-md border border-white/10 bg-[#111] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-amber-300/50"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mt-7 flex flex-wrap gap-2">
            {filters.map((filter) => {
              const active = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                    active
                      ? "bg-amber-300 text-black"
                      : "border border-white/10 bg-[#121212] text-gray-300 hover:border-amber-300/40 hover:text-amber-300"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {/* Loading */}
          {loading && (
            <div className="py-16 text-center text-sm text-gray-500">
              Loading saved nuggets...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mt-8 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Saved cards */}
          {!loading && !error && visibleNuggets.length > 0 && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {visibleNuggets.map((nugget) => (
                <article
                  key={nugget.id}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-[#101010]"
                >
                  <Link href={`/nugget/${nugget.slug}`}>
                    <div className="relative h-40 w-full overflow-hidden bg-neutral-900">
                      <Image
                        src={nugget.image}
                        alt={nugget.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  </Link>

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                        {nugget.tag}
                      </span>

                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Clock3 size={11} />
                        <span>{nugget.duration}</span>
                      </div>
                    </div>

                    <Link href={`/nugget/${nugget.slug}`}>
                      <h2 className="mt-3 line-clamp-2 font-serif text-base leading-snug text-white transition group-hover:text-amber-300">
                        {nugget.title}
                      </h2>
                    </Link>

                    <p className="mt-2 text-xs italic text-gray-500">
                      {nugget.scriptureRef}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3">
  <Link
    href={`/nuggets/${nugget.slug}`}
    className="text-xs font-medium text-amber-300 hover:text-amber-200"
  >
    Listen & Read
  </Link>

  <div className="relative flex items-center gap-2">
    <button
    type="button"
    onClick={() => setFolderMenuFor(nugget.id)}
    className="rounded border border-white/10 px-2 py-1 text-[11px] text-gray-300 hover:border-amber-300/40 hover:text-amber-300"
    >
    Add to Folder
    </button>

    <button
      type="button"
      onClick={() => removeSavedNugget(nugget.id)}
      aria-label={`Remove ${nugget.title} from saved nuggets`}
      className="text-amber-300 transition hover:text-red-400"
    >
      <Trash2 size={15} />
    </button>
  </div>
</div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* No search/filter results */}
          {!loading &&
            !error &&
            savedNuggets.length > 0 &&
            visibleNuggets.length === 0 && (
              <div className="py-16 text-center">
                <Search
                  size={28}
                  className="mx-auto text-gray-600"
                />

                <h2 className="mt-4 font-serif text-lg">
                  No matching nuggets
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Try another search or filter.
                </p>
              </div>
            )}

          {/* No saved nuggets at all */}
          {!loading &&
            !error &&
            savedNuggets.length === 0 && (
              <div className="py-16 text-center">
                <Bookmark
                  size={30}
                  className="mx-auto text-amber-300"
                />

                <h2 className="mt-4 font-serif text-xl">
                  No saved nuggets yet
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Save nuggets from the library and they will appear here.
                </p>

                <Link
                  href="/library"
                  className="mt-5 inline-block rounded-md bg-amber-300 px-5 py-2.5 text-sm font-medium text-black hover:bg-amber-400"
                >
                  Browse Library
                </Link>
              </div>
            )}
        </section>

        {/* Custom folders */}
        <section className="py-14">
  <div className="mb-8 flex items-center justify-between">
    <div>
      <h2 className="font-serif text-2xl font-semibold">
        Custom Folders
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Organize your saved nuggets into business playlists.
      </p>
    </div>

    <button
      type="button"
      onClick={() => setShowFolderInput((prev) => !prev)}
      className="flex items-center gap-2 rounded-md bg-amber-300 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400"
    >
      <FolderPlus size={16} />
      Create Folder
    </button>
  </div>

  {showFolderInput && (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={folderName}
        onChange={(e) => setFolderName(e.target.value)}
        placeholder="Folder name"
        className="h-11 flex-1 rounded-md border border-white/10 bg-[#111] px-4 text-sm text-white outline-none focus:border-amber-300/50"
      />

      <button
        type="button"
        onClick={createFolder}
        disabled={creatingFolder || !folderName.trim()}
        className="rounded-md bg-amber-300 px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
      >
        {creatingFolder ? "Creating..." : "Create"}
      </button>
    </div>
  )}

  {playlists.length === 0 ? (
    <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/20 bg-[#111]">
        <Bookmark size={25} className="text-amber-300" />
      </div>

      <h3 className="mt-5 font-serif text-xl font-semibold">
        No custom folders created yet
      </h3>

      <p className="mt-2 max-w-md text-sm text-gray-500">
        Organize your bookmarked scriptures and teachings into specific
        business playlists.
      </p>
    </div>
  ) : (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {playlists.map((playlist) => (
        <Link
          key={playlist.id}
          href={`/library/playlist/${playlist.id}`}
          className="rounded-xl border border-white/10 bg-[#101010] p-5 hover:border-amber-300/40"
        >
          <h3 className="font-serif text-lg font-semibold">
            {playlist.name}
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {playlist.items?.length ?? 0} nuggets
          </p>
        </Link>
      ))}
    </div>
  )}
</section>
      </main>
      {folderMenuFor && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold text-white">
            Add to Folder
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Choose a folder for this nugget.
          </p>

          {folderMessage && (
  <p className="mt-3 rounded-md border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-sm text-amber-300">
    {folderMessage}
  </p>
)}
        </div>

        <button
          type="button"
          onClick={() => setFolderMenuFor(null)}
          className="text-gray-500 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {playlists.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-center">
            <p className="text-sm text-gray-500">
              You don&apos;t have any folders yet.
            </p>
          </div>
        ) : (
          playlists.map((playlist) => (
            <button
              key={playlist.id}
              type="button"
              disabled={addingToFolder}
              onClick={() =>
                addNuggetToPlaylist(
                  playlist.id,
                  folderMenuFor
                )
              }
              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-amber-300/40 hover:bg-amber-300/5"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {playlist.name}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {playlist.items?.length ?? 0} nuggets
                </p>
              </div>

              <span className="text-xs text-amber-300">
                Add
              </span>
            </button>
          ))
        )}
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => {
            setFolderMenuFor(null);
            setShowFolderInput(true);
          }}
          className="w-full rounded-md bg-amber-300 px-4 py-3 text-sm font-semibold text-black hover:bg-amber-400"
        >
          + Create New Folder
        </button>

        <button
          type="button"
          onClick={() => setFolderMenuFor(null)}
          className="mt-2 w-full px-4 py-2 text-sm text-gray-500 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

      <Footer />
    </div>
  );
}