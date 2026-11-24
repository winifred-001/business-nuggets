"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { loginFor } from "@/lib/auth-return";

type Bundle = { slug: string; name: string; credits: number; priceCents: number; currency: string; active: boolean };
type Wallet = {
  balance: number; lifetimePurchased: number; lifetimeUsed: number; expired: number; nextExpiryAt: string | null;
  canSpend: boolean; inGrace: boolean; graceEndsAt: string | null;
  lots: { reference: string; remainingCredits: number; originalExpiresAt: string }[];
};
type Allowance = { maxNuggets: number | null; used: number; remaining: number | null; expiresAt?: string | null };

function formatMoney(cents: number, currency: string) {
  try { return new Intl.NumberFormat("en", { style:"currency", currency }).format(cents / 100); }
  catch { return currency + " " + (cents / 100).toFixed(2); }
}

export default function TopUpBundles() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [allowance, setAllowance] = useState<Allowance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(API_URL + "/topups/bundles", { cache: "no-store" });
        const catalog = await response.json().catch(() => []);
        if (!response.ok) throw new Error(catalog?.message || "Could not load Top-up bundles.");
        if (!mounted) return;
        setBundles(Array.isArray(catalog) ? catalog : []);
        if (token) {
          const headers = { Authorization: "Bearer " + token };
          const [balanceResponse, nuggetResponse] = await Promise.all([
            fetch(API_URL + "/topups/wallet", { headers, cache:"no-store" }),
            fetch(API_URL + "/nuggets?limit=1", { headers, cache:"no-store" }),
          ]);
          if (balanceResponse.ok) setWallet(await balanceResponse.json());
          if (nuggetResponse.ok) {
            const nuggets = await nuggetResponse.json();
            if (mounted && nuggets?.access) setAllowance(nuggets.access);
          }
        }
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : "Could not load Top-ups.");
      } finally { if (mounted) setLoading(false); }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  async function buy(slug: string) {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.assign(loginFor("/membership#topups"));
      return;
    }
    if (!wallet?.canSpend) { setError("Renew or activate a paid subscription before buying Top-ups."); return; }
    setPaying(slug); setError("");
    try {
      const response = await fetch(API_URL + "/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ planSlug: "topup:" + slug }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.authorizationUrl) {
        const message = data.message;
        throw new Error(Array.isArray(message) ? message.join("; ") : message || "Could not begin the Top-up payment.");
      }
      window.location.assign(data.authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not begin the Top-up payment.");
      setPaying(null);
    }
  }

  return (
    <section id="topups" className="mt-8 rounded-xl border border-white/15 bg-[#111] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E28906]">Additional Nuggets</p>
          <h2 className="mt-2 font-serif text-3xl text-white">Nugget Top-up Bundles</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Buy extra Nugget selections when your monthly allowance runs out. Each Top-up credit is valid for 3 months from purchase, even if your subscription expires sooner. Credits can be redeemed again after renewal, provided they have not expired.
          </p>
        </div>
        {wallet && (
          <div className="rounded-lg border border-[#E28906]/30 bg-[#E28906]/5 px-5 py-3 text-center">
            <p className="text-xs text-white/55">Unused Top-up Credits</p>
            <p className="mt-1 font-serif text-3xl text-[#E28906]">{wallet.balance}</p>
            <p className="text-xs text-white/40">Valid for 3 months from purchase</p>
            {wallet.nextExpiryAt && <p className="mt-1 text-xs text-white/45">Next expiry: {new Date(wallet.nextExpiryAt).toLocaleDateString()}</p>}
            {wallet.expired > 0 && <p className="mt-1 text-xs text-white/40">{wallet.expired} unused credits expired</p>}
          </div>
        )}
      </div>

      {allowance && typeof allowance.maxNuggets === "number" && (
        <div className="mt-5 rounded-lg border border-white/10 p-4">
          <div className="flex justify-between gap-3 text-sm text-white/75">
            <span>Monthly Nuggets</span><span>{allowance.used} / {allowance.maxNuggets} used</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#E28906]"
              style={{width: Math.min(100, Math.round(100 * allowance.used / Math.max(1, allowance.maxNuggets))) + "%"}} />
          </div>
          <p className="mt-2 text-xs text-white/45">
            Remaining monthly selections: {allowance.remaining ?? "—"}
            {allowance.expiresAt ? " · Resets " + new Date(allowance.expiresAt).toLocaleDateString() : ""}
          </p>
        </div>
      )}

      {wallet?.inGrace && (
        <p role="status" className="mt-4 rounded-md border border-[#E28906]/30 p-3 text-sm text-[#E28906]">
          Your subscription is in its three-day grace period. Previously opened Nuggets remain readable;
          renew to use Top-up credits or open new Nuggets.
        </p>
      )}
      {error && <p role="alert" className="mt-4 rounded-md border border-red-500/25 p-3 text-sm text-red-300">{error}</p>}
      {loading && <p className="mt-5 text-sm text-white/50">Loading bundles…</p>}
      {!loading && bundles.length === 0 && (
        <p className="mt-5 text-sm text-white/50">No Top-up bundles are available for purchase yet.</p>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bundles.map(bundle => (
          <article key={bundle.slug} className="rounded-lg border border-white/10 bg-[#080808] p-5">
            <h3 className="font-serif text-xl text-white">{bundle.name}</h3>
            <p className="mt-4 font-serif text-4xl text-[#E28906]">+{bundle.credits}</p>
            <p className="mt-1 text-sm text-white/50">Extra Nugget selections</p>
            <p className="mt-3 text-2xl text-white">{formatMoney(bundle.priceCents, bundle.currency)}</p>
            <p className="mt-2 text-xs leading-5 text-white/45">
              Credits expire 3 months after purchase.
            </p>
            <button type="button" onClick={() => void buy(bundle.slug)}
              disabled={Boolean(paying) || (wallet !== null && !wallet.canSpend)}
              className="mt-5 min-h-11 w-full rounded-md bg-[#E28906] px-4 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40">
              {paying === bundle.slug ? "Opening Paystack…" : wallet && !wallet.canSpend ? "Paid plan required" : "Buy Top-up"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
