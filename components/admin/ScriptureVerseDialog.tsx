"use client";

import { useEffect, useRef, useState } from "react";
import { adminApiFetch } from "@/lib/admin-api";
import { ADMIN_IMPORT_LIMIT, uploadAdminImport } from "@/lib/admin-import-upload";
import { BIBLE_BOOKS } from "@/lib/bible-books";

type Verse = { book: string; chapter: number; verse: number; translation: string; text: string; row?: number; action?: "create" | "skip" };
type Preview = { versesToCreate: number; skipped: number; rows: Verse[] };
type Page = { rows: Verse[]; total: number; page: number; totalPages: number };
const button = "bn-button rounded-md border border-[#C8A35A]/40 px-4 py-2 text-[13px] text-[#E0C48A] transition hover:bg-[#C8A35A]/15 disabled:cursor-not-allowed disabled:opacity-40";
const field = "mt-2 w-full rounded-md border border-white/15 bg-[#080808] p-3 text-[13px] text-white";
async function readResponse(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(Array.isArray(data?.message) ? data.message.join(" ") : data?.message || "Could not read the verse import response. Please retry.");
  return data;
}
export default function ScriptureVerseDialog({ initialMode, close, completed }: {
  initialMode: "import" | "browse"; close: () => void; completed: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState(initialMode);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [book, setBook] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  useEffect(() => {
    if (mode !== "browse") return;
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(""); setResult(null);
      try {
        const response = await adminApiFetch(`/scripture/verses?book=${encodeURIComponent(book)}&page=${page}`, { cache: "no-store", signal: controller.signal });
        const data = await readResponse(response);
        if (!controller.signal.aborted) setResult(data);
      } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load verses."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [mode, book, page]);
  function download(format: "csv" | "json") {
    const example = [{ book: "Genesis", chapter: 1, verse: 1, text: "In the beginning God created the heaven and the earth.", translation: "KJV" }];
    const content = format === "json" ? JSON.stringify(example, null, 2) : 'book,chapter,verse,text,translation\r\nGenesis,1,1,"In the beginning God created the heaven and the earth.",KJV\r\n';
    const url = URL.createObjectURL(new Blob([content], { type: format === "json" ? "application/json" : "text/csv" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `scripture-verses-template.${format}`; anchor.click(); URL.revokeObjectURL(url);
  }
  async function run(stage: "preview" | "commit") {
    if (!file || busy || (stage === "commit" && !preview)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const data = await readResponse(await uploadAdminImport("verses", stage, file));
      if (stage === "preview") setPreview(data);
      else { setNotice(`${data.versesCreated} verses imported. ${data.skipped} exact duplicates skipped.`); setPreview(null); setFile(null); if (fileInput.current) fileInput.current.value = ""; await completed(); }
    } catch (err) { setPreview(null); setError(err instanceof Error ? err.message : "Verse import failed."); }
    finally { setBusy(false); }
  }
  const rows = mode === "import" ? preview?.rows : result?.rows;
  return (
    <dialog ref={dialog} aria-labelledby="verse-dialog-title" onCancel={event => { if (busy) event.preventDefault(); else close(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-24px)] max-w-[900px] overflow-y-auto rounded-xl border border-[#C8A35A]/30 bg-[#111111] p-5 text-white shadow-2xl backdrop:bg-black/75 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <h2 id="verse-dialog-title" className="font-serif text-[20px]">Scripture Verses</h2>
        <button type="button" autoFocus disabled={busy} onClick={close} className={button}>Close</button>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" disabled={busy} aria-pressed={mode === "import"} onClick={() => { setMode("import"); setError(""); }} className={button}>Import Verses</button>
        <button type="button" disabled={busy} aria-pressed={mode === "browse"} onClick={() => setMode("browse")} className={button}>View Verses</button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="mt-4 text-sm text-emerald-300">{notice}</p>}
      {mode === "import" ? <>
        <p className="mt-5 text-sm leading-6 text-white/60">Upload CSV, Excel (.xlsx), or JSON. Maximum 5 MB and 500 verses per file. Required columns: book, chapter, verse, text. Translation is optional and defaults to KJV. Use full Bible book names. Exact duplicates are skipped; different text for an existing reference and translation stops the import. Nugget Scripture Text is kept separately.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => download("csv")} className={button}>Download CSV template</button>
          <button type="button" onClick={() => download("json")} className={button}>Download JSON template</button>
        </div>
        <p className="mt-2 text-xs text-white/40">For Excel, open the CSV template and save it as .xlsx.</p>
        <label className="mt-5 block text-sm">Verse import file
          <input ref={fileInput} type="file" accept=".csv,.xlsx,.json" disabled={busy} className={field} onChange={event => {
            const next = event.target.files?.[0] || null; setPreview(null); setNotice(""); setError("");
            if (next && (!/\.(csv|xlsx|json)$/i.test(next.name) || !next.size || next.size > ADMIN_IMPORT_LIMIT)) { setFile(null); setError("Choose a CSV, Excel (.xlsx), or JSON file between 1 byte and 5 MB."); }
            else setFile(next);
          }} />
        </label>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={!file || busy} onClick={() => void run("preview")} className={button}>{busy ? "Working…" : "Preview Import"}</button>
          <button type="button" disabled={!preview || !preview.versesToCreate || busy} onClick={() => void run("commit")} className={`${button} bg-[#C8A35A]/10`}>Import {preview?.versesToCreate ?? 0} Verses</button>
        </div>
        {preview && <p className="mt-4 text-sm">{preview.versesToCreate} new verses · {preview.skipped} exact duplicates</p>}
      </> : <>
        <label className="mt-5 block text-sm">Bible book
          <select value={book} onChange={event => { setBook(event.target.value); setPage(1); }} className={field}>
            <option value="">All books</option>{BIBLE_BOOKS.map(name => <option key={name}>{name}</option>)}
          </select>
        </label>
        {loading && <p role="status" className="mt-4 text-sm text-white/60">Loading verses…</p>}
        {result && <p className="mt-4 text-sm text-white/60">{result.total} saved verses · Page {result.page} of {result.totalPages}</p>}
      </>}
      {rows && <div className="mt-5 max-h-[360px] space-y-3 overflow-y-auto">
        {rows.length ? rows.map(row => <article key={`${row.book}-${row.chapter}-${row.verse}-${row.translation}`} className="rounded-md border border-white/10 p-4">
          <h3 className="text-[15px] text-[#E0C48A]">{row.book} {row.chapter}:{row.verse} · {row.translation}{row.action ? ` · ${row.action === "skip" ? "Skip duplicate" : "New"}` : ""}</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/65">{row.text}</p>
        </article>) : <p className="text-sm text-white/50">No verses saved for this selection.</p>}
      </div>}
      {mode === "browse" && result && <div className="mt-5 flex justify-end gap-3">
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} className={button}>Previous</button>
        <button type="button" disabled={page >= result.totalPages || loading} onClick={() => setPage(p => p + 1)} className={button}>Next</button>
      </div>}
    </dialog>
  );
}
