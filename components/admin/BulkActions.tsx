"use client";
import { useRef, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import styles from "./AdminImportDialog.module.css";
type Action = { value: string; label: string };
export default function BulkActions({
  ids,
  total,
  all,
  toggleAll,
  clear,
  actions,
  apply,
  names,
  noun,
}: {
  ids: string[];
  total: number;
  all: boolean;
  toggleAll: () => void;
  clear: () => void;
  actions: Action[];
  apply: (action: string, ids: string[]) => Promise<void>;
  names: string[];
  noun: string;
}) {
  const [action, setAction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<{
    ids: string[];
    names: string[];
  } | null>(null);
  const locked = useRef(false);
  async function run(value: string, selected: string[]) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await apply(value, selected);
      clear();
      setConfirm(null);
      setAction("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The bulk action failed. Please retry.",
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      aria-label={`Bulk ${noun} actions`}
      className="mt-5 rounded-lg border border-white/15 bg-white/[0.02] p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            aria-label={`Select all ${total} filtered ${noun}`}
            checked={all}
            disabled={busy || !total}
            onChange={toggleAll}
            className="h-4 w-4 accent-[#cda762]"
            ref={(element) => {
              if (element) element.indeterminate = ids.length > 0 && !all;
            }}
          />
          Select all {total} filtered {noun}
        </label>
        <span className="text-[13px] text-white/50">{ids.length} selected</span>
        <button
          type="button"
          className={styles.button}
          disabled={busy || !ids.length}
          onClick={clear}
        >
          Clear Selection
        </button>
        <select
          aria-label={`Bulk ${noun} action`}
          value={action}
          disabled={busy}
          onChange={(event) => {
            setAction(event.target.value);
            setError("");
          }}
          className="rounded border border-white/20 bg-[#10110f] px-3 py-2 text-[13px]"
        >
          <option value="">Choose action</option>
          {actions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.button}
          disabled={busy || !ids.length || !action}
          onClick={() => {
            setError("");
            if (action === "delete")
              setConfirm({ ids: [...ids], names: [...names] });
            else void run(action, [...ids]);
          }}
        >
          {busy && <LoaderCircle size={14} className="animate-spin" />}
          {busy ? "Applying…" : "Apply to Selected"}
        </button>
      </div>
      <p className="mt-2 text-xs text-white/45">
        Selection includes matching items across all pages. Changing filters
        clears the selection.
      </p>
      {!confirm && error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {confirm && (
        <dialog
          aria-label={`Delete selected ${noun}`}
          ref={(element) => {
            if (element && !element.open) element.showModal();
          }}
          onCancel={(event) => {
            if (locked.current) event.preventDefault();
          }}
          onClose={() => {
            if (!locked.current) setConfirm(null);
          }}
          className={`${styles.dialog} admin-typography`}
        >
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-serif">
              Delete {confirm.ids.length} {noun}?
            </h2>
            <button
              type="button"
              aria-label="Close bulk deletion"
              className={styles.button}
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              <X size={16} />
            </button>
          </div>
          <p className="mt-4 text-sm text-white/65">
            This permanently deletes the selected {noun}. Review the selection
            before confirming.
          </p>
          <ul className="mt-4 max-h-52 list-disc overflow-auto pl-5 text-sm text-white/70">
            {confirm.names.map((name, index) => (
              <li key={`${name}:${index}`}>{name}</li>
            ))}
          </ul>
          {noun !== "Nuggets" && (
            <p className="mt-3 text-sm text-white/55">
              Items still containing {noun === "topics" ? "Nuggets" : "topics"}{" "}
              cannot be deleted. If any selected item is in use, the whole batch
              stops without deleting anything.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-300">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={styles.button}
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.primary}`}
              disabled={busy}
              onClick={() => void run("delete", confirm.ids)}
            >
              {busy ? "Deleting…" : `Delete ${confirm.ids.length} Selected`}
            </button>
          </div>
        </dialog>
      )}
    </section>
  );
}
