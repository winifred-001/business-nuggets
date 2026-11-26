"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { adminApiFetch, readAdminJson } from "@/lib/admin-api";
import { siteDefaults, sitePageLinks, type SiteSlug } from "@/lib/site-page-config";
import type { LegalDocument, SiteSection } from "@/lib/legal-pages";
import { SitePageBlock } from "@/components/SitePageBlock";

type BlockKind = NonNullable<SiteSection["kind"]>;
type SavedPage = LegalDocument & { slug?: string };
const kinds: { value: BlockKind; name: string }[] = [
  { value: "text", name: "Text / content" }, { value: "image", name: "Image" },
  { value: "quote", name: "Quote" }, { value: "callout", name: "Highlight box" },
  { value: "button", name: "Call to action" }, { value: "divider", name: "Divider" },
  { value: "faq", name: "Accordion / FAQ" }, { value: "author", name: "Author / card" },
];
const field = "mt-2 w-full min-w-0 rounded-lg border border-white/20 bg-[#10110f] px-3 py-3 text-sm text-white outline-none focus:border-[#E28906]";
const action = "inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm hover:border-[#E28906] disabled:cursor-not-allowed disabled:opacity-35";
const initialPage = (): LegalDocument => ({
  title: "", introduction: "", notice: "", isCustom: true, published: false,
  showInNavigation: true, navLabel: "", metaDescription: "",
  sections: [{ id: "section-intro", title: "", body: "", kind: "text" }],
});
const newSection = (kind: BlockKind): SiteSection => ({
  id: "section-" + crypto.randomUUID(), title: "", body: "", kind, width: "full",
});
const friendlySlug = (title: string) => title.toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/g, "");

