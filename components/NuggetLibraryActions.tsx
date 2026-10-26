"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Check, ListPlus, X } from "lucide-react";
import { API_URL } from "@/lib/api";
import { loginFor } from "@/lib/auth-return";
export default function NuggetLibraryActions({ id, slug }: { id: string; slug: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [playlists, setPlaylists] = useState<{id: number; name: string}[] | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("token");
    if (token) void fetch(`${API_URL}/saved-nuggets`, { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } })
      .then(async response => response.ok ? response.json() : []).then(data => { if (!controller.signal.aborted) setSaved(Array.isArray(data) && data.some(item => String(item.nuggetId) === id)); }).catch(() => {});
    return () => controller.abort();
  }, [id]);
  async function request(path: string, init?: RequestInit) {
    const token = localStorage.getItem("token");
    if (!token) { window.location.assign(loginFor(`/nugget/${slug}`)); throw new Error("Please log in to continue."); }
    const response = await fetch(`${API_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error("Could not update your library. Please try again.");
    return response;
  }
  async function save() {
    if (busy) return; setBusy(true); setMessage("");
    try { await request(saved ? `/saved-nuggets/${id}` : "/saved-nuggets", { method: saved ? "DELETE" : "POST", ...(saved ? {} : { body: JSON.stringify({ nuggetId: id }) }) }); setSaved(value => !value); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not save this Nugget."); }
    finally { setBusy(false); }
  }
  async function openPlaylists() {
    if (busy) return; setBusy(true); setMessage("");
    try { const response = await request("/playlists"); const data = await response.json(); setPlaylists(Array.isArray(data) ? data : []); }
    catch { setMessage("Could not load your playlists. Please try again."); } finally { setBusy(false); }
  }
  async function add(playlistId: number) {
    if (busy) return; setBusy(true);
    try { await request(`/playlists/${playlistId}/items`, { method: "POST", body: JSON.stringify({ nuggetId: id }) }); setPlaylists(null); setMessage("Added to playlist."); }
    catch { setMessage("Could not add this Nugget to the playlist. Please try again."); } finally { setBusy(false); }
  }
  const button = "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[14px] text-white/65 transition hover:bg-white/[0.04] hover:text-[#ead2a0] disabled:opacity-40";
  return <>
    <button type="button" onClick={save} disabled={busy} className={button}>{saved ? <Check size={16} /> : <Bookmark size={16} />}{saved ? "Saved to Library" : "Save to Library"}</button>
    <button type="button" onClick={openPlaylists} disabled={busy} className={button}><ListPlus size={16} />Add to Playlist</button>
    {message && <p role="status" className="px-3 py-2 text-[13px] text-[#ead2a0]">{message}</p>}
    {playlists && <dialog aria-label="Add to Playlist" ref={element => { if (element && !element.open) element.showModal(); }} onClose={() => setPlaylists(null)} className="m-auto w-[calc(100%-32px)] max-w-md rounded-xl border border-white/15 bg-[#191b18] p-6 text-[#f9f5ed] backdrop:bg-black/75">
      <div className="mb-5 flex items-center justify-between gap-4"><h2 className="font-serif text-[28px]">Add to Playlist</h2><button type="button" onClick={() => setPlaylists(null)} aria-label="Close dialog"><X size={20} /></button></div>
      {message && <p role="alert" className="mb-4 text-[#ead2a0]">{message}</p>}
      {playlists.length ? playlists.map(playlist => <button key={playlist.id} type="button" disabled={busy} onClick={() => add(playlist.id)} className={button}>{playlist.name}</button>) : <Link href="/library/playlist/create" className="text-[#ead2a0] underline">Create your first playlist</Link>}
    </dialog>}
  </>;
}
