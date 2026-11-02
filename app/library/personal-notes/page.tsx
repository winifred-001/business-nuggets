"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Link2, Plus, Search } from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { nuggets } from "@/lib/nuggets";

type Note = {
  id: number;
  title?: string | null;
  content: string;
  nuggetId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function PersonalNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedRef = useRef<number | null>(null);
  const selectNote = useCallback((note: Note) => {
    selectedRef.current = note.id;
    setSelectedId(note.id);
    setTitle(note.title || "");
    setContent(note.content);
  }, []);

  const selectedNote =
    notes.find((note) => note.id === selectedId) ?? null;

  const loadNotes = useCallback(() => {
    return fetch("/api/member/proxy/notes", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(response.status === 401 ? "Please log in to view your notes." : data.message || "Could not load notes.");
        return Array.isArray(data) ? data as Note[] : [];
      })
      .then(loadedNotes => {
        setNotes(loadedNotes);
        if (loadedNotes.length > 0) {
          const requestedId = Number(new URLSearchParams(window.location.search).get("note"));
          selectNote(loadedNotes.find(note => note.id === selectedRef.current) || loadedNotes.find(note => note.id === requestedId) || loadedNotes[0]);
        } else { selectedRef.current = null; setSelectedId(null); setTitle(""); setContent(""); }
      })
      .catch(error => setError(error instanceof Error ? error.message : "Could not load notes."))
      .finally(() => setLoading(false));
  }, [selectNote]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  async function saveNote() {
    if (selectedId === null || !content.trim()) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/member/proxy/notes/${selectedId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim() || undefined,
            content: content.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Could not save note.");
        return;
      }

      await loadNotes();

    } catch {
      setError("Could not save note.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote() {
    if (selectedId === null) return;

    try {
      const response = await fetch(
        `/api/member/proxy/notes/${selectedId}`,
        {
          method: "DELETE",
          headers: {
          },
        }
      );

      if (!response.ok) return;

      setSelectedId(null);
      setTitle("");
      setContent("");

      await loadNotes();
    } catch {
      setError("Could not delete note.");
    }
  }

  const filteredNotes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return notes;

    return notes.filter((note) => {
      return (
        (note.title || "").toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        (note.nuggetId || "").toLowerCase().includes(query)
      );
    });
  }, [notes, searchQuery]);

  const linkedNugget = selectedNote?.nuggetId
    ? nuggets.find(
        (nugget) => nugget.id === selectedNote.nuggetId
      )
    : null;

  function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();

    const difference = now.getTime() - date.getTime();
    const hours = Math.floor(difference / 3600000);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;

    const days = Math.floor(hours / 24);

    return `${days} days ago`;
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar />

      <main className="bn-member-library mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:py-16">
        {error && (
          <div className="mb-6 rounded-md border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
          {/* LEFT NOTES PANEL */}
          <aside className="h-fit rounded-xl border border-white/10 bg-[#101010] p-4">
            <div className="flex items-center justify-between">
              <h1 className="bn-hero-title font-serif text-xl font-semibold">
                My Journal & Notes
              </h1>

              <Link
  href="/library/personal-notes/create"
  aria-label="Create new note"
  className="text-[#C8A35A] transition hover:text-[#E0C48A]"
>
  <Plus size={19} />
</Link>
            </div>

            <div className="relative mt-4">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="h-10 w-full rounded-md border border-white/10 bg-[#181818] pl-9 pr-3 text-xs text-white outline-none placeholder:text-gray-600 focus:border-amber-300/40"
              />
            </div>

            <div className="mt-4 space-y-3">
              {loading && (
                <p className="py-6 text-center text-xs text-gray-500">
                  Loading notes...
                </p>
              )}

              {!loading && filteredNotes.length === 0 && (
                <p className="py-6 text-center text-xs text-gray-500">
                  No notes yet.
                </p>
              )}

              {filteredNotes.map((note) => {
                const active = note.id === selectedId;

                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => selectNote(note)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      active
                        ? "border-amber-300/50 bg-amber-300/5"
                        : "border-white/10 bg-[#141414] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-300">
                        {note.nuggetId || "Personal"}
                      </span>

                      <span className="shrink-0 text-[9px] text-gray-600">
                        {timeAgo(note.updatedAt)}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-1 font-serif text-sm text-white">
                      {note.title || "Untitled Note"}
                    </p>

                    <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-gray-500">
                      {note.content}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* RIGHT EDITOR PANEL */}
          <section className="min-h-[520px] rounded-xl border border-white/10 bg-[#101010] p-5 sm:p-7">
            {selectedId === null ? (
              <div className="flex min-h-[350px] flex-col items-start justify-center gap-4">
                <h2 className="font-serif text-[24px] text-white">Create a Study Note</h2>
                <p className="text-sm leading-6 text-gray-400">Open the note-creation screen to write a new entry, or select an existing note to edit.</p>
                <Link href="/library/personal-notes/create" className="bn-button inline-flex rounded-md bg-amber-300 px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-amber-400">Create Note</Link>
              </div>
            ) : <>

            <div className="flex flex-col gap-5 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                {linkedNugget && (
                  <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-300">
                    Linked Nugget: {linkedNugget.title}
                  </p>
                )}

                <input
                  type="text"
                  value={title}
                  maxLength={120}
                  onChange={(e) => setTitle(e.target.value)}
                  aria-label="Note title"
                  placeholder="Note title"
                  className="w-full bg-transparent font-serif text-2xl text-white outline-none placeholder:text-gray-700"
                />
              </div>

              <div className="flex shrink-0 gap-2">
                {selectedId !== null && (
                  <button
                    type="button"
                    onClick={deleteNote}
                    className="rounded-md border border-white/10 px-4 py-2 text-xs text-gray-300 transition hover:border-red-900/50 hover:text-red-400"
                  >
                    Delete
                  </button>
                )}

                <button
                  type="button"
                  onClick={saveNote}
                  disabled={!content.trim() || saving}
                  className="rounded-md bg-amber-300 px-4 py-2 text-xs font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>

            <textarea
              value={content}
              maxLength={10000}
              onChange={(e) => setContent(e.target.value)}
              aria-label="Note content"
              placeholder="Write your thoughts, reflections, or business lessons here..."
              className="mt-6 min-h-[320px] w-full resize-none bg-transparent text-sm leading-7 text-gray-400 outline-none placeholder:text-gray-700"
            />

            {linkedNugget && (
              <div className="mt-6 border-t border-white/10 pt-5">
                <Link
                  href={`/nugget/${linkedNugget.slug}`}
                  className="inline-flex items-center gap-2 text-xs text-amber-300 hover:text-amber-200"
                >
                  <Link2 size={13} />
                  Go to original commentary teaching
                </Link>
              </div>
            )}
            </>}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}