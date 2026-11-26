"use client";

import { useState } from "react";
import { adminApiFetch } from "@/lib/admin-api";
import { readMediaResponse } from "@/lib/media-library";
import type { R2MediaKind } from "@/lib/use-r2-media-auto-match";

type MatchStatus = "matched" | "already_linked" | "multiple" | "not_found";
type MatchRow = {
  id: string;
  number: number;
  title: string;
  status: MatchStatus;
  reference: string | null;
  matches: string[];
};
type Preview = {
  kind: R2MediaKind;
  rows: MatchRow[];
  summary: { total: number; matched: number; alreadyLinked: number; multiple: number; notFound: number };
  maxApplyPerRequest: number;
};

type Props = {
  kind: R2MediaKind;
  onClose: () => void;
  onApplied: () => Promise<unknown>;
};

const statusText: Record<MatchStatus, string> = {
  matched: "Ready to link",
  already_linked: "Already linked — skipped",
  multiple: "Multiple files — skipped",
  not_found: "Not found",
};

export default function R2BulkMediaMatchDialog({ kind, onClose, onApplied }: Props) {
  const label = kind === "images" ? "Cover Images" : "Nugget Audio";
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<MatchStatus | "all">("matched");

  async function loadPreview() {
    setLoading(true);
    setError("");
    try {
      const response = await adminApiFetch("/r2-audio/bulk-media-match/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ kind }),
      });
      const data = (await readMediaResponse(response)) as Preview;
      setPreview(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not preview R2 matches.");
    } finally {
      setLoading(false);
    }
  }

  async function applyMatches() {
    if (!preview || loading || applying) return;
    const eligible = preview.rows.filter((row) => row.status === "matched" && row.reference);
    const batch = eligible.slice(0, Math.min(500, preview.maxApplyPerRequest || 500));
    if (!batch.length) return;
    const confirmed = window.confirm(
      `Link ${batch.length} R2 ${label.toLowerCase()} files to existing Nuggets?\n\n` +
      "Only empty fields will be filled. Existing links remain unchanged. " +
      "Nothing is copied, moved, or deleted in R2.",
    );
    if (!confirmed) return;
    setApplying(true);
    setError("");
    setMessage("");
    try {
      const response = await adminApiFetch("/r2-audio/bulk-media-match/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, matches: batch.map((row) => ({ id: row.id, reference: row.reference })) }),
      });
      const result = (await readMediaResponse(response)) as { applied: number; alreadyLinked: number };
      setMessage(`${result.applied} links saved. ${result.alreadyLinked} previously assigned records were skipped.`);
      await onApplied();
      await loadPreview();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not apply matches.");
    } finally {
      setApplying(false);
    }
  }

  const rows = preview?.rows.filter((row) => filter === "all" || row.status === filter) ?? [];
  const ready = preview?.summary.matched ?? 0;
  const batchSize = Math.min(ready, preview?.maxApplyPerRequest ?? 500, 500);

  return <section className="mt-5 rounded-xl border border-[#E28906]/30 bg-[#111111] p-4 text-white sm:p-6" aria-label={`Bulk R2 ${label} auto-match`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-serif text-xl">Auto-Match R2 {label}</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Match files by the BN number at the start of their names. Preview before approving; existing assigned fields are never replaced.
        </p>
      </div>
      <button type="button" disabled={applying} onClick={onClose} className="rounded-md border border-white/20 px-4 py-2 text-sm disabled:opacity-50">Close</button>
    </div>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" disabled={loading || applying} onClick={() => void loadPreview()}
        className="rounded-md border border-white/20 px-4 py-2 text-sm text-[#E28906] disabled:opacity-50">
        {loading ? "Checking R2..." : preview ? "Refresh Preview" : "Preview R2 Matches"}
      </button>
      {preview && ready > 0 && <button type="button" disabled={loading || applying} onClick={() => void applyMatches()}
        className="rounded-md bg-[#E28906] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
        {applying ? "Applying..." : `Confirm & Link ${batchSize}`}
      </button>}
    </div>
    {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
    {message && <p role="status" className="mt-4 text-sm text-emerald-300">{message}</p>}
    {preview && <>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
        <Summary label="Nuggets checked" value={preview.summary.total} />
        <Summary label="Ready to link" value={preview.summary.matched} />
        <Summary label="Already linked" value={preview.summary.alreadyLinked} />
        <Summary label="Multiple matches" value={preview.summary.multiple} />
        <Summary label="Not found" value={preview.summary.notFound} />
      </div>
      <label className="mt-4 flex items-center gap-3 text-sm text-white/65">Show
        <select value={filter} onChange={(event) => setFilter(event.target.value as MatchStatus | "all")}
          className="rounded-md border border-white/20 bg-[#080808] px-3 py-2 text-white">
          <option value="matched">Ready to link</option>
          <option value="all">All results</option>
          <option value="already_linked">Already linked</option>
          <option value="multiple">Multiple matches</option>
          <option value="not_found">Not found</option>
        </select>
      </label>
      <div className="mt-3 max-h-[430px] overflow-auto rounded-md border border-white/10">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="sticky top-0 bg-[#171717] text-white/70"><tr>
            <th className="px-3 py-3">BN</th><th className="px-3 py-3">Nugget</th>
            <th className="px-3 py-3">R2 file</th><th className="px-3 py-3">Result</th>
          </tr></thead>
          <tbody>
            {rows.map((row) => <tr key={row.id} className="border-t border-white/10 align-top">
              <td className="px-3 py-3">{String(row.number).padStart(4, "0")}</td>
              <td className="px-3 py-3">{row.title}</td>
              <td className="max-w-xs break-all px-3 py-3 text-white/60">
                {row.reference || (row.status === "multiple" ? `${row.matches.length} candidates — choose manually on the Edit page` : "—")}
              </td>
              <td className="px-3 py-3">{statusText[row.status]}</td>
            </tr>)}
            {rows.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-white/45">No rows match this filter.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-white/45">
        Preview does not change the database. Apply runs fresh checks and updates only empty {kind === "images" ? "cover image" : "Nugget audio"} fields.
        Up to 500 links can be approved per batch.
      </p>
    </>}
  </section>;
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md border border-white/10 bg-[#080808] p-3">
    <p className="text-xs text-white/50">{label}</p>
    <p className="mt-2 text-xl font-semibold">{value}</p>
  </div>;
}
