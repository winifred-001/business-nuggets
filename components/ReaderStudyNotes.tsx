"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loginFor } from "@/lib/auth-return";

type Note = { id: number; title?: string | null; content: string; nuggetId?: string | null; updatedAt?: string };
export default function ReaderStudyNotes({ nuggetId, title, slug }: { nuggetId: string; title: string; slug: string }) {
  const [content, setContent] = useState("");
  const [note, setNote] = useState<Note | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const reset = () => { setContent(""); setNote(null); setAuthenticated(false); setReady(false); setStatus(""); setAttempt(value => value + 1); };
    const storage = (event: StorageEvent) => { if (event.key === "token" || event.key === "user") reset(); };
    window.addEventListener("auth-change", reset);
    window.addEventListener("storage", storage);
    return () => { window.removeEventListener("auth-change", reset); window.removeEventListener("storage", storage); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setReady(false); setError("");
      try {
        const session = await fetch("/api/member/auth/session", { cache: "no-store", signal: controller.signal });
        if (session.status === 401) { if (!controller.signal.aborted) { setAuthenticated(false); setReady(true); } return; }
        const auth = await session.json().catch(() => null);
        if (!session.ok || !auth?.authenticated) throw new Error("Could not verify your account. Please retry.");
        if (!controller.signal.aborted) setAuthenticated(true);
        const response = await fetch("/api/member/proxy/notes", { cache: "no-store", signal: controller.signal });
        const data = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(data)) throw new Error("Could not load your notes. Please retry before saving.");
        const existing = (data as Note[]).filter(item => item.nuggetId === nuggetId)
          .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))[0] || null;
        if (!controller.signal.aborted) { setNote(existing); setContent(existing?.content || ""); setReady(true); }
      } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load your notes."); }
    }
    void load(); return () => controller.abort();
  }, [nuggetId, attempt]);
  async function save() {
    if (!ready || !authenticated || saving || !content.trim()) return;
    setSaving(true); setError(""); setStatus("");
    try {
      const response = await fetch(`/api/member/proxy/notes${note ? `/${note.id}` : ""}`, {
        method: note ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: (note?.title || `${title} — Study Notes`).slice(0, 120), content: content.trim(), nuggetId }),
      });
      const data = await response.json().catch(() => null);
      if (response.status === 401) { setAuthenticated(false); throw new Error("Please log in again to save your notes."); }
      if (response.status === 404 && note) { setNote(null); throw new Error("The saved note was removed. Click Save Notes again to create a new copy."); }
      if (!response.ok || !data?.id) throw new Error(typeof data?.message === "string" ? data.message : "Could not save your notes. Your text is still here; please retry.");
      setNote(data); setStatus("Notes saved. You can find them in Notes.");
      window.dispatchEvent(new Event("notes-change"));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save your notes."); }
    finally { setSaving(false); }
  }
  return (
    <div className="border border-[#BCA46E] bg-[#F8F3EA] p-5">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#15120E]">My Study Notes</h2>
      <p className="mt-3 text-[13px] leading-5 text-[#756E64]">Take this in, then act. Write what you must execute each week instead of buying the next prosperity read.</p>
      <label htmlFor="study-notes" className="sr-only">My study notes</label>
      <textarea id="study-notes" rows={7} maxLength={10000} value={content} disabled={!ready || !authenticated || saving}
        onChange={event => { setContent(event.target.value); setStatus(""); }} placeholder="Write your notes here..."
        className="mt-4 w-full resize-y border border-[#BCA46E] bg-[#F5F0E8] p-3 text-[13px] leading-5 text-[#15120E] outline-none placeholder:text-[#9B9388] focus:border-[#9A7839] disabled:opacity-60" />
      {!ready && !error && <p role="status" className="mt-2 text-[13px] text-[#756E64]">Loading your notes…</p>}
      {ready && authenticated && <button type="button" disabled={saving || !content.trim()} onClick={() => void save()}
        className="bn-button mt-3 w-full border border-[#9A7839] bg-[#C8A35A] px-4 py-2.5 text-[13px] font-semibold text-[#15120E] transition hover:bg-[#D8B975] disabled:cursor-not-allowed disabled:opacity-50">
        {saving ? "Saving…" : note ? "Update Notes" : "Save Notes"}
      </button>}
      {ready && !authenticated && <Link href={loginFor(`/nugget/${slug}/reader`)} className="bn-button mt-3 block border border-[#9A7839] bg-[#C8A35A] px-4 py-2.5 text-center text-[13px] font-semibold text-[#15120E]">Log in to Save Notes</Link>}
      {error && <p role="alert" className="mt-3 text-[13px] text-red-700">{error}</p>}
      {!ready && error && <button type="button" onClick={() => setAttempt(value => value + 1)} className="bn-button mt-2 text-[13px] text-[#9A7839] underline">Retry loading notes</button>}
      {status && <p role="status" className="mt-3 text-[13px] text-emerald-800">{status}</p>}
      <Link href={`/library/personal-notes${note ? `?note=${note.id}` : ""}`} className="bn-button mt-4 inline-block text-[13px] font-semibold text-[#9A7839] underline underline-offset-2">View My Notes →</Link>
    </div>
  );
}
