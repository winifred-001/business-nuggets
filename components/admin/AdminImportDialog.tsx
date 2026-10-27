"use client";

import { useRef, useState } from "react";
import { Download, LoaderCircle, X } from "lucide-react";
import {
  ADMIN_IMPORT_LIMIT,
  uploadAdminImport,
} from "@/lib/admin-import-upload";
import styles from "./AdminImportDialog.module.css";

type Kind = "topics" | "nuggets";
type Preview = {
  categoriesToCreate?: number;
  topicsToCreate?: number;
  topicsToAssign?: number;
  nuggetsToCreate?: number;
  skipped: number;
  rows: {
    row: number;
    type: string;
    name: string;
    category?: string;
    topic?: string;
    action: string;
  }[];
};
const topicExample = [
  {
    type: "category",
    name: "Stewardship",
    description: "Manage resources wisely",
  },
  {
    type: "topic",
    name: "Money Management",
    category: "Stewardship",
    description: "Plan spending and savings",
  },
  {
    type: "nugget",
    number: 1001,
    title: "Plan Wisely",
    topic: "Money Management",
    category: "Stewardship",
    scriptureRef: "Proverbs 21:5",
    keyPrinciple: "Plan diligently",
    details: "Prepare a clear plan before committing resources.",
    practicalActionPlan: ["Review the budget"],
    songUrl: "",
    nuggetUrl: "",
  },
];
const nuggetExample = [
  {
    number: 1001,
    title: "Plan Wisely",
    topic: "Money Management",
    category: "Stewardship",
    scriptureRef: "Proverbs 21:5",
    scriptureText: "",
    keyPrinciple: "Plan diligently",
    details: "Prepare a clear plan before committing resources.",
    marketplaceApplication: "Review business spending",
    practicalActionPlan: ["Review the budget"],
    challenges: ["Money"],
    tag: "Stewardship",
    book: "Proverbs",
    bibleSection: "Old Testament",
    duration: "00:00",
    image: "",
    songUrl: "",
    nuggetUrl: "",
    isGold: false,
    featured: false,
  },
];
function makeTemplate(rows: object[]) {
  const objects = rows as Record<string, unknown>[];
  const headers = [...new Set(objects.flatMap((row) => Object.keys(row)))];
  const cell = (value: unknown) =>
    `"${String(Array.isArray(value) ? JSON.stringify(value) : (value ?? "")).replace(/"/g, '""')}"`;
  return {
    json: objects,
    csv:
      [
        headers.map(cell).join(","),
        ...objects.map((row) =>
          headers.map((header) => cell(row[header])).join(","),
        ),
      ].join("\r\n") + "\r\n",
  };
}
const templates: Record<Kind, { csv: string; json: unknown[] }> = {
  topics: makeTemplate(topicExample),
  nuggets: makeTemplate(nuggetExample),
};
export default function AdminImportDialog({
  initialKind,
  close,
  completed,
}: {
  initialKind: Kind;
  close: () => void;
  completed: (message: string, kind: Kind) => Promise<void> | void;
}) {
  const [kind, setKind] = useState(initialKind);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"preview" | "import" | null>(null);
  const [notice, setNotice] = useState("");
  const locked = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const count = preview
    ? (preview.categoriesToCreate || 0) +
      (preview.topicsToCreate || 0) +
      (preview.nuggetsToCreate || 0) +
      (preview.topicsToAssign || 0)
    : 0;
  function download(format: "csv" | "json") {
    const content =
      format === "csv"
        ? templates[kind].csv
        : JSON.stringify(templates[kind].json, null, 2);
    const url = URL.createObjectURL(
      new Blob([content], {
        type: format === "csv" ? "text/csv;charset=utf-8" : "application/json",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${kind === "topics" ? "topics-categories" : "nuggets"}-template.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`${format.toUpperCase()} template downloaded.`);
  }
  async function submit(confirm: boolean) {
    if (!file || locked.current || (confirm && !preview)) return;
    locked.current = true;
    setBusy(confirm ? "import" : "preview");
    setError("");
    setNotice("");
    if (!confirm) setPreview(null);
    try {
      if (!/\.(csv|xlsx|json)$/i.test(file.name))
        throw new Error("Choose a CSV, Excel (.xlsx), or JSON file.");
      if (file.size > ADMIN_IMPORT_LIMIT)
        throw new Error("Files must be 5 MB or smaller.");
      const response = await uploadAdminImport(
        kind,
        confirm ? "commit" : "preview",
        file,
      );
      const raw = await response.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(
          `The import server returned an unreadable response (HTTP ${response.status}). Please retry.`,
        );
      }
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "Your admin session expired. Please log in again."
            : response.status === 403
              ? "You need permission to manage Nuggets to import content."
              : Array.isArray(data?.message)
                ? data.message.join("; ")
                : data?.message || `Import failed (HTTP ${response.status}).`,
        );
      if (!data)
        throw new Error(
          "The import server returned an empty response. Please retry.",
        );
      if (!confirm) {
        setPreview(data);
        setNotice("Preview ready. Review the rows before importing.");
      } else {
        const message = `Imported ${data.categoriesCreated || 0} categories, ${data.topicsCreated || 0} topics and ${data.nuggetsCreated || 0} Nuggets as drafts. ${data.topicsAssigned || 0} existing topics linked to categories. ${data.skipped} existing items skipped.`;
        // Keep the completed write distinct from a subsequent list refresh failure.
        setPreview(null);
        setFile(null);
        await completed(message, kind);
        close();
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Import failed. Please retry.",
      );
      if (confirm) setPreview(null);
    } finally {
      locked.current = false;
      setBusy(null);
    }
  }
  return (
    <dialog
      aria-label="Import content"
      ref={(element) => {
        if (element && !element.open) element.showModal();
      }}
      onCancel={(event) => {
        if (locked.current) event.preventDefault();
      }}
      onClose={close}
      className={`${styles.dialog} admin-typography`}
      aria-busy={!!busy}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="font-serif">Import Content</h2>
        <button
          type="button"
          className={styles.button}
          disabled={!!busy}
          onClick={close}
          aria-label="Close import"
        >
          <X size={18} />
        </button>
      </div>
      <label className="block text-sm">
        Import into
        <select
          aria-label="Import into"
          disabled={!!busy}
          value={kind}
          className={styles.input}
          onChange={(event) => {
            setKind(event.target.value as Kind);
            setFile(null);
            setPreview(null);
            setError("");
            setNotice("");
            if (fileInput.current) fileInput.current.value = "";
          }}
        >
          <option value="topics">Topics &amp; Categories</option>
          <option value="nuggets">Nuggets</option>
        </select>
      </label>
      <p className="mt-4 text-sm leading-6 text-white/60">
        Upload CSV, Excel (.xlsx), or JSON, up to 5 MB and 500 rows. Excel files
        must have one populated sheet with headers in the first row. JSON uses
        an array of row objects. Existing items are skipped without overwriting
        them.
      </p>
      <p className="mt-3 text-sm leading-6 text-white/60">
        {kind === "topics" ? (
          <>
            Import category/topic rows with{" "}
            <code>type,name,description,category,visible</code>. To include
            Nuggets in the same file, use <code>type=nugget</code> with{" "}
            <code>number,title,topic,category</code> and optional Nugget fields.
            Download the hierarchy template for an example. Category summaries
            using <code>Category,Brief Description,Number of Nuggets</code>{" "}
            still work; counts are reference data.
          </>
        ) : (
          <>
            Required: <code>number,title,topic</code>. Add <code>category</code>{" "}
            to group the topic. Missing topics and categories are created and
            linked automatically. Existing topics keep their current category;
            conflicting category assignments stop the import. All Nuggets are
            drafts. Song URL and Nugget URL are separate. Lists accept JSON
            arrays, line breaks, or <code>|</code>.
          </>
        )}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!!busy}
          className={styles.button}
          onClick={() => download("csv")}
        >
          <Download size={14} />
          CSV Template
        </button>
        <button
          type="button"
          disabled={!!busy}
          className={styles.button}
          onClick={() => download("json")}
        >
          <Download size={14} />
          JSON Template
        </button>
      </div>
      <p className="mt-2 text-xs text-white/45">
        For Excel, open the CSV template and save as .xlsx.
      </p>
      <label className="mt-5 block text-sm">
        Import file
        <input
          ref={fileInput}
          disabled={!!busy}
          type="file"
          accept=".csv,.xlsx,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className={styles.file}
          onChange={(event) => {
            setFile(event.target.files?.[0] || null);
            setPreview(null);
            setError("");
            setNotice("");
          }}
        />
      </label>
      <p
        role="status"
        aria-live="polite"
        className="mt-3 text-sm text-[#ead2a0]"
      >
        {busy === "preview"
          ? "Reading and checking your file…"
          : busy === "import"
            ? "Importing your items…"
            : notice}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {preview && (
        <section className="mt-4">
          <p className="text-sm">
            {preview.categoriesToCreate || 0} categories,{" "}
            {preview.topicsToCreate || 0} topics and{" "}
            {preview.nuggetsToCreate || 0} Nuggets will be created.{" "}
            {preview.topicsToAssign || 0} existing topics will be linked to
            categories. {preview.skipped} existing items will be skipped.
            {kind === "nuggets" ? " New Nuggets will be drafts." : ""}
          </p>
          <div className="mt-3 max-h-64 overflow-auto rounded border border-white/15">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 text-white/55">
                  <th className="p-3">Row</th>
                  <th>Type</th>
                  <th>Name / Topic / Category</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={`${row.type}:${row.name}:${row.row}`}
                    className="border-b border-white/10"
                  >
                    <td className="p-3">{row.row}</td>
                    <td>{row.type}</td>
                    <td className="max-w-[240px] break-words pr-3">
                      {row.name}
                      {row.topic && (
                        <span className="block text-white/55">
                          Topic: {row.topic}
                        </span>
                      )}
                      {row.category && (
                        <span className="block text-white/45">
                          {row.category}
                        </span>
                      )}
                    </td>
                    <td>
                      {row.action === "skip"
                        ? "Skip existing"
                        : row.action === "assign"
                          ? "Link category"
                          : "Create"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-white/50">
            All new items are saved together. Invalid rows stop the import.
          </p>
        </section>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          className={styles.button}
          disabled={!!busy}
          onClick={close}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={!!busy || !file}
          onClick={() => void submit(false)}
        >
          {busy === "preview" && (
            <LoaderCircle className="animate-spin" size={15} />
          )}
          {busy === "preview" ? "Checking…" : "Preview File"}
        </button>
        {preview && (
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            disabled={!!busy || !count}
            onClick={() => void submit(true)}
          >
            {busy === "import" && (
              <LoaderCircle className="animate-spin" size={15} />
            )}
            {busy === "import" ? "Importing…" : `Import ${count} Items`}
          </button>
        )}
      </div>
    </dialog>
  );
}
