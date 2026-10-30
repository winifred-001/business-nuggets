"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { adminApiFetch } from "@/lib/admin-api";
import { mediaUrl, readMediaResponse, type MediaAsset } from "@/lib/media-library";

type ImageLibrary = { assets: MediaAsset[]; folders: { id: number; name: string }[] };

export default function ImageMediaPicker({ value, onSelect, disabled = false }: {
  value: string; onSelect: (url: string) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" disabled={disabled} onClick={() => setOpen(true)} className="mt-2 min-h-10 w-full rounded-md border border-[#cda762]/40 text-[13px] text-[#ead2a0] transition hover:bg-[#cda762]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cda762] disabled:cursor-not-allowed disabled:opacity-40">
      Choose from Library
    </button>
    {open && <ImagePicker value={value} onClose={() => setOpen(false)} onSelect={url => { onSelect(url); setOpen(false); }} />}
  </>;
}

function ImagePicker({ value, onClose, onSelect }: {
  value: string; onClose: () => void; onSelect: (url: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [library, setLibrary] = useState<ImageLibrary>({ assets: [], folders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await readMediaResponse(await adminApiFetch("/media", { cache: "no-store", signal: controller.signal }));
        if (!Array.isArray(data.assets) || !Array.isArray(data.folders)) throw new Error("The Media Library returned an unreadable response. Please retry.");
        if (!controller.signal.aborted) setLibrary({ assets: data.assets.filter((asset: MediaAsset) => asset.mimeType.startsWith("image/")), folders: data.folders });
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load images.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);
  const images = library.assets.filter(asset =>
    (!folder || String(asset.folderId) === folder) && asset.originalName.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return <dialog ref={dialog} aria-labelledby="image-library-title" onCancel={event => { event.preventDefault(); onClose(); }} className="fixed inset-0 z-[100] m-0 h-full max-h-none w-full max-w-none border-0 bg-black/80 p-3 text-[#f9f5ed] open:flex open:items-center open:justify-center sm:p-6">
    <div className="flex max-h-[90dvh] w-full min-w-0 max-w-4xl flex-col overflow-hidden rounded-xl border border-white/15 bg-[#191b18] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4"><h2 id="image-library-title" className="font-serif text-[20px]">Choose a cover image</h2><button type="button" autoFocus onClick={onClose} className="min-h-10 rounded-lg border border-white/20 px-4 py-2 transition hover:bg-white/10">Close</button></div>
      {loading ? <p role="status" className="py-8 text-sm text-white/60">Loading images…</p> : error ? <div className="py-6"><p role="alert" className="text-sm text-red-300">{error}</p><button type="button" onClick={() => { setError(""); setLoading(true); setAttempt(current => current + 1); }} className="mt-4 rounded-lg border border-[#cda762]/40 px-4 py-2 text-[#ead2a0] transition hover:bg-[#cda762]/10">Retry</button></div> : <>
        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <input type="search" aria-label="Search library images" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search image names…" className="min-w-0 rounded-lg border border-white/20 bg-[#10110f] px-3 py-3 text-sm outline-none focus:border-[#cda762]" />
          <select aria-label="Image folder" value={folder} onChange={event => setFolder(event.target.value)} className="min-w-0 rounded-lg border border-white/20 bg-[#10110f] px-3 py-3 text-sm outline-none focus:border-[#cda762]"><option value="">All folders</option>{library.folders.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        </div>
        {images.length ? <div className="mt-5 grid min-h-0 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
          {images.map(asset => { const url = mediaUrl(asset.url); return <button key={asset.id} type="button" aria-label={`Use ${asset.originalName}`} aria-pressed={value === url} onClick={() => onSelect(url)} className={`group min-w-0 overflow-hidden rounded-lg border text-left transition hover:border-[#cda762] focus-visible:outline-2 focus-visible:outline-[#cda762] ${value === url ? "border-[#cda762] bg-[#cda762]/10" : "border-white/15 bg-[#10110f]"}`}>
            <span className="relative block aspect-[4/3] w-full"><Image src={url} alt="" fill unoptimized sizes="(min-width: 1024px) 200px, 40vw" className="object-cover" /></span>
            <span className="block break-words p-3 text-[13px] leading-5">{asset.originalName}</span>
          </button>; })}
        </div> : <p className="py-8 text-sm text-white/60">{library.assets.length ? "No images match this search or folder." : "No images yet. Upload an image in Media Library first."}</p>}
        <Link href="/admin/media" target="_blank" rel="noopener noreferrer" className="mt-5 w-fit text-[13px] text-[#ead2a0] underline underline-offset-4 hover:text-white">Open Media Library in a new tab</Link>
      </>}
    </div>
  </dialog>;
}
