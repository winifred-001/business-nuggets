"use client";

import { useState } from "react";
import { adminApiFetch } from "@/lib/admin-api";
import { readMediaResponse } from "@/lib/media-library";

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
  rows: MatchRow[];
  summary: {
    total: number;
    matched: number;
    alreadyLinked: number;
    multiple: number;
    notFound: number;
  };
  maxApplyPerRequest: number;
};

type Props = {
  onClose: () => void;
  onApplied: () => Promise<unknown>;
};

const statusLabel: Record<MatchStatus, string> = {
  matched: "Ready to link",
  already_linked: "Already linked — skipped",
  multiple: "Multiple songs — skipped",
  not_found: "No song found",
};

export default function R2BulkSongMatchDialog({ onClose, onApplied }: Props) {
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
      const response = await adminApiFetch("/r2-audio/bulk-match/preview", {
        method: "POST",
        cache: "no-store",
      });
      const result = (await readMediaResponse(response)) as Preview;
      setPreview(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to preview R2 matches.");
    } finally {
      setLoading(false);
    }
  }

  async function applyMatches() {
    if (!preview || applying || loading) return;
    const eligible = preview.rows.filter(
      (row) => row.status === "matched" && row.reference,
    );
    if (!eligible.length) return;

    const limit = Math.min(preview.maxApplyPerRequest || 500, 500);
    const batch = eligible.slice(0, limit);
    const confirmed = window.confirm(
      `Link ${batch.length} matching songs to existing Nuggets?\n\n` +
      "Only empty Song URL fields will be updated. Existing links will not be replaced. " +
      "Song files in R2 will not be moved or copied.",
    );
    if (!confirmed) return;

    setApplying(true);
    setError("");
    setMessage("");
    try {
      const response = await adminApiFetch("/r2-audio/bulk-match/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matches: batch.map((row) => ({
            id: row.id,
            reference: row.reference,
          })),
        }),
      });
      const result = (await readMediaResponse(response)) as {
        applied: number;
        alreadyLinked: number;
      };
      setMessage(
        `${result.applied} Nuggets linked successfully. ${result.alreadyLinked} were already linked and skipped.`,
      );
      await onApplied();
      await loadPreview();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not apply R2 matches.");
    } finally {
      setApplying(false);
    }
  }

  const rows = preview?.rows.filter((row) => filter === "all" || row.status === filter) ?? [];
  const eligibleCount = preview?.summary.matched ?? 0;
  const batchSize = Math.min(eligibleCount, preview?.maxApplyPerRequest ?? 500, 500);

  return (
    <section
      aria-label="Bulk R2 song auto-match"
      className="mt-5 rounded-xl border border-[#E28906]/30 bg-[#111111] p-4 text-white sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl">Auto-Match R2 Songs</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Match existing Nuggets by their BN number. Preview the results first;
            only unassigned songs with exactly one matching R2 file can be linked.
          </p>
        </div>
        <button type="button" onClick={onClose} disabled={applying}
          className="rounded-md border border-white/20 px-4 py-2 text-sm disabled:opacity-50">
          Close
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => void loadPreview()} disabled={loading || applying}
          className="rounded-md border border-white/20 px-4 py-2 text-sm text-[#E28906] disabled:opacity-50">
          {loading ? "Checking R2 and Nuggets..." : preview ? "Refresh Preview" : "Preview R2 Matches"}
        </button>
        {preview && eligibleCount > 0 && (
          <button type="button" onClick={() => void applyMatches()} disabled={applying || loading}
            className="rounded-md bg-[#E28906] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
            {applying ? "Applying..." : `Confirm & Link ${batchSize} Songs`}
          </button>
        )}
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      {message && <p role="status" className="mt-4 text-sm text-emerald-300">{message}</p>}

      {preview && (
        <>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <Summary label="Nuggets checked" value={preview.summary.total} />
            <Summary label="Ready to link" value={preview.summary.matched} />
            <Summary label="Already linked" value={preview.summary.alreadyLinked} />
            <Summary label="Multiple matches" value={preview.summary.multiple} />
            <Summary label="Not found" value={preview.summary.notFound} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <label htmlFor="r2-bulk-filter" className="text-white/60">Show</label>
            <select id="r2-bulk-filter" value={filter}
              onChange={(event) => setFilter(event.target.value as MatchStatus | "all")}
              className="rounded-md border border-white/20 bg-[#080808] px-3 py-2 text-white">
              <option value="matched">Ready to link</option>
              <option value="all">All results</option>
              <option value="already_linked">Already linked</option>
              <option value="multiple">Multiple matches</option>
              <option value="not_found">Not found</option>
            </select>
            {eligibleCount > batchSize && (
              <span className="text-white/50">
                Up to {batchSize} links per confirmation. Refresh and apply again for the remainder.
              </span>
            )}
          </div>
          <div className="mt-3 max-h-[430px] overflow-auto rounded-md border border-white/10">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="sticky top-0 bg-[#171717] text-white/70">
                <tr>
                  <th className="px-3 py-3">BN</th>
                  <th className="px-3 py-3">Nugget</th>
                  <th className="px-3 py-3">R2 Song</th>
                  <th className="px-3 py-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 align-top">
                    <td className="whitespace-nowrap px-3 py-3">{String(row.number).padStart(4, "0")}</td>
                    <td className="px-3 py-3">{row.title}</td>
                    <td className="break-all px-3 py-3 text-white/65">
                      {row.reference?.replace(/^r2:\/\/song\//, "") ||
                        (row.status === "multiple"
                          ? `${row.matches.length} possible files — choose manually in Edit Nugget`
                          : "—")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{statusLabel[row.status]}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-white/50">No results for this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/45">
            Only the Song URL is updated. Nugget audio and existing Duration values remain unchanged.
            No database updates happen during Preview.
          </p>
        </>
      )}
    </section>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-[#080808] p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
