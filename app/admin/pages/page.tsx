"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminApiFetch } from "@/lib/admin-api";
import { siteDefaults as defaults, sitePageLinks, type SiteSlug } from "@/lib/site-page-config";
import type { LegalDocument } from "@/lib/legal-pages";

export default function AdminSitePagesPage() {
  const [slug, setSlug] = useState<SiteSlug>("about");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  return <AdminShell>
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <h1 className="font-serif text-[37px]!">Site Pages</h1>
      <p className="mt-3 text-sm leading-6 text-white/60">Edit About, Contact, FAQs, Privacy Policy and Terms of Use. Saving publishes changes immediately. Settings permission is required.</p>
      <div className="my-6 flex flex-wrap gap-3" role="group" aria-label="Choose site page">
        {(Object.keys(defaults) as SiteSlug[]).map(value => <button key={value} type="button" aria-pressed={slug === value} disabled={saving} onClick={() => { if (value !== slug && (!dirty || window.confirm("Discard your unsaved changes?"))) { setDirty(false); setSlug(value); } }} className={`rounded border px-4 py-3 text-sm ${slug === value ? "border-[#cda762] bg-[#cda762] text-black" : "border-white/20"}`}>{sitePageLinks[value].label}</button>)}
      </div>
      <SiteEditor key={slug} slug={slug} onDirtyChange={setDirty} onSavingChange={setSaving} />
    </div>
  </AdminShell>;
}

function SiteEditor({ slug, onDirtyChange, onSavingChange }: { slug: SiteSlug; onDirtyChange: (dirty: boolean) => void; onSavingChange: (saving: boolean) => void }) {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await adminApiFetch(`/settings/pages/${slug}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error(response.status === 403 ? "You need Settings permission to edit site pages." : "Could not load this page. Please retry.");
        const data = await response.json();
        if (!controller.signal.aborted) setDocument(data ?? structuredClone(defaults[slug]));
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load page.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(next: LegalDocument) { setDocument(next); setDirty(true); onDirtyChange(true); setSuccess(""); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!document) return;
    setSaving(true); onSavingChange(true); setError(""); setSuccess("");
    try {
      const { title, introduction, notice, sections } = document;
      const response = await adminApiFetch(`/settings/pages/${slug}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, introduction, notice, sections }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join("; ") : data.message || "Could not save page.");
      setDocument(data); setDirty(false); onDirtyChange(false); setSuccess("Published successfully. The public page will show this content on its next load.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save page."); }
    finally { setSaving(false); onSavingChange(false); }
  }

  const fieldClass = "mt-2 w-full rounded-lg border border-white/20 bg-[#111111] px-4 py-3 text-white outline-none focus:border-[#cda762]";
  if (loading) return <p role="status">Loading site page…</p>;
  if (!document) return <p role="alert" className="text-red-300">{error}</p>;
  return <form onSubmit={save} className="space-y-6">
    <fieldset disabled={saving} className="space-y-6 disabled:opacity-60">
      <label className="block">Page title<input required maxLength={200} value={document.title} onChange={event => update({ ...document, title: event.target.value })} className={fieldClass} /></label>
      <label className="block">Introduction<textarea rows={3} maxLength={3000} value={document.introduction} onChange={event => update({ ...document, introduction: event.target.value })} className={fieldClass} /></label>
      <label className="block">Notice (optional)<textarea rows={3} maxLength={3000} value={document.notice} onChange={event => update({ ...document, notice: event.target.value })} className={fieldClass} /></label>
      {slug === "contact" && <p className="text-sm text-[#ead2a0]">Change the support email in <Link href="/admin/settings" className="underline">Settings → General</Link>. The email button uses that address automatically.</p>}
      <p className="text-sm leading-6 text-white/50">Use plain text. Blank lines separate paragraphs. HTML is displayed as text.</p>
      {document.sections.map((section, index) => <fieldset key={section.id} className="space-y-4 rounded-xl border border-white/15 p-5">
        <legend className="px-2 text-[#ead2a0]">{slug === "faqs" ? "Question" : "Section"} {index + 1}</legend>
        <label className="block">{slug === "faqs" ? "Question" : "Section title"}<input required maxLength={200} value={section.title} onChange={event => update({ ...document, sections: document.sections.map((item, i) => i === index ? { ...item, title: event.target.value } : item) })} className={fieldClass} /></label>
        <label className="block">{slug === "faqs" ? "Answer" : "Content"}<textarea required rows={8} maxLength={10000} value={section.body} onChange={event => update({ ...document, sections: document.sections.map((item, i) => i === index ? { ...item, body: event.target.value } : item) })} className={fieldClass} /></label>
        <button type="button" disabled={document.sections.length === 1} onClick={() => update({ ...document, sections: document.sections.filter((_, i) => i !== index) })} className="text-sm text-red-300 disabled:opacity-40">Remove {slug === "faqs" ? "question" : "section"}</button>
      </fieldset>)}
      <button type="button" disabled={document.sections.length >= 40} onClick={() => update({ ...document, sections: [...document.sections, { id: `section-${crypto.randomUUID()}`, title: "", body: "" }] })} className="rounded-lg border border-white/25 px-4 py-3 disabled:opacity-40">Add {slug === "faqs" ? "question" : "section"}</button>
    </fieldset>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {success && <p role="status" className="text-green-300">{success}</p>}
    <div className="flex flex-wrap items-center gap-5">
      <button type="submit" disabled={saving || !dirty} className="rounded-lg bg-[#cda762] px-6 py-3 font-semibold text-black disabled:opacity-50">{saving ? "Publishing…" : "Save & publish"}</button>
      <Link href={sitePageLinks[slug].href} target="_blank" rel="noopener noreferrer" className="text-[#ead2a0]">View public page ↗</Link>
      {dirty && <span className="text-sm text-white/50">Unsaved changes</span>}
    </div>
  </form>;
}
