"use client";

import { useRef, useState } from "react";
import { Download, LoaderCircle, X } from "lucide-react";
import { adminApiFetch } from "@/lib/admin-api";
import styles from "./AdminImportDialog.module.css";

type Kind = "topics" | "nuggets";
type Preview = {
  categoriesToCreate?: number;
  topicsToCreate?: number;
  nuggetsToCreate?: number;
  skipped: number;
  rows: {
    row: number;
    type: string;
    name: string;
    category?: string;
    action: string;
  }[];
};
const templates: Record<Kind, { csv: string; json: unknown[] }> = {
  topics: {
    csv: "type,name,description,category,visible\r\ncategory,Leadership,Leadership and business wisdom,,true\r\ntopic,Integrity,Build trust through honest work,Leadership,true\r\n",
    json: [
      {
        type: "category",
        name: "Leadership",
        description: "Leadership and business wisdom",
        visible: true,
      },
      {
        type: "topic",
        name: "Integrity",
        category: "Leadership",
        visible: true,
      },
    ],
  },
  nuggets: {
    csv: "number,title,topic,slug,scriptureRef,scriptureText,keyPrinciple,marketplaceApplication,practicalActionPlan,challenges,tag,book,bibleSection,duration,image,songUrl,nuggetUrl,isGold,featured\r\n1001,Work with Integrity,Integrity,work-with-integrity,Colossians 3:23,Work heartily,Serve with integrity,Be honest in business,Review your work|Choose one improvement,Leadership,Integrity,Colossians,New Testament,00:00,,,,false,false\r\n",
    json: [
      {
        number: 1001,
        title: "Work with Integrity",
        topic: "Integrity",
        scriptureRef: "Colossians 3:23",
        scriptureText: "Work heartily",
        keyPrinciple: "Serve with integrity",
        marketplaceApplication: "Be honest in business",
        practicalActionPlan: ["Review your work", "Choose one improvement"],
        challenges: ["Leadership"],
        songUrl: "",
        nuggetUrl: "",
        isGold: false,
      },
    ],
  },
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
      (preview.nuggetsToCreate || 0)
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
      if (file.size > 1024 * 1024)
        throw new Error("Files must be 1 MB or smaller.");
      const body = new FormData();
      body.append("file", file);
      const response = await adminApiFetch(
        `/${kind}/import${confirm ? "" : "/preview"}`,
        { method: "POST", body },
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
        const message =
          kind === "topics"
            ? `Imported ${data.categoriesCreated} categories and ${data.topicsCreated} topics. ${data.skipped} existing rows skipped.`
            : `Imported ${data.nuggetsCreated} Nuggets as drafts. ${data.skipped} existing rows skipped.`;
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
        Upload CSV, Excel (.xlsx), or JSON, up to 1 MB and 500 rows. Excel files
        must have one populated sheet with headers in the first row. JSON uses
        an array of row objects. Existing items are skipped without overwriting
        them.
      </p>
      <p className="mt-3 text-sm leading-6 text-white/60">
        {kind === "topics" ? (
          <>
            Use <code>type,name</code>, with optional{" "}
            <code>description,category,visible</code>. Category summaries with{" "}
            <code>Category,Brief Description,Number of Nuggets</code> are also
            supported. Counts are reference data and do not create Nuggets.
          </>
        ) : (
          <>
            Required: <code>number,title,topic</code>. Other fields are
            optional. All Nuggets are saved as drafts for review. Song URL and
            Nugget URL are separate. For action plans and challenges, use JSON
            lists or separate items with a line break or <code>|</code>.
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
            {count} new items will be created. {preview.skipped} existing rows
            will be skipped.
            {kind === "nuggets" ? " New Nuggets will be drafts." : ""}
          </p>
          <div className="mt-3 max-h-64 overflow-auto rounded border border-white/15">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 text-white/55">
                  <th className="p-3">Row</th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.row} className="border-b border-white/10">
                    <td className="p-3">{row.row}</td>
                    <td>{row.type}</td>
                    <td className="max-w-[240px] break-words pr-3">
                      {row.name}
                      {row.category && (
                        <span className="block text-white/45">
                          {row.category}
                        </span>
                      )}
                    </td>
                    <td>
                      {row.action === "skip" ? "Skip existing" : "Create"}
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
