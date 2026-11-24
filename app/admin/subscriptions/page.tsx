"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  Plus,
  X,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import { API_URL } from "@/lib/api";
import { subscriptionPlanSlug } from "@/lib/subscription-plan-slug";
import TopUpBundlesAdmin from "@/components/admin/TopUpBundlesAdmin";

type SubscriptionPlan = {
  id: number;

  slug: string;
  name: string;

  priceCents: number;
  currency: string;

  billingCycle: string;

  features:
    readonly string[];

  active: boolean;

  displayOrder: number;

  subscriberCount: number;
  maxNuggets: number;
  accessDurationHours: number;
  quotaWindowHours: number;
};

type BillingTransaction = {
  id: number;

  userId: number;

  member: string;
  email: string;

  planSlug: string;

  amountCents: number;

  currency: string;

  status: string;

  createdAt: string;
};

type SubscriptionSummary = {
  activeSubscribers: number;
  expiringSoon: number;
  graceMembers: number;
  monthlyTopUpSales: number;
  verifiedPayments: number;
  monthlyRevenueByCurrency: { currency: string; amountCents: number }[];
};

type SubscriptionResponse = {
  summary?: SubscriptionSummary;
  plans:
    SubscriptionPlan[];

  transactions:
    BillingTransaction[];
};

