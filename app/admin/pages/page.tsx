"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import SitePageEditor from "@/components/admin/SitePageEditor";
import { adminApiFetch, readAdminJson } from "@/lib/admin-api";
import { siteDefaults, sitePageLinks, type SiteSlug } from "@/lib/site-page-config";

type CustomPageSummary = {
  slug: string;
  title: string;
  published: boolean;
  showInNavigation: boolean;
  href: string;
};
const coreSlugs = Object.keys(siteDefaults) as SiteSlug[];

export default function AdminSitePagesPage() {
  const [slug, setSlug] = useState<string>("about");
  const [creating, setCreating] = useState(false);
  const [customPages, setCustomPages] = useState<CustomPageSummary[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState("");

  async function loadCustomPages(signal?: AbortSignal) {
    try {
      const response = await adminApiFetch("/settings/site-pages", { signal, cache: "no-store" });
      const pages = await readAdminJson<CustomPageSummary[]>(response);
      if (!signal?.aborted) { setCustomPages(pages || []); setListError(""); }
    } catch (error) {
      if (!signal?.aborted) setListError(error instanceof Error ? error.message : "Could not load custom pages.");
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void loadCustomPages(controller.signal);
    return () => controller.abort();
  }, []);

  function choose(next: string, isNew = false) {
    if (saving || (dirty && !window.confirm("Discard unsaved page changes?"))) return;
    setDirty(false);
    setSlug(next);
    setCreating(isNew);
  }

  function onSaved(pageSlug: string) {
    setDirty(false);
    if (creating) { setSlug(pageSlug); setCreating(false); }
    void loadCustomPages();
  }

  function onDeleted() {
    setDirty(false);
    setSlug("about");
    setCreating(false);
    void loadCustomPages();
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[37px]!">Site Pages</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
              Edit and rearrange content blocks on existing informational pages, or build new site pages.
              Manage headings, images, links, section layouts and drafts without changing code.
              Settings permission is required.
            </p>
          </div>
          <button type="button" disabled={saving} onClick={() => choose("", true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#E28906] px-4 py-3 font-semibold text-[#10110f] disabled:opacity-50">
            <Plus size={17} /> New site page
          </button>
        </div>
        {listError && <p role="alert" className="mt-5 text-sm text-amber-300">{listError}</p>}
        <div className="mt-8 grid min-w-0 gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="min-w-0 space-y-3 lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">Existing pages</h2>
            <div className="space-y-1">
              {coreSlugs.map(value => (
                <button key={value} type="button" disabled={saving} aria-pressed={!creating && slug === value}
                  onClick={() => choose(value)} className={"w-full rounded-lg border px-3 py-3 text-left text-sm disabled:opacity-50 " +
                    (!creating && slug === value ? "border-[#E28906] bg-[#E28906]/10 text-[#E28906]" : "border-transparent text-white/70 hover:border-white/20")}>
                  {sitePageLinks[value].label}
                </button>
              ))}
            </div>
            <div className="border-t border-white/10 pt-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/50">New pages</h2>
              {customPages.length === 0 && <p className="text-xs leading-5 text-white/40">No extra pages created yet.</p>}
              <div className="space-y-1">
                {customPages.map(page => (
                  <button key={page.slug} type="button" disabled={saving} onClick={() => choose(page.slug)}
                    aria-pressed={!creating && slug === page.slug}
                    className={"w-full rounded-lg border px-3 py-3 text-left text-sm disabled:opacity-50 " +
                      (!creating && slug === page.slug ? "border-[#E28906] bg-[#E28906]/10" : "border-transparent hover:border-white/20")}>
                    <span className="block break-words text-white/85">{page.title}</span>
                    <span className={"mt-1 block text-xs " + (page.published ? "text-emerald-400" : "text-amber-300")}>
                      {page.published ? "Published" : "Draft"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
          <main className="min-w-0">
            <SitePageEditor key={creating ? "new" : slug} slug={slug} creating={creating}
              onDirty={setDirty} onSaving={setSaving} onSaved={onSaved} onDeleted={onDeleted} />
          </main>
        </div>
      </div>
    </AdminShell>
  );
}
