"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  BookOpen,
  Check,
  Pencil,
  X,
} from "lucide-react";

import ScriptureVerseDialog from "@/components/admin/ScriptureVerseDialog";
import AdminShell from "@/components/admin/AdminShell";
import { API_URL } from "@/lib/api";

type ScriptureBook = {
  id: number;
  name: string;
  slug: string;

  chapterCount: number;

  visible: boolean;

  displayOrder: number;

  nuggetCount: number;
  verseCount: number;
};

type ScriptureResponse = {
  verseCount: number;
  books: ScriptureBook[];

  unlinkedCount: number;

  unlinkedNuggets: {
    id: string;
    number: number;
    title: string;
  }[];
};

export default function AdminScripturePage() {
  const [verseMode, setVerseMode] = useState<"import" | "browse" | null>(null);
  const [verseCount, setVerseCount] = useState(0);
  const [books, setBooks] =
    useState<ScriptureBook[]>([]);

  const [
    unlinkedCount,
    setUnlinkedCount,
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [name, setName] =
    useState("");

  const [
    chapterCount,
    setChapterCount,
  ] = useState("");

  const [saving, setSaving] =
    useState(false);

  const [
    editingBook,
    setEditingBook,
  ] =
    useState<ScriptureBook | null>(
      null,
    );

  const [
    editName,
    setEditName,
  ] = useState("");

  const [
    editChapterCount,
    setEditChapterCount,
  ] = useState("");

  const [
    editVisible,
    setEditVisible,
  ] = useState(true);

  function getToken() {
    return (
      localStorage.getItem(
        "adminToken",
      ) ||
      sessionStorage.getItem(
        "adminToken",
      )
    );
  }

  /* =========================================
     LOAD
  ========================================= */

  useEffect(() => {
    loadIndex();
  }, []);

  async function loadIndex() {
    const token =
      getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/admin/scripture`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data:
        ScriptureResponse =
        await response.json();

      if (!response.ok) {
        setError(
          "Could not load Scripture Index.",
        );

        return;
      }

      setVerseCount(data.verseCount || 0);
      setBooks(
        data.books || [],
      );

      setUnlinkedCount(
        data.unlinkedCount ||
          0,
      );
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     ADD BOOK
  ========================================= */

  async function addBook() {
    if (!name.trim()) {
      setError(
        "Enter a book name.",
      );

      return;
    }

    const token =
      getToken();

    if (!token) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/scripture/books`,
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
                name:
                  name.trim(),

                chapterCount:
                  Number(
                    chapterCount,
                  ) || 0,
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ||
            "Could not add book.",
        );

        return;
      }

      setName("");
      setChapterCount("");

      setSuccess(
        "Book added to Scripture Index.",
      );

      await loadIndex();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     EDIT
  ========================================= */

  function openEdit(
    book: ScriptureBook,
  ) {
    setEditingBook(
      book,
    );

    setEditName(
      book.name,
    );

    setEditChapterCount(
      String(
        book.chapterCount,
      ),
    );

    setEditVisible(
      book.visible,
    );
  }

  async function saveEdit() {
    if (
      !editingBook ||
      !editName.trim()
    ) {
      return;
    }

    const token =
      getToken();

    if (!token) return;

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/scripture/books/${editingBook.id}`,
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
                  editName.trim(),

                chapterCount:
                  Number(
                    editChapterCount,
                  ) || 0,

                visible:
                  editVisible,
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ||
            "Could not update book.",
        );

        return;
      }

      setEditingBook(null);

      setSuccess(
        "Scripture book updated.",
      );

      await loadIndex();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {verseMode && <ScriptureVerseDialog initialMode={verseMode} close={() => setVerseMode(null)} completed={loadIndex} />}
        {/* HEADER */}

        <section className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[32px]">
              Scripture Index
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Manage books,
              chapters and verse
              links.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setVerseMode("browse")} className="bn-button rounded-md border border-white/15 px-4 py-2 text-[13px] text-white/60 transition hover:border-[#E28906]/50 hover:text-[#E28906]">View Verses ({verseCount})</button>
            <button type="button" onClick={() => setVerseMode("import")} className="bn-button rounded-md border border-[#E28906]/40 px-4 py-2 text-[13px] text-[#E28906] transition hover:bg-[#E28906]/15">Import Verses</button>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[10px] text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3">
            <Check
              size={12}
              className="text-emerald-400"
            />

            <span className="text-[10px] text-emerald-400">
              {success}
            </span>
          </div>
        )}

        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          {/* INDEX */}

          <div className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h2 className="font-serif text-[18px]">
              Scripture Index
            </h2>

            {loading ? (
              <div className="mt-5 space-y-3">
                {Array.from({
                  length: 6,
                }).map(
                  (_, index) => (
                    <div
                      key={
                        index
                      }
                      className="h-[58px] animate-pulse rounded-md bg-white/[0.04]"
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="mt-4">
                {books.map(
                  (book) => (
                    <div
                      key={
                        book.id
                      }
                      className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-4 last:border-0"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[10px] font-medium text-white/75">
                            {
                              book.name
                            }
                          </h3>

                          {!book.visible && (
                            <span className="rounded bg-white/[0.05] px-2 py-0.5 text-[6px] text-white/30">
                              Hidden
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-[8px] text-white/30">
                          {book.chapterCount >
                          0
                            ? `${book.chapterCount} chapters`
                            : "Chapter count not set"}
                          {" · "}
                          {
                            book.nuggetCount
                          }{" "}
                          {book.nuggetCount ===
                          1
                            ? "nugget"
                            : "nuggets"}{" · "}{book.verseCount || 0} saved verses
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openEdit(
                            book,
                          )
                        }
                        className="inline-flex items-center gap-2 text-[8px] text-[#E28906] hover:text-[#E28906]"
                      >
                        Manage

                        <Pencil
                          size={
                            10
                          }
                        />
                      </button>
                    </div>
                  ),
                )}

                {books.length ===
                  0 && (
                  <div className="py-10 text-center">
                    <BookOpen
                      size={
                        22
                      }
                      className="mx-auto text-white/15"
                    />

                    <p className="mt-3 text-[10px] text-white/30">
                      No Scripture
                      books yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT */}

          <aside className="space-y-4">
            {/* ADD BOOK */}

            <section className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
              <h2 className="font-serif text-[18px]">
                Add Book
              </h2>

              <label className="mt-4 block text-[8px] text-white/35">
                Book Name
              </label>

              <input
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
                placeholder="Genesis"
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none placeholder:text-white/20"
              />

              <label className="mt-4 block text-[8px] text-white/35">
                Number of Chapters
              </label>

              <input
                type="number"
                min="0"
                value={
                  chapterCount
                }
                onChange={(
                  event,
                ) =>
                  setChapterCount(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="50"
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none placeholder:text-white/20"
              />

              <button
                type="button"
                disabled={saving}
                onClick={
                  addBook
                }
                className="mt-4 h-10 w-full rounded-md bg-[#E28906] text-[9px] font-semibold text-[#080808] hover:bg-[#E28906] disabled:opacity-50"
              >
                Add to Index
              </button>
            </section>

            {/* GUIDELINES */}

            <section className="rounded-[10px] border border-[#E28906]/20 bg-[#E28906]/10 p-5">
              <h2 className="text-[9px] font-semibold text-[#E28906]">
                Index Guidelines
              </h2>

              <p className="mt-3 text-[8px] leading-5 text-white/35">
                Use consistent
                book names. Every
                Nugget should link
                to at least one
                Scripture
                reference.
              </p>
            </section>

            {/* UNLINKED */}

            <section className="rounded-[10px] border border-[#E28906]/20 bg-[#E28906]/10 p-5">
              <h2 className="text-[9px] font-semibold text-[#E28906]">
                Unlinked Nuggets
              </h2>

              <p className="mt-3 text-[8px] text-white/35">
                {
                  unlinkedCount
                }{" "}
                {unlinkedCount ===
                1
                  ? "Nugget has"
                  : "Nuggets have"}{" "}
                no complete
                Scripture
                reference.
              </p>

              <a
                href="/admin/nuggets"
                className="mt-3 inline-block text-[8px] text-[#E28906]"
              >
                Review now →
              </a>
            </section>
          </aside>
        </section>

        {/* EDIT MODAL */}

        {editingBook && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[430px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[24px]">
                  Manage Book
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setEditingBook(
                      null,
                    )
                  }
                  className="text-white/30 hover:text-white"
                >
                  <X
                    size={
                      16
                    }
                  />
                </button>
              </div>

              <label className="mt-6 block text-[8px] text-white/35">
                Book Name
              </label>

              <input
                value={
                  editName
                }
                onChange={(
                  event,
                ) =>
                  setEditName(
                    event
                      .target
                      .value,
                  )
                }
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none"
              />

              <label className="mt-4 block text-[8px] text-white/35">
                Chapters
              </label>

              <input
                type="number"
                min="0"
                value={
                  editChapterCount
                }
                onChange={(
                  event,
                ) =>
                  setEditChapterCount(
                    event
                      .target
                      .value,
                  )
                }
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none"
              />

              <label className="mt-4 flex items-center justify-between rounded-md border border-white/[0.07] bg-[#080808] p-4">
                <span className="text-[9px] text-white/55">
                  Visible in Index
                </span>

                <input
                  type="checkbox"
                  checked={
                    editVisible
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditVisible(
                      event
                        .target
                        .checked,
                    )
                  }
                  className="h-4 w-4 accent-[#E28906]"
                />
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEditingBook(
                      null,
                    )
                  }
                  className="h-9 rounded-md border border-white/10 px-4 text-[9px] text-white/40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    saveEdit
                  }
                  disabled={saving}
                  className="h-9 rounded-md bg-[#E28906] px-5 text-[9px] font-semibold text-[#080808] disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}