export default function AdminSubscriptionsPage() {
  const [section, setSection] = useState<"overview" | "plans" | "topups" | "payments">("overview");
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [
    plans,
    setPlans,
  ] =
    useState<
      SubscriptionPlan[]
    >([]);

  const [
    transactions,
    setTransactions,
  ] =
    useState<
      BillingTransaction[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingPlan,
    setEditingPlan,
  ] =
    useState<SubscriptionPlan | null>(
      null,
    );

  const [name, setName] =
    useState("");

  const slug = editingPlan?.slug ?? subscriptionPlanSlug(name);
  const [modalError, setModalError] = useState("");

  const [price, setPrice] =
    useState("");

  const [
    currency,
    setCurrency,
  ] = useState("USD");

  const [
    billingCycle,
    setBillingCycle,
  ] = useState("monthly");

  const [
    features,
    setFeatures,
  ] = useState("");

  const [active, setActive] =
    useState(true);

  const [maxNuggets, setMaxNuggets] = useState("5");

  function getToken() {
    return (
      localStorage.getItem(
        "adminToken",
      ) ||
      sessionStorage.getItem(
        "adminToken",
      )
    );
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    const token =
      getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/admin/subscriptions`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data:
        SubscriptionResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          "Could not load subscriptions.",
        );
      }

      setSummary(data.summary || null);
      setPlans(
        data.plans || [],
      );

      setTransactions(
        data.transactions ||
          [],
      );
    } catch (
      err
    ) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingPlan(null);

    setName("");
    setError("");
    setModalError("");
    setPrice("");
    setCurrency("USD");
    setBillingCycle(
      "monthly",
    );
    setFeatures("");
    setActive(true);
    setMaxNuggets("5");

    setModalOpen(true);
  }

  function openEdit(
    plan: SubscriptionPlan,
  ) {
    setEditingPlan(
      plan,
    );

    setName(
      plan.name,
    );

    setModalError("");
    setError("");

    setPrice(
      String(
        plan.priceCents /
          100,
      ),
    );

    setCurrency(
      plan.currency,
    );

    setBillingCycle(
      plan.billingCycle,
    );

    setFeatures(
      [...plan.features].join(
        "\n",
      ),
    );

    setActive(
      plan.active,
    );
    setMaxNuggets(String(plan.maxNuggets ?? (plan.billingCycle === "free" ? 1 : 5)));

    setModalOpen(true);
  }

  async function savePlan() {
    setModalError("");
    if (!name.trim()) { setModalError("Plan name is required."); return; }
    if (!editingPlan && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setModalError("Enter a valid plan name so its URL slug can be generated.");
      return;
    }

    const parsedPrice = Number(price || 0);
    const parsedMaxNuggets = Number(maxNuggets);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0 || Math.round(parsedPrice * 100) > 1000000000) {
      setModalError("Enter a valid non-negative price."); return;
    }
    if (!maxNuggets.trim() || !Number.isInteger(parsedMaxNuggets) || parsedMaxNuggets < 1 || parsedMaxNuggets > 10000) {
      setModalError("Monthly Nuggets allowed must be a whole number between 1 and 10,000.");
      return;
    }
    const token = getToken();
    if (!token) { setModalError("Your admin session has expired. Please log in again."); return; }

    const featureList = features.split("\n").map(feature => feature.trim()).filter(Boolean);
    setSaving(true);
    setSuccess("");
    try {
      const response = await fetch(
        editingPlan
          ? API_URL + "/admin/subscriptions/plans/" + editingPlan.id
          : API_URL + "/admin/subscriptions/plans",
        {
          method: editingPlan ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({
            name: name.trim(),
            ...(!editingPlan ? { slug } : {}),
            priceCents: Math.round(parsedPrice * 100),
            currency: currency.trim().toUpperCase(),
            billingCycle,
            features: featureList,
            maxNuggets: parsedMaxNuggets,
            ...(editingPlan ? { active } : {}),
          }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = data?.message;
        setModalError(
          Array.isArray(detail) ? detail.join("; ")
          : typeof detail === "string" ? detail
          : "Could not save plan (HTTP " + response.status + ").",
        );
        return;
      }
      setModalOpen(false);
      setModalError("");
      setSuccess(editingPlan ? "Plan updated." : "Plan created.");
      await loadSubscriptions();
    } catch {
      setModalError("Could not connect to the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[32px]">
              Subscriptions
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Plans, monthly allowances, rollover Top-ups and verified payments.
            </p>
          </div>

          {section === "plans" && <button
            type="button"
            onClick={
              openCreate
            }
            className="inline-flex h-9 w-fit items-center gap-2 rounded-md bg-[#E28906] px-4 text-[9px] font-semibold text-[#080808] transition hover:bg-[#E28906]"
          >
            <Plus
              size={12}
            />

            New Plan
          </button>}
        </section>

        {error && !modalOpen && (
          <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[10px] text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3">
            <Check
              size={12}
              className="text-emerald-400"
            />

            <span className="text-[10px] text-emerald-400">
              {success}
            </span>
          </div>
        )}


        <nav aria-label="Subscription management sections" className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {([
            ["overview", "Overview"],
            ["plans", "Plans"],
            ["topups", "Top-ups"],
            ["payments", "Payments"],
          ] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setSection(key)}
              aria-current={section === key ? "page" : undefined}
              className={"min-h-10 rounded-md px-4 text-sm font-medium transition " +
                (section === key ? "bg-[#E28906] text-black" : "border border-white/10 text-white/60 hover:text-white")}>
              {label}
            </button>
          ))}
        </nav>

        {section === "overview" && (
          <section className="mt-6">
            <h2 className="font-serif text-2xl">Subscription Overview</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Active subscribers", String(summary?.activeSubscribers ?? "—")],
                ["This month's revenue", summary?.monthlyRevenueByCurrency.length
                  ? summary.monthlyRevenueByCurrency.map(row => formatMoney(row.amountCents, row.currency)).join(" · ")
                  : "—"],
                ["Top-up sales this month", String(summary?.monthlyTopUpSales ?? "—")],
                ["Expiring in 7 days", String(summary?.expiringSoon ?? "—")],
              ].map(([title, value]) => (
                <article key={title} className="rounded-xl border border-white/10 bg-[#111] p-5">
                  <p className="text-sm text-white/50">{title}</p>
                  <p className="mt-3 font-serif text-3xl text-[#E28906]">{loading ? "—" : value}</p>
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-white/45">
              {summary ? `${summary.graceMembers} paid members currently in their 3-day reading grace.` : "Loading billing summary."}
              {" "}Monthly revenue uses verified paid transactions, with currencies kept separate.
            </p>
            <p className="mt-2 text-xs leading-5 text-white/45">
              Subscription billing and monthly Nugget allowances are separate.
              Annual subscribers receive fresh monthly allowances. Top-up credits roll over until used.
              Paid readers retain previously opened Nuggets for three days after subscription expiry.
            </p>
          </section>
        )}

        {section === "topups" && <TopUpBundlesAdmin />}

        {/* PLAN CARDS */}
        {section === "plans" && (

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {loading
            ? Array.from({
                length: 3,
              }).map(
                (
                  _,
                  index,
                ) => (
                  <div
                    key={
                      index
                    }
                    className="h-[220px] animate-pulse rounded-[10px] border border-white/10 bg-[#111111]"
                  />
                ),
              )
            : plans.map(
                (plan) => (
                  <article
                    key={
                      plan.id
                    }
                    className="rounded-[10px] border border-white/10 bg-[#111111] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-serif text-[18px]">
                        {
                          plan.name
                        }
                      </h2>

                      {!plan.active && (
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[6px] text-white/30">
                          Inactive
                        </span>
                      )}
                    </div>

                    <p className="mt-5 font-serif text-[26px] text-[#E28906]">
                      {formatMoney(
                        plan.priceCents,
                        plan.currency,
                      )}
                    </p>

                    <p className="mt-2 text-sm text-white/60">
                      {plan.billingCycle === "annual" ? "Billed annually" :
                       plan.billingCycle === "monthly" ? "Billed monthly" : "Free access"}
                    </p>
                    <p className="mt-3 text-xs text-white/50">
                      {plan.subscriberCount.toLocaleString()} subscribers
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 border-y border-white/[0.06] py-3">
                      <div>
                        <p className="text-[15px] font-serif text-white/80">{plan.maxNuggets ?? "—"}</p>
                        <p className="mt-1 text-[10px] text-white/40">Nuggets per month</p>
                      </div>
                      <div>
                        <p className="text-[15px] font-serif text-white/80">Monthly</p>
                        <p className="mt-1 text-[10px] text-white/40">Allowance resets monthly</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      {plan.features.map(
                        (
                          feature,
                        ) => (
                          <p
                            key={
                              feature
                            }
                            className="text-[8px] text-white/50"
                          >
                            ✓{" "}
                            {
                              feature
                            }
                          </p>
                        ),
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openEdit(
                          plan,
                        )
                      }
                      className="mt-5 text-[8px] text-[#E28906] transition hover:text-[#E28906]"
                    >
                      Edit Plan
                    </button>
                  </article>
                ),
              )}
        </section>

        )}

        {/* TRANSACTIONS */}
        {section === "payments" && (

        <section className="mt-5 overflow-hidden rounded-[10px] border border-white/10 bg-[#111111]">
          <div className="border-b border-white/[0.07] px-5 py-4">
            <h2 className="font-serif text-[18px]">
              Recent Transactions
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[7px] uppercase tracking-[0.06em] text-white/25">
                  <th className="px-5 py-3 font-medium">
                    Member
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Plan
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Amount
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Date
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {transactions.map(
                  (
                    transaction,
                  ) => (
                    <tr
                      key={
                        transaction.id
                      }
                      className="border-b border-white/[0.05] last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="text-[9px] text-white/60">
                          {
                            transaction.member
                          }
                        </p>

                        <p className="mt-1 text-[7px] text-white/25">
                          {
                            transaction.email
                          }
                        </p>
                      </td>

                      <td className="px-4 py-4 text-[8px] text-white/40">
                        {
                          transaction.planSlug.startsWith("topup:")
                            ? "Top-up · " + transaction.planSlug.slice(6)
                            : transaction.planSlug
                        }
                      </td>

                      <td className="px-4 py-4 text-[8px] text-white/40">
                        {formatMoney(
                          transaction.amountCents,
                          transaction.currency,
                        )}
                      </td>

                      <td className="px-4 py-4 text-[8px] text-white/35">
                        {formatDate(
                          transaction.createdAt,
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <TransactionStatus
                          status={
                            transaction.status
                          }
                        />
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {!loading &&
            transactions.length ===
              0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-[10px] text-white/30">
                  No billing
                  transactions
                  have been
                  recorded yet.
                </p>

                <p className="mt-2 text-[8px] text-white/20">
                  Payments for plans and Top-up bundles appear here after checkout.
                </p>
              </div>
            )}
        </section>

        )}

        {/* COMPACT PLAN MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/80 p-3 sm:p-5">
            <div role="dialog" aria-modal="true" aria-labelledby="subscription-plan-modal-title"
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[510px] flex-col overflow-hidden rounded-xl border border-white/15 bg-[#111111] shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3.5">
                <div>
                  <h2 id="subscription-plan-modal-title" className="font-serif text-[22px]">
                    {editingPlan ? "Edit Plan" : "New Plan"}
                  </h2>
                  <p className="mt-1 text-[11px] text-white/50">Pricing and monthly Nugget allowance</p>
                </div>
                <button type="button" disabled={saving} aria-label="Close plan editor"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md p-2 text-white/50 hover:bg-white/10 hover:text-white">
                  <X size={17} />
                </button>
              </div>

              <div className="min-h-0 space-y-3 overflow-y-auto px-5 py-4">
                <Field label="Plan name" value={name} onChange={value => { setName(value); setModalError(""); }} />
                <div className="rounded-md border border-white/10 bg-[#080808] px-3 py-2">
                  <p className="text-[10px] text-white/45">Slug (generated automatically)</p>
                  <p className="mt-1 break-all font-mono text-[12px] text-[#E28906]">
                    {slug || "generated-from-plan-name"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price" type="number" value={price} onChange={setPrice} />
                  <Field label="Currency" value={currency} onChange={setCurrency} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="plan-billing-cycle" className="block text-[11px] text-white/65">Billing cycle</label>
                    <select id="plan-billing-cycle" value={billingCycle}
                      onChange={event => setBillingCycle(event.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-white/15 bg-[#080808] px-3 text-[12px] text-white outline-none focus:border-[#E28906]">
                      <option value="free">Free</option>
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                  <Field label="Nuggets per month" type="number" value={maxNuggets} onChange={setMaxNuggets} />
                </div>

                <p className="text-[11px] leading-5 text-white/50">
                  Members can read and reread their chosen Nuggets throughout their monthly allowance.
                  A new allowance starts one calendar month after their first selection.
                  Paid access still requires an active subscription.
                </p>

                <div>
                  <label htmlFor="plan-features" className="block text-[11px] text-white/65">Features (one per line)</label>
                  <textarea id="plan-features" rows={3} value={features}
                    onChange={event => setFeatures(event.target.value)}
                    placeholder={"Full archive\nWisdom studies\nOffline mobile"}
                    className="mt-1 w-full resize-y rounded-md border border-white/15 bg-[#080808] px-3 py-2 text-[12px] leading-5 text-white outline-none focus:border-[#E28906] placeholder:text-white/30" />
                </div>

                {editingPlan && (
                  <label className="flex items-center justify-between rounded-md border border-white/10 bg-[#080808] px-3 py-2">
                    <span className="text-[12px] text-white/70">Active plan</span>
                    <input type="checkbox" checked={active}
                      onChange={event => setActive(event.target.checked)}
                      className="h-4 w-4 accent-[#E28906]" />
                  </label>
                )}
              </div>

              <div className="shrink-0 border-t border-white/10 px-5 py-3">
                {modalError && (
                  <p role="alert" className="mb-3 max-h-24 overflow-y-auto rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-[12px] leading-5 text-red-300">
                    {modalError}
                  </p>
                )}
                <div className="flex justify-end gap-3">
                  <button type="button" disabled={saving} onClick={() => setModalOpen(false)}
                    className="h-9 rounded-md border border-white/15 px-4 text-[12px] text-white/65 disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="button" disabled={saving} onClick={() => void savePlan()}
                    className="h-9 rounded-md bg-[#E28906] px-5 text-[12px] font-semibold text-[#080808] disabled:opacity-50">
                    {saving ? "Saving…" : editingPlan ? "Save Changes" : "Create Plan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;

  onChange:
    (
      value: string,
    ) => void;

  type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-white/65">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        className="mt-1 h-9 w-full rounded-md border border-white/15 bg-[#080808] px-3 text-[12px] text-white outline-none focus:border-[#E28906]"
      />
    </div>
  );
}

function TransactionStatus({
  status,
}: {
  status: string;
}) {
  const paid =
    status.toLowerCase() ===
    "paid";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[7px] ${
        paid
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-red-500/20 bg-red-500/10 text-red-400"
      }`}
    >
      {status}
    </span>
  );
}

function formatMoney(
  cents: number,
  currency: string,
) {
  return new Intl.NumberFormat(
    "en",
    {
      style: "currency",
      currency:
        currency || "USD",
      minimumFractionDigits:
        0,
      maximumFractionDigits:
        2,
    },
  ).format(
    cents / 100,
  );
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "2-digit",
    },
  ).format(date);
}