export default function SitePageEditor({
  slug, creating, onDirty, onSaving, onSaved, onDeleted,
}: {
  slug: string;
  creating: boolean;
  onDirty: (value: boolean) => void;
  onSaving: (value: boolean) => void;
  onSaved: (slug: string) => void;
  onDeleted: (slug: string) => void;
}) {
  const [document, setDocument] = useState<LegalDocument | null>(creating ? initialPage() : null);
  const [newSlug, setNewSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(!creating);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newKind, setNewKind] = useState<BlockKind>("text");
  const [showPreview, setShowPreview] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const isCore = !creating && slug in siteDefaults;
  const pageSlug = creating ? newSlug : slug;
  const publicHref = isCore ? sitePageLinks[slug as SiteSlug].href : "/pages/" + pageSlug;

  useEffect(() => {
    if (creating) return;
    const controller = new AbortController();
    adminApiFetch("/settings/pages/" + encodeURIComponent(slug), { signal: controller.signal, cache: "no-store" })
      .then(response => readAdminJson<LegalDocument | { document: LegalDocument | null }>(response, { allowEmpty: true }))
      .then(data => {
        if (controller.signal.aborted) return;
        const saved = data && "document" in data ? data.document : data;
        const fallback = slug in siteDefaults ? structuredClone(siteDefaults[slug as SiteSlug]) : null;
        setDocument(saved ?? fallback);
        if (!saved && !fallback) setError("This page no longer exists.");
      }).catch(cause => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load the page.");
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug, creating]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(next: LegalDocument) {
    setDocument(next); setDirty(true); onDirty(true); setSuccess(""); setError("");
  }

  function editSection(index: number, patch: Partial<SiteSection>) {
    if (!document) return;
    update({ ...document, sections: document.sections.map((block, i) =>
      i === index ? { ...block, ...patch } : block) });
  }


  function insertFaqTable(index: number) {
    if (!document) return;

    const section = document.sections[index];

    if (!section) return;

    const template = [
      "| Column 1 | Column 2 | Column 3 |",
      "|---|---|---|",
      "| Value 1 | Value 2 | Value 3 |",
      "| Value 4 | Value 5 | Value 6 |",
    ].join("\n");

    const currentBody = section.body.trimEnd();

    const nextBody = currentBody
      ? `${currentBody}\n\n${template}`
      : template;

    if (nextBody.length > 10000) {
      setError(
        "This FAQ answer is too long to add another table.",
      );
      return;
    }

    editSection(index, {
      body: nextBody,
    });
  }


  function moveBlock(from: number, to: number) {
    if (!document || from === to || from < 0 || to < 0 || to >= document.sections.length) return;
    const sections = [...document.sections];
    const [item] = sections.splice(from, 1);
    sections.splice(to, 0, item);
    update({ ...document, sections });
  }

  function addBlock(kind: BlockKind, after?: number) {
    if (!document || document.sections.length >= 40) return;
    const sections = [...document.sections];
    sections.splice(after === undefined ? sections.length : after + 1, 0, newSection(kind));
    update({ ...document, sections });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!document || !pageSlug || saving) return;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pageSlug) || pageSlug.length > 80) {
      setError("Enter a valid URL slug using lowercase letters, numbers and hyphens.");
      return;
    }
    if (document.sections.some(block => block.kind !== "divider" &&
      !(block.title.trim() || block.body.trim() || block.imageUrl || block.buttonText))) {
      setError("Each section needs some text, an image, or a button before publishing.");
      return;
    }
    setSaving(true); onSaving(true); setError(""); setSuccess("");
    const payload = {
      title: document.title, introduction: document.introduction, notice: document.notice,
      sections: document.sections, published: isCore ? true : document.published ?? false,
      showInNavigation: document.showInNavigation ?? false,
      navLabel: document.navLabel ?? "", metaDescription: document.metaDescription ?? "",
    };
    try {
      const response = await adminApiFetch(creating
        ? "/settings/site-pages" : "/settings/pages/" + encodeURIComponent(slug), {
        method: creating ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creating ? { ...payload, slug: pageSlug } : payload),
      });
      const saved = await readAdminJson<SavedPage>(response);
      if (!saved) throw new Error("The server did not confirm the save.");
      setDocument(saved); setDirty(false); onDirty(false);
      setSuccess(saved.published === false ? "Draft saved. It is not visible publicly." : "Page published. Changes are available on the public page.");
      onSaved(pageSlug);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the page.");
    } finally { setSaving(false); onSaving(false); }
  }

  async function removePage() {
    if (creating || isCore || !window.confirm("Delete this custom page permanently? Its public URL will stop working.")) return;
    setSaving(true); onSaving(true); setError("");
    try {
      const response = await adminApiFetch("/settings/site-pages/" + encodeURIComponent(slug), { method: "DELETE" });
      await readAdminJson(response);
      setDirty(false); onDirty(false); onDeleted(slug);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this page.");
    } finally { setSaving(false); onSaving(false); }
  }

  if (loading) return <p role="status" className="py-10 text-white/60">Loading page content…</p>;
  if (!document) return <p role="alert" className="text-red-300">{error || "Page not found."}</p>;
  const blockLabel = isCore && slug === "faqs" ? "Question" : isCore && slug === "authors" ? "Author" : "Block";

  return (
    <form onSubmit={save} className="min-w-0 space-y-6">
      <div className="rounded-xl border border-[#E28906]/25 bg-[#191b18] p-5 sm:p-6">
        <h2 className="font-serif text-2xl">{creating ? "Create new page" : "Edit page"}</h2>
        <p className="mt-2 text-sm text-white/50">Edit content, images, links and the order of blocks. Save to apply changes.</p>
        <fieldset disabled={saving} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">Page title
            <input required maxLength={200} className={field} value={document.title}
              onChange={event => {
                const title = event.target.value;
                update({ ...document, title });
                if (creating && !slugManuallyEdited) setNewSlug(friendlySlug(title));
              }} />
          </label>
          {creating && <label className="block sm:col-span-2">Public URL slug
            <div className="mt-2 text-xs text-white/50">/pages/{newSlug || "your-page-name"}</div>
            <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} className={field}
              value={newSlug} onChange={event => { setNewSlug(event.target.value); setSlugManuallyEdited(true); setDirty(true); onDirty(true); }} />
          </label>}
          {!creating && <p className="text-sm text-[#E28906] sm:col-span-2">Public address: {publicHref}</p>}
          <label className="block sm:col-span-2">Introduction
            <textarea rows={3} maxLength={3000} className={field} value={document.introduction}
              onChange={event => update({ ...document, introduction: event.target.value })} />
          </label>
          <label className="block sm:col-span-2">Notice / banner text
            <textarea rows={2} maxLength={3000} className={field} value={document.notice}
              onChange={event => update({ ...document, notice: event.target.value })} />
          </label>
          <label className="block sm:col-span-2">SEO description (optional)
            <textarea rows={2} maxLength={500} className={field} value={document.metaDescription || ""}
              onChange={event => update({ ...document, metaDescription: event.target.value })} />
          </label>
          {!isCore && <>
            <label className="flex items-center gap-3 sm:col-span-2">
              <input type="checkbox" className="h-4 w-4 accent-[#E28906]" checked={document.published === true}
                onChange={event => update({ ...document, published: event.target.checked })} />
              Published (uncheck to keep this page as a draft)
            </label>
            <label className="flex items-center gap-3 sm:col-span-2">
              <input type="checkbox" className="h-4 w-4 accent-[#E28906]" checked={document.showInNavigation === true}
                onChange={event => update({ ...document, showInNavigation: event.target.checked })} />
              Include in the site's More pages menu and footer
            </label>
            <label className="block sm:col-span-2">Navigation label (optional)
              <input maxLength={80} className={field} value={document.navLabel || ""}
                placeholder="Shown in the menu; defaults to page title"
                onChange={event => update({ ...document, navLabel: event.target.value })} />
            </label>
          </>}
        </fieldset>
        {isCore && <p className="mt-4 text-xs leading-5 text-[#E28906]">This is an established site route. Its original layout, special links and account-related features remain intact; new sections can be rearranged below.</p>}
        {slug === "contact" && isCore && <p className="mt-3 text-xs text-white/50">The support address is managed in <Link className="text-[#E28906] underline" href="/admin/settings">Settings → General</Link>.</p>}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#191b18] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-serif text-2xl">Page sections</h2>
            <p className="mt-2 text-xs leading-5 text-white/50">Drag a section by its handle or use the arrows to reorder. Text is displayed safely, not as executable HTML.</p>
          </div>
          <span className="text-sm text-[#E28906]">{document.sections.length} / 40</span>
        </div>
        <fieldset disabled={saving} className="mt-5 space-y-5">
          {document.sections.map((section, index) => (
            <div key={section.id} className="rounded-xl border border-white/15 bg-[#10110f] p-4 sm:p-5"
              onDragOver={event => event.preventDefault()}
              onDrop={event => { event.preventDefault(); if (dragIndex.current !== null) moveBlock(dragIndex.current, index); dragIndex.current = null; }}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <span className="flex items-center gap-2 font-semibold text-[#E28906]">
                  <span draggable onDragStart={event => { dragIndex.current = index; event.dataTransfer.effectAllowed = "move"; }}
                    onDragEnd={() => { dragIndex.current = null; }} role="button" tabIndex={0}
                    aria-label={"Drag section " + (index + 1)} className="cursor-grab rounded p-2 hover:bg-white/10">
                    <GripVertical size={18} />
                  </span>
                  {blockLabel} {index + 1}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" title="Move up" aria-label={"Move section " + (index + 1) + " up"}
                    disabled={index === 0} onClick={() => moveBlock(index, index - 1)} className={action}><ArrowUp size={15} /></button>
                  <button type="button" title="Move down" aria-label={"Move section " + (index + 1) + " down"}
                    disabled={index === document.sections.length - 1} onClick={() => moveBlock(index, index + 1)} className={action}><ArrowDown size={15} /></button>
                  <button type="button" title="Duplicate block" disabled={document.sections.length >= 40}
                    onClick={() => update({ ...document, sections: [...document.sections.slice(0, index + 1),
                      { ...section, id: "section-" + crypto.randomUUID() }, ...document.sections.slice(index + 1)] })}
                    className={action}><Copy size={15} />Duplicate</button>
                  <button type="button" title="Remove block" disabled={document.sections.length <= 1}
                    onClick={() => update({ ...document, sections: document.sections.filter((_, i) => i !== index) })}
                    className={action + " text-red-300"}><Trash2 size={15} />Remove</button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">Block type
                  <select className={field} value={section.kind || (slug === "faqs" ? "faq" : slug === "authors" ? "author" : "text")}
                    onChange={event => editSection(index, { kind: event.target.value as BlockKind })}>
                    {kinds.map(kind => <option key={kind.value} value={kind.value}>{kind.name}</option>)}
                  </select>
                </label>
                <label className="block">Width
                  <select className={field} value={section.width || "full"}
                    onChange={event => editSection(index, { width: event.target.value as SiteSection["width"] })}>
                    <option value="full">Full width</option><option value="half">Half width</option>
                  </select>
                </label>
                {section.kind !== "divider" && <>
                  <label className="block sm:col-span-2">Heading / label
                    <input maxLength={200} value={section.title} className={field}
                      onChange={event => editSection(index, { title: event.target.value })} />
                  </label>
                  
                  <div className="sm:col-span-2">
                    <label
                      htmlFor={`site-page-content-${section.id}`}
                      className="block text-sm"
                    >
                      Content
                    </label>

                    <textarea
                      id={`site-page-content-${section.id}`}
                      rows={8}
                      maxLength={10000}
                      value={section.body}
                      className={field}
                      onChange={(event) =>
                        editSection(index, {
                          body: event.target.value,
                        })
                      }
                    />

                      {(slug === "faqs" || section.kind === "faq") && (
                        <div className="mt-3 space-y-2">
                          <button
                            type="button"
                            onClick={() => insertFaqTable(index)}
                            className="inline-flex min-h-10 items-center rounded-lg border border-[#E28906]/40 px-4 py-2 text-sm font-medium text-[#E28906] transition hover:bg-[#E28906]/10"
                          >
                            + Insert Table
                          </button>

                          <p className="text-xs leading-5 text-white/45">
                            Insert a table template, then edit the
                            headings and values above. Use the |
                            symbol to separate columns and keep the
                            separator row below the headings.
                          </p>
                        </div>
                      )}
                    </div>

                  <label className="block sm:col-span-2">Image URL (optional)
                    <input className={field} maxLength={2000} value={section.imageUrl || ""} placeholder="https://… or /images/…"
                      onChange={event => editSection(index, { imageUrl: event.target.value })} />
                  </label>
                  <label className="block sm:col-span-2">Image description / alternative text
                    <input className={field} maxLength={200} value={section.imageAlt || ""}
                      onChange={event => editSection(index, { imageAlt: event.target.value })} />
                  </label>
                  <label className="block">Button label (optional)
                    <input className={field} maxLength={120} value={section.buttonText || ""}
                      onChange={event => editSection(index, { buttonText: event.target.value })} />
                  </label>
                  <label className="block">Button link (optional)
                    <input className={field} maxLength={2000} value={section.buttonHref || ""} placeholder="/library or https://…"
                      onChange={event => editSection(index, { buttonHref: event.target.value })} />
                  </label>
                  <label className="block">Text alignment
                    <select className={field} value={section.alignment || "left"}
                      onChange={event => editSection(index, { alignment: event.target.value as SiteSection["alignment"] })}>
                      <option value="left">Left</option><option value="center">Center</option>
                    </select>
                  </label>
                  <label className="block">Appearance
                    <select className={field} value={section.appearance || "plain"}
                      onChange={event => editSection(index, { appearance: event.target.value as SiteSection["appearance"] })}>
                      <option value="plain">Plain</option><option value="card">Card</option><option value="accent">Gold accent</option>
                    </select>
                  </label>
                </>}
              </div>
              <button type="button" className="mt-4 text-xs text-[#E28906] hover:underline" disabled={document.sections.length >= 40}
                onClick={() => addBlock(newKind, index)}>+ Insert block below</button>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[200px] flex-1 text-sm">New block type
              <select className={field} value={newKind} onChange={event => setNewKind(event.target.value as BlockKind)}>
                {kinds.map(kind => <option key={kind.value} value={kind.value}>{kind.name}</option>)}
              </select>
            </label>
            <button type="button" disabled={document.sections.length >= 40} onClick={() => addBlock(newKind)} className={action}>
              <Plus size={17} /> Add block
            </button>
          </div>
        </fieldset>
      </div>

      <div className="rounded-xl border border-white/15 bg-[#191b18] p-5 sm:p-6">
        <button type="button" onClick={() => setShowPreview(value => !value)} className={action}>
          {showPreview ? "Hide" : "Show"} block preview
        </button>
        {showPreview && <div className="mt-5 text-white">
          <p className="mb-4 text-xs text-white/50">Content preview. Built-in pages preserve their special layouts, which may display blocks differently.</p>
          <h2 className="font-serif text-3xl">{document.title || "Page title"}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-white/60">{document.introduction}</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {document.sections.map(section => <div key={section.id} className={section.width === "half" ? "" : "md:col-span-2"}>
              <SitePageBlock section={section} />
            </div>)}
          </div>
        </div>}
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-400/30 p-4 text-sm text-red-300">{error}</p>}
      {success && <p role="status" className="text-sm text-emerald-300">{success}</p>}
      <div className="flex flex-wrap items-center gap-4 pb-8">
        <button type="submit" disabled={saving || (!dirty && !creating)} className="min-h-11 rounded-lg bg-[#E28906] px-6 py-3 font-semibold text-black disabled:opacity-40">
          {saving ? "Saving…" : creating ? "Create page" : "Save changes"}
        </button>
        {!creating && (isCore || document.published) && <Link href={publicHref} target="_blank" rel="noopener noreferrer" className="text-sm text-[#E28906] hover:underline">Open public page</Link>}
        {!creating && !isCore && <button type="button" disabled={saving} onClick={() => void removePage()} className="text-sm text-red-300 hover:underline">Delete custom page</button>}
        {dirty && <span className="text-xs text-white/50">Unsaved changes</span>}
      </div>
    </form>
  );
}
