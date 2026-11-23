"use client";

import { useMemo, useState } from "react";
import { adminApiFetch } from "@/lib/admin-api";
import { readMediaResponse } from "@/lib/media-library";

type R2File = { key: string; name: string; size: number; reference: string };
type R2ListResponse = { files: R2File[]; nextContinuationToken: string | null };

export default function R2ImagePicker({
  value,
  onSelect,
  disabled = false,
}: {
  value: string;
  onSelect: (url: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<R2File[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const visibleFiles = useMemo(() => files.filter((file) =>
    file.name.toLowerCase().includes(search.trim().toLowerCase())), [files, search]);

  async function loadFiles(next?: string) {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ kind: "images" });
      if (next) query.set("continuationToken", next);
      const response = await adminApiFetch(`/r2-audio/files?${query.toString()}`, { cache: "no-store" });
      const data = (await readMediaResponse(response)) as R2ListResponse;
      setFiles((current) => next ? [...current, ...data.files] : data.files);
      setToken(data.nextContinuationToken);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not browse R2 images.");
    } finally {
      setLoading(false);
    }
  }

  function toggleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setFiles([]);
    setToken(null);
    setSearch("");
    void loadFiles();
  }

  return (
    <div className="mt-3">
      <button type="button" disabled={disabled} onClick={toggleOpen}
        className="min-h-10 w-full rounded-md border border-[#E28906]/40 px-4 text-[13px] text-[#E28906] hover:bg-[#E28906]/10 disabled:opacity-50">
        {open ? "Close R2 Images" : "Browse R2 Images"}
      </button>
      {open && <section className="mt-3 rounded-lg border border-white/15 bg-[#111111] p-3" aria-label="Browse R2 cover images">
        <input type="search" aria-label="Search loaded R2 images" value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search loaded R2 image filenames..."
          className="mb-3 h-10 w-full rounded-md border border-white/15 bg-[#080808] px-3 text-sm text-white" />
        <div className="grid max-h-[380px] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {visibleFiles.map((file) => <button key={file.key} type="button"
            aria-label={`Use ${file.name}`} aria-pressed={value === file.reference}
            onClick={() => { onSelect(file.reference); setOpen(false); }}
            className={`overflow-hidden rounded-md border text-left ${value === file.reference ? "border-[#E28906]" : "border-white/10"}`}>
            {/* Native img avoids Next.js optimizer requesting a private R2 hostname. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.reference} alt="" loading="lazy" className="aspect-square w-full bg-black object-contain" />
            <span className="block break-words p-2 text-xs text-white/75">{file.name}</span>
          </button>)}
        </div>
        {!loading && !visibleFiles.length && <p className="mt-3 text-sm text-white/45">No matching images in the loaded files.</p>}
        {loading && <p role="status" className="mt-3 text-sm text-white/50">Loading images...</p>}
        {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
        {token && <button type="button" disabled={loading} onClick={() => void loadFiles(token)}
          className="mt-3 rounded-md border border-white/20 px-4 py-2 text-sm text-[#E28906] disabled:opacity-50">Load more images</button>}
      </section>}
    </div>
  );
}
