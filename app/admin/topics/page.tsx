"use client";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import AdminImportDialog from "@/components/admin/AdminImportDialog";
import AdminShell from "@/components/admin/AdminShell";
import { adminApiFetch } from "@/lib/admin-api";

type Kind = "topic" | "category";
type BaseItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  visible: boolean;
  displayOrder: number;
};
type Topic = BaseItem & {
  categoryId: number | null;
  categoryName: string | null;
  nuggetCount: number;
};
type Category = BaseItem & { topicCount: number };
type Editor = { kind: Kind; item: BaseItem | null };
const primary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#C8A35A] px-4 py-2 font-semibold text-[#080808] transition hover:bg-[#E0C48A] active:translate-y-px focus-visible:outline-2 focus-visible:outline-[#E0C48A] disabled:opacity-40 disabled:cursor-not-allowed";
const secondary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#C8A35A]/35 px-4 py-2 text-[#E0C48A] transition hover:bg-white/[0.08] active:translate-y-px focus-visible:outline-2 focus-visible:outline-[#E0C48A] disabled:opacity-40 disabled:cursor-not-allowed";
const inputClass =
  "mt-2 w-full rounded-md border border-white/15 bg-[#080808] px-3 py-3 text-sm text-white outline-none focus:border-[#C8A35A]";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await adminApiFetch(path, init);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `The server returned an unreadable response (HTTP ${response.status}). Please retry.`,
    );
  }
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Your admin session expired. Please log in again."
        : response.status === 404 && path === "/categories"
          ? "Categories are unavailable on the current API deployment. Retry after the backend finishes updating."
          : Array.isArray(data?.message)
            ? data.message.join("; ")
            : data?.message || "The request could not be completed.",
    );
  if (data === null)
    throw new Error("The server returned an empty response. Please retry.");
  return data;
}
async function fetchTaxonomy(signal?: AbortSignal) {
  const [topics, categories] = await Promise.allSettled([
    request<Topic[]>("/topics", { signal, cache: "no-store" }),
    request<Category[]>("/categories", { signal, cache: "no-store" }),
  ]);
  return {
    topics: topics.status === "fulfilled" ? topics.value : null,
    categories: categories.status === "fulfilled" ? categories.value : null,
    error: [topics, categories]
      .filter((result) => result.status === "rejected")
      .map((result) => message((result as PromiseRejectedResult).reason))
      .join(" "),
  };
}
function jsonBody(value: unknown): RequestInit {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  };
}
export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]),
    [categories, setCategories] = useState<Category[]>([]);
  const [kind, setKind] = useState<Kind>("topic"),
    [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null),
    [deleting, setDeleting] = useState<Editor | null>(null);
  const [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [visible, setVisible] = useState(true),
    [categoryId, setCategoryId] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  async function load(signal?: AbortSignal) {
    const result = await fetchTaxonomy(signal);
    if (!signal?.aborted) {
      if (result.topics) setTopics(result.topics);
      if (result.categories) setCategories(result.categories);
      setError(result.error);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void fetchTaxonomy(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          if (result.topics) setTopics(result.topics);
          if (result.categories) setCategories(result.categories);
          setError(result.error);
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(message(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  function openEditor(nextKind: Kind, item: BaseItem | null = null) {
    setEditor({ kind: nextKind, item });
    setName(item?.name || "");
    setDescription(item?.description || "");
    setVisible(item?.visible ?? true);
    setCategoryId(
      nextKind === "topic" && item && "categoryId" in item
        ? String(item.categoryId ?? "")
        : "",
    );
    setError("");
    setSuccess("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editor || busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await request(
        `/${editor.kind === "topic" ? "topics" : "categories"}${editor.item ? `/${editor.item.id}` : ""}`,
        {
          method: editor.item ? "PATCH" : "POST",
          ...jsonBody({
            name: name.trim(),
            description: description.trim(),
            visible,
            ...(editor.kind === "topic" && {
              categoryId: categoryId ? Number(categoryId) : null,
            }),
          }),
        },
      );
      setSuccess(
        `${editor.kind === "topic" ? "Topic" : "Category"} ${editor.item ? "updated" : "created"}.`,
      );
      setEditor(null);
      await load();
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting?.item || busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await request(
        `/${deleting.kind === "topic" ? "topics" : "categories"}/${deleting.item.id}`,
        { method: "DELETE" },
      );
      setSuccess(
        `${deleting.kind === "topic" ? "Topic" : "Category"} deleted.`,
      );
      setDeleting(null);
      if (deleting.kind === "category") setFilter("all");
      await load();
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }
  async function move(index: number, direction: number) {
    if (busy || index + direction < 0 || index + direction >= topics.length)
      return;
    const reordered = [...topics];
    [reordered[index], reordered[index + direction]] = [
      reordered[index + direction],
      reordered[index],
    ];
    setBusy(true);
    setError("");
    try {
      const saved = await request<Topic[]>("/topics/reorder", {
        method: "PATCH",
        ...jsonBody({ ids: reordered.map((topic) => topic.id) }),
      });
      setTopics(saved);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }
  const shownTopics = topics.filter(
    (topic) =>
      filter === "all" ||
      (filter === "none"
        ? topic.categoryId === null
        : topic.categoryId === Number(filter)),
  );
  const items = kind === "topic" ? shownTopics : categories;
  const assigned = deleting?.item
    ? deleting.kind === "topic"
      ? (deleting.item as Topic).nuggetCount
      : (deleting.item as Category).topicCount
    : 0;
  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
          <div>
            <h1 className="font-serif">Topics &amp; Categories</h1>
            <p className="mt-2 text-[13px] text-white/45">
              Organise Nuggets into topics, with optional categories to group
              them.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => openEditor("topic")}
              className={primary}
            >
              <Plus size={14} />
              New Topic
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => openEditor("category")}
              className={secondary}
            >
              <Plus size={14} />
              New Category
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setError("");
                setSuccess("");
                setImportOpen(true);
              }}
              className={secondary}
            >
              <Upload size={14} />
              Import
            </button>
          </div>
        </section>
        {error && !editor && !deleting && !importOpen && (
          <p
            role="alert"
            className="mt-5 rounded border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300"
          >
            {error}
            <button
              type="button"
              disabled={busy || loading}
              className={`${secondary} ml-3`}
              onClick={() =>
                void load().catch((cause) => setError(message(cause)))
              }
            >
              Retry Loading
            </button>
          </p>
        )}
        {success && (
          <p
            role="status"
            className="mt-5 flex items-center gap-2 rounded border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300"
          >
            <Check size={16} />
            {success}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div
            className="flex gap-3"
            role="group"
            aria-label="Choose topics or categories"
          >
            {(["topic", "category"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={kind === value}
                disabled={busy}
                onClick={() => setKind(value)}
                className={kind === value ? primary : secondary}
              >
                {value === "topic"
                  ? `Topics (${topics.length})`
                  : `Categories (${categories.length})`}
              </button>
            ))}
          </div>
          {kind === "topic" && (
            <label className="text-sm text-white/55">
              Category
              <select
                aria-label="Filter by category"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="ml-3 rounded border border-white/15 bg-[#080808] px-3 py-2 text-sm"
              >
                <option value="all">All categories</option>
                <option value="none">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {loading ? (
          <p className="mt-6 text-sm text-white/40" role="status">
            Loading topics and categories…
          </p>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-[10px] border border-white/10 bg-[#111111] p-10 text-center text-sm text-white/40">
            No {kind === "topic" ? "topics" : "categories"} to show.
          </div>
        ) : (
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex min-h-[190px] flex-col rounded-[10px] border border-white/10 bg-[#111111] p-5"
              >
                <h2 className="font-serif">{item.name}</h2>
                {item.description && (
                  <p className="mt-2 whitespace-pre-line text-sm text-white/40">
                    {item.description}
                  </p>
                )}
                <p className="mt-3 text-[13px] text-white/35">
                  {kind === "topic"
                    ? `${quantity((item as Topic).nuggetCount, "Nugget")} · ${(item as Topic).categoryName || "Uncategorized"}`
                    : quantity((item as Category).topicCount, "topic")}
                </p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] ${item.visible ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-white/10 text-white/35"}`}
                  >
                    {item.visible ? "Visible" : "Hidden"}
                  </span>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openEditor(kind, item)}
                      className="inline-flex items-center gap-1.5 text-[#C8A35A]"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setDeleting({ kind, item });
                        setError("");
                        setSuccess("");
                      }}
                      className="inline-flex items-center gap-1.5 text-red-300"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
                {kind === "topic" && filter === "all" && (
                  <div className="mt-4 flex gap-2 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      disabled={busy || topics[0]?.id === item.id}
                      aria-label={`Move ${item.name} up`}
                      onClick={() =>
                        void move(
                          topics.findIndex((topic) => topic.id === item.id),
                          -1,
                        )
                      }
                      className="rounded border border-white/10 p-2 text-white/45 disabled:opacity-20"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={busy || topics.at(-1)?.id === item.id}
                      aria-label={`Move ${item.name} down`}
                      onClick={() =>
                        void move(
                          topics.findIndex((topic) => topic.id === item.id),
                          1,
                        )
                      }
                      className="rounded border border-white/10 p-2 text-white/45 disabled:opacity-20"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
        {kind === "topic" && topics.length > 0 && (
          <section className="mt-6 rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h2 className="font-serif">Display Order</h2>
            <p className="mt-2 text-sm text-white/35">
              Choose All categories to reorder topics with the arrows. Nuggets
              keep their current topics when categories are added.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {topics.map((topic, index) => (
                <span
                  key={topic.id}
                  className="rounded border border-white/10 bg-[#080808] px-3 py-2 text-[13px] text-white/50"
                >
                  {index + 1}. {topic.name}
                </span>
              ))}
            </div>
          </section>
        )}
        {editor && (
          <Dialog
            title={`${editor.item ? "Edit" : "New"} ${editor.kind === "topic" ? "Topic" : "Category"}`}
            busy={busy}
            close={() => setEditor(null)}
          >
            <form onSubmit={save}>
              <fieldset disabled={busy} className="space-y-4">
                <label className="block text-sm text-white/55">
                  {editor.kind === "topic" ? "Topic" : "Category"} Name
                  <input
                    required
                    maxLength={120}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm text-white/55">
                  Description
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className={inputClass}
                  />
                </label>
                {editor.kind === "topic" && (
                  <label className="block text-sm text-white/55">
                    Category
                    <select
                      aria-label="Category"
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      className={inputClass}
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="flex items-center justify-between rounded border border-white/10 bg-[#080808] p-4 text-sm text-white/55">
                  Visible
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(event) => setVisible(event.target.checked)}
                    className="h-4 w-4 accent-[#C8A35A]"
                  />
                </label>
              </fieldset>
              {error && (
                <p role="alert" className="mt-4 text-sm text-red-300">
                  {error}
                </p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEditor(null)}
                  className={secondary}
                >
                  Cancel
                </button>
                <button type="submit" disabled={busy} className={primary}>
                  {busy
                    ? "Saving…"
                    : editor.item
                      ? "Save Changes"
                      : editor.kind === "topic"
                        ? "Create Topic"
                        : "Create Category"}
                </button>
              </div>
            </form>
          </Dialog>
        )}
        {deleting?.item && (
          <Dialog
            title={`Delete ${deleting.kind === "topic" ? "Topic" : "Category"}?`}
            busy={busy}
            close={() => setDeleting(null)}
          >
            <p className="text-sm leading-6 text-white/60">
              Delete <strong>{deleting.item.name}</strong>?
            </p>
            {assigned > 0 ? (
              <p className="mt-4 text-sm leading-6 text-[#E0C48A]">
                {deleting.kind === "topic"
                  ? "This topic is assigned to Nuggets. Reassign those Nuggets before deleting it."
                  : "This category contains topics. Edit those topics and move them to another category or Uncategorized first."}
              </p>
            ) : (
              <p className="mt-4 text-sm leading-6 text-white/45">
                This removes the {deleting.kind}. Nuggets are never deleted.
                {deleting.kind === "topic"
                  ? " Any follows for this topic will also be removed."
                  : ""}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-4 text-sm text-red-300">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setDeleting(null)}
                className={secondary}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || assigned > 0}
                onClick={() => void remove()}
                className="rounded-md bg-red-500 px-4 py-2 font-semibold text-white disabled:opacity-40"
              >
                {busy ? "Deleting…" : "Delete Permanently"}
              </button>
            </div>
          </Dialog>
        )}
        {importOpen && (
          <AdminImportDialog
            initialKind="topics"
            close={() => setImportOpen(false)}
            completed={async (result) => {
              setSuccess(result);
              try {
                await load();
              } catch {
                setError(
                  "Import completed. Refresh the page to reload the list.",
                );
              }
            }}
          />
        )}
      </main>
    </AdminShell>
  );
}
function quantity(count: number, noun: string) {
  return `${count} ${count === 1 ? noun : noun === "category" ? "categories" : `${noun}s`}`;
}
function message(cause: unknown) {
  return cause instanceof Error
    ? cause.message
    : "The request failed. Please retry.";
}
function Dialog({
  title,
  busy,
  close,
  wide,
  children,
}: {
  title: string;
  busy: boolean;
  close: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <dialog
      aria-label={title}
      ref={(element) => {
        if (element && !element.open) element.showModal();
      }}
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={close}
      className={`m-auto max-h-[90vh] w-[calc(100%-32px)] overflow-y-auto rounded-[10px] border border-white/10 bg-[#111111] p-6 text-[#FAF9F6] shadow-2xl backdrop:bg-black/75 ${wide ? "max-w-[760px]" : "max-w-[460px]"}`}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 className="font-serif">{title}</h2>
        <button
          type="button"
          disabled={busy}
          onClick={close}
          aria-label="Close dialog"
          className="p-1 text-white/40 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
