"use client";

import { useEffect, useMemo, useState } from "react";
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

  const selectedNote =
    notes.find((note) => note.id === selectedId) ?? null;

  async function loadNotes() {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in to view your notes.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/notes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Could not load notes.");
        return;
      }

      const loadedNotes: Note[] = Array.isArray(data) ? data : [];

      setNotes(loadedNotes);

      if (loadedNotes.length > 0 && selectedId === null) {
        selectNote(loadedNotes[0]);
      }
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  function selectNote(note: Note) {
    setSelectedId(note.id);
    setTitle(note.title || "");
    setContent(note.content);
  }

  function newNote() {
    setSelectedId(null);
    setTitle("");
    setContent("");
  }

  async function saveNote() {
    const token = localStorage.getItem("token");

    if (!token || !content.trim()) return;

    setSaving(true);
    setError("");

    try {
      const editing = selectedId !== null;

      const response = await fetch(
        editing
          ? `http://localhost:3001/notes/${selectedId}`
          : "http://localhost:3001/notes",
        {
          method: editing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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

      if (!editing && data.id) {
        setSelectedId(data.id);
      }
    } catch {
      setError("Could not save note.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote() {
    const token = localStorage.getItem("token");

    if (!token || selectedId === null) return;

    try {
      const response = await fetch(
        `http://localhost:3001/notes/${selectedId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:py-16">
        {error && (
          <div className="mb-6 rounded-md border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
          {/* LEFT NOTES PANEL */}
          <aside className="h-fit rounded-xl border border-white/10 bg-[#101010] p-4">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-xl font-semibold">
                My Journal & Notes
              </h1>

              <button
                type="button"
                onClick={newNote}
                aria-label="Create new note"
                className="text-amber-300 transition hover:text-amber-200"
              >
                <Plus size={19} />
              </button>
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
                  onChange={(e) => setTitle(e.target.value)}
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
                    : selectedId !== null
                      ? "Save Changes"
                      : "Create Note"}
                </button>
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts, reflections, or business lessons here..."
              className="mt-6 min-h-[320px] w-full resize-none bg-transparent text-sm leading-7 text-gray-400 outline-none placeholder:text-gray-700"
            />

            {linkedNugget && (
              <div className="mt-6 border-t border-white/10 pt-5">
                <Link
                  href={`/nuggets/${linkedNugget.slug}`}
                  className="inline-flex items-center gap-2 text-xs text-amber-300 hover:text-amber-200"
                >
                  <Link2 size={13} />
                  Go to original commentary teaching
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}