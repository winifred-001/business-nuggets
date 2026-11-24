"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { API_URL } from "@/lib/api";
import { subscriptionPlanSlug } from "@/lib/subscription-plan-slug";

type Bundle = {
  slug: string; name: string; credits: number; priceCents: number;
  currency: string; active: boolean;
};

function money(cents: number, currency: string) {
  try { return new Intl.NumberFormat("en", { style:"currency", currency }).format(cents / 100); }
  catch { return currency + " " + (cents / 100).toFixed(2); }
}

export default function TopUpBundlesAdmin() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Bundle | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("3");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [active, setActive] = useState(true);
  const slug = editing?.slug ?? subscriptionPlanSlug(name);

  const auth = () => localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(API_URL + "/admin/subscriptions/topups", {
        headers: { Authorization: "Bearer " + auth() }, cache: "no-store",
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data?.message || "Could not load Top-up bundles.");
      setBundles(Array.isArray(data) ? data : []);
      setPageError("");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not load Top-up bundles.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function edit(bundle: Bundle | null) {
    setEditing(bundle);
    setName(bundle?.name || "");
    setCredits(String(bundle?.credits || 3));
    setPrice(bundle ? String(bundle.priceCents / 100) : "");
    setCurrency(bundle?.currency || "USD");
    setActive(bundle?.active ?? true);
    setModalError("");
  }

  async function save() {
    const count = Number(credits), amount = Number(price);
    if (!slug || !name.trim()) { setModalError("Enter a bundle name so its slug can be generated."); return; }
    if (!Number.isInteger(count) || count < 1 || count > 10000) {
      setModalError("Credits must be between 1 and 10,000."); return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) > 1000000000) {
      setModalError("Enter a valid positive price."); return;
    }
    setModalError("");
    setSaving(true);
    try {
      const response = await fetch(
        API_URL + "/admin/subscriptions/topups" + (editing ? "/" + encodeURIComponent(editing.slug) : ""),
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + auth() },
          body: JSON.stringify({
            ...(!editing ? { slug } : {}),
            name: name.trim(), credits: count, priceCents: Math.round(amount * 100),
            currency: currency.toUpperCase(),
            ...(editing ? { active } : {}),
          }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = result.message;
        throw new Error(Array.isArray(msg) ? msg.join("; ") : msg || "Could not save bundle.");
      }
      setEditing(undefined);
      await load();
    } catch (error) {
      setModalError(error instanceof Error ? error.message : "Could not save bundle.");
    } finally { setSaving(false); }
  }

  return (
    <section className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-white">Top-up Bundles</h2>
          <p className="mt-1 text-sm text-white/50">Extra Nugget selections for paid subscribers. Each purchase is valid for 3 months, even if the subscription expires first.</p>
        </div>
        <button onClick={() => edit(null)} type="button"
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#E28906] px-4 text-sm font-semibold text-black">
          <Plus size={16}/> New Bundle
        </button>
      </div>
      {pageError && <p role="alert" className="rounded-md border border-red-500/30 p-3 text-sm text-red-300">{pageError}</p>}
      {loading && <p className="text-sm text-white/45">Loading Top-up bundles…</p>}
      {!loading && bundles.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-[#111] p-6 text-sm text-white/55">
          No Top-up bundles yet. Create your first bundle to make it available to paid members.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bundles.map(bundle => (
          <article key={bundle.slug} className="rounded-xl border border-white/10 bg-[#111] p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-xl text-white">{bundle.name}</h3>
              <span className={"rounded-full px-2 py-1 text-xs " + (bundle.active ? "bg-emerald-500/10 text-emerald-300" : "bg-white/10 text-white/45")}>
                {bundle.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold text-[#E28906]">+{bundle.credits} Nuggets</p>
            <p className="mt-2 text-base text-white/80">{money(bundle.priceCents, bundle.currency)}</p>
            <p className="mt-2 text-xs leading-5 text-white/50">
              Credit validity: 3 months from purchase
            </p>
            <button type="button" className="mt-4 text-sm font-semibold text-[#E28906]" onClick={() => edit(bundle)}>
              Edit Bundle
            </button>
          </article>
        ))}
      </div>
      {editing !== undefined && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-3">
          <section role="dialog" aria-modal="true" aria-labelledby="topup-form-title"
            className="flex max-h-[92dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-xl border border-white/15 bg-[#111] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <h3 id="topup-form-title" className="font-serif text-2xl">{editing ? "Edit Bundle" : "New Top-up Bundle"}</h3>
              <button onClick={() => setEditing(undefined)} disabled={saving} type="button" aria-label="Close"><X size={20}/></button>
            </div>
            <div className="grid min-h-0 gap-3 overflow-y-auto p-5">
              <label className="text-sm text-white/70">Bundle name
                <input value={name} onChange={e => setName(e.target.value)} maxLength={100}
                  className="mt-1 h-10 w-full rounded-md border border-white/15 bg-[#080808] px-3 text-white" />
              </label>
              <p className="rounded border border-white/10 px-3 py-2 text-xs text-white/50">Slug: <span className="text-[#E28906]">{slug || "generated-from-name"}</span></p>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-white/70">Extra Nuggets
                  <input type="number" min={1} max={10000} value={credits} onChange={e => setCredits(e.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-white/15 bg-[#080808] px-3 text-white" />
                </label>
                <label className="text-sm text-white/70">Price
                  <input type="number" min="0.01" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-white/15 bg-[#080808] px-3 text-white" />
                </label>
                <label className="text-sm text-white/70">Currency
                  <input value={currency} maxLength={3} onChange={e => setCurrency(e.target.value.toUpperCase())}
                    className="mt-1 h-10 w-full rounded-md border border-white/15 bg-[#080808] px-3 text-white" />
                </label>
              </div>
              <p className="text-xs leading-5 text-white/50">Credits expire exactly 3 months after purchase. If the subscription expires first, unused credits remain valid until their own expiry date and can be redeemed after renewal.</p>
              {editing && <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active and available for purchase
              </label>}
            </div>
            <div className="border-t border-white/10 px-5 py-3">
              {modalError && <p role="alert" className="mb-3 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{modalError}</p>}
              <div className="flex justify-end gap-3">
                <button disabled={saving} onClick={() => setEditing(undefined)} className="rounded border border-white/15 px-4 py-2 text-sm">Cancel</button>
                <button disabled={saving} onClick={() => void save()} className="rounded bg-[#E28906] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{saving ? "Saving…" : editing ? "Save Changes" : "Create Bundle"}</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
