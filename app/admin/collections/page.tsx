"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { slugify } from "@/lib/nuggets";

type Collection = { id: string; title: string; slug: string; description: string; image: string; visible: boolean; nuggetIds: string[]; updatedAt: string };
type NuggetChoice = { id: string; title: string; topic: string; status: string; isGold: boolean };
type Editor = Omit<Collection, "id" | "updatedAt"> & { id?: string; updatedAt?: string };
const empty: Editor = { title: "", slug: "", description: "", image: "", visible: false, nuggetIds: [] };
const input = "mt-2 w-full rounded-lg border border-white/15 bg-[#10110f] px-3 py-3 text-sm outline-none focus:border-[#cda762]";
const button = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#cda762]/40 px-4 py-2 text-[#ead2a0] transition hover:bg-[#cda762]/15 disabled:cursor-not-allowed disabled:opacity-40";
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/proxy/${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(" ") : data.message || "The request failed. Try again.");
  return data;
}
export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [nuggets, setNuggets] = useState<NuggetChoice[]>([]);
  const [form, setForm] = useState<Editor>(empty);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([api<Collection[]>("collections"), api<NuggetChoice[]>("nuggets")]).then(([items, choices]) => {
      if (active) { setCollections(items); setNuggets(choices); }
    }).catch(cause => { if (active) setError(cause.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  function edit(item: Editor) { setForm({ ...item, nuggetIds: [...item.nuggetIds] }); setError(""); setNotice(""); setConfirmDelete(false); }
  function select(id: string) { setForm(current => ({ ...current, nuggetIds: current.nuggetIds.includes(id) ? current.nuggetIds.filter(item => item !== id) : [...current.nuggetIds, id] })); }
  function move(index: number, direction: number) {
    setForm(current => {
      const ids = [...current.nuggetIds]; const next = index + direction;
      if (next < 0 || next >= ids.length) return current;
      [ids[index], ids[next]] = [ids[next], ids[index]];
      return { ...current, nuggetIds: ids };
    });
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const { id, ...body } = form;
      const saved = await api<Collection>(id ? `collections/${id}` : "collections", { method: id ? "PATCH" : "POST", body: JSON.stringify(body) });
      setCollections(current => [saved, ...current.filter(item => item.id !== saved.id)]); setForm(saved); setNotice("Collection saved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save collection."); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!form.id) return;
    setBusy(true); setError("");
    try { await api(`collections/${form.id}`, { method: "DELETE" }); setCollections(current => current.filter(item => item.id !== form.id)); setForm(empty); setConfirmDelete(false); setNotice("Collection deleted. Its Nuggets are unchanged."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete collection."); }
    finally { setBusy(false); }
  }
  const filtered = nuggets.filter(item => `${item.title} ${item.topic} ${item.status}`.toLowerCase().includes(query.toLowerCase()));
  return <AdminShell>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="font-serif">Collections</h1><p className="mt-2 text-sm text-white/50">Create reading series from existing Nuggets and arrange their order.</p></div><button type="button" onClick={() => edit(empty)} disabled={busy} className={button}><Plus size={16} />New Collection</button></div>
      {error && <p role="alert" className="mt-5 rounded-lg border border-red-400/30 p-4 text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="mt-5 text-sm text-emerald-300">{notice}</p>}
      {loading ? <p className="mt-6 text-white/50">Loading collections…</p> : <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-3">{collections.length === 0 && <p className="text-sm text-white/45">No collections yet. Create your first reading series.</p>}{collections.map(item => <button type="button" key={item.id} disabled={busy} onClick={() => edit(item)} className={`w-full rounded-xl border p-4 text-left transition hover:border-[#cda762] ${form.id === item.id ? "border-[#cda762] bg-[#cda762]/10" : "border-white/10 bg-[#191b18]"}`}><span className="block break-words font-medium">{item.title}</span><span className="mt-2 block text-xs text-white/45">{item.nuggetIds.length} Nuggets · {item.visible ? "Visible" : "Hidden"}</span></button>)}</aside>
        <form onSubmit={save} className="min-w-0 space-y-5 rounded-xl border border-white/10 bg-[#191b18] p-4 sm:p-6">
          <h2 className="font-serif">{form.id ? "Edit Collection" : "New Collection"}</h2>
          <fieldset disabled={busy} className="min-w-0 space-y-5">
            <label className="block text-sm">Title<input required maxLength={200} className={input} value={form.title} onChange={event => { const title = event.target.value; setForm(current => ({ ...current, title, slug: !current.id && (!current.slug || current.slug === slugify(current.title)) ? slugify(title) : current.slug })); }} /></label>
            <label className="block text-sm">Slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={200} className={input} value={form.slug} onChange={event => setForm(current => ({ ...current, slug: event.target.value }))} /></label>
            <label className="block text-sm">Description<textarea rows={4} maxLength={5000} className={input} value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} /></label>
            <label className="block text-sm">Cover image URL (optional)<input className={input} value={form.image} onChange={event => setForm(current => ({ ...current, image: event.target.value }))} placeholder="https://… or /images/…" /></label>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.visible} onChange={event => setForm(current => ({ ...current, visible: event.target.checked }))} className="h-4 w-4 accent-[#cda762]" />Visible in the public Library</label>
            <section><h3 className="font-serif">Reading order ({form.nuggetIds.length})</h3><p className="mt-2 text-xs text-white/45">Use the arrows to arrange the series. Draft Nuggets stay hidden from visitors; Gold access still requires Premium.</p><ol className="mt-4 max-h-96 space-y-2 overflow-y-auto">{form.nuggetIds.map((id, index) => { const item = nuggets.find(nugget => nugget.id === id); return <li key={id} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 p-3"><span className="min-w-0 flex-1 break-words text-sm">{index + 1}. {item?.title || "Deleted Nugget — remove this item"}</span><div className="flex gap-1"><button type="button" aria-label={`Move item ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)} className="rounded p-2 hover:bg-white/10 disabled:opacity-25"><ArrowUp size={16} /></button><button type="button" aria-label={`Move item ${index + 1} down`} disabled={index === form.nuggetIds.length - 1} onClick={() => move(index, 1)} className="rounded p-2 hover:bg-white/10 disabled:opacity-25"><ArrowDown size={16} /></button><button type="button" aria-label={`Remove item ${index + 1}`} onClick={() => select(id)} className="rounded p-2 text-red-300 hover:bg-red-400/10"><X size={16} /></button></div></li>; })}</ol></section>
            <section><h3 className="font-serif">Choose Nuggets</h3><input aria-label="Search Nuggets to add" value={query} onChange={event => setQuery(event.target.value)} className={input} placeholder="Search title, topic or status…" /><div className="mt-3 max-h-80 space-y-2 overflow-y-auto">{filtered.length === 0 && <p className="text-sm text-white/45">No Nuggets match.</p>}{filtered.map(item => <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 p-3 hover:border-[#cda762]/40"><input type="checkbox" checked={form.nuggetIds.includes(item.id)} onChange={() => select(item.id)} className="mt-1 h-4 w-4 shrink-0 accent-[#cda762]" /><span className="min-w-0 break-words text-sm">{item.title}<span className="mt-1 block text-xs text-white/40">{item.topic} · {item.status}{item.isGold ? " · GOLD" : ""}</span></span></label>)}</div></section>
          </fieldset>
          <div className="flex flex-wrap items-center gap-3"><button disabled={busy} className={`${button} bg-[#cda762] text-[#10110f]`}>{busy ? "Saving…" : "Save Collection"}</button>{form.id && <>{collections.find(item => item.id === form.id)?.visible && <Link href={`/collection/${collections.find(item => item.id === form.id)!.slug}`} className={button}>View Collection</Link>}<button type="button" disabled={busy} onClick={() => setConfirmDelete(true)} className={`${button} text-red-300`}><Trash2 size={15} />Delete</button></>}</div>
          {confirmDelete && <div role="alert" className="rounded-lg border border-red-400/30 p-4"><p className="text-sm">Delete this collection? Its Nuggets will remain in the Library.</p><div className="mt-3 flex gap-3"><button type="button" disabled={busy} className={button} onClick={remove}>Delete Collection</button><button type="button" disabled={busy} className={button} onClick={() => setConfirmDelete(false)}>Cancel</button></div></div>}
        </form>
      </div>}
    </div>
  </AdminShell>;
}
