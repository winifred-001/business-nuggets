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

import AdminShell from "@/components/AdminShell";
import { API_URL } from "@/lib/api";

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

type SubscriptionResponse = {
  plans:
    SubscriptionPlan[];

  transactions:
    BillingTransaction[];
};

export default function AdminSubscriptionsPage() {
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

  const [slug, setSlug] =
    useState("");

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
    setSlug("");
    setPrice("");
    setCurrency("USD");
    setBillingCycle(
      "monthly",
    );
    setFeatures("");
    setActive(true);

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

    setSlug(
      plan.slug,
    );

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

    setModalOpen(true);
  }

  async function savePlan() {
    if (!name.trim()) {
      setError(
        "Plan name is required.",
      );

      return;
    }

    if (
      !editingPlan &&
      !slug.trim()
    ) {
      setError(
        "Plan slug is required.",
      );

      return;
    }

    const token =
      getToken();

    if (!token) return;

    const parsedPrice =
      Number(price || 0);

    if (
      Number.isNaN(
        parsedPrice,
      ) ||
      parsedPrice < 0
    ) {
      setError(
        "Enter a valid price.",
      );

      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const featureList =
      features
        .split("\n")
        .map(
          (feature) =>
            feature.trim(),
        )
        .filter(Boolean);

    try {
      const response =
        await fetch(
          editingPlan
            ? `${API_URL}/admin/subscriptions/plans/${editingPlan.id}`
            : `${API_URL}/admin/subscriptions/plans`,
          {
            method:
              editingPlan
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                editingPlan
                  ? {
                      name:
                        name.trim(),

                      priceCents:
                        Math.round(
                          parsedPrice *
                            100,
                        ),

                      currency,

                      billingCycle,

                      features:
                        featureList,

                      active,
                    }
                  : {
                      name:
                        name.trim(),

                      slug:
                        slug
                          .trim()
                          .toLowerCase(),

                      priceCents:
                        Math.round(
                          parsedPrice *
                            100,
                        ),

                      currency,

                      billingCycle,

                      features:
                        featureList,
                    },
              ),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ||
            "Could not save plan.",
        );

        return;
      }

      setModalOpen(false);

      setSuccess(
        editingPlan
          ? "Plan updated."
          : "Plan created.",
      );

      await loadSubscriptions();
    } catch {
      setError(
        "Could not connect to the server.",
      );
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
              Plans, pricing and
              billing for premium
              members.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreate
            }
            className="inline-flex h-9 w-fit items-center gap-2 rounded-md bg-[#C8A35A] px-4 text-[9px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
          >
            <Plus
              size={12}
            />

            New Plan
          </button>
        </section>

        {error && (
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

        {/* PLAN CARDS */}

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

                    <p className="mt-5 font-serif text-[26px] text-[#C8A35A]">
                      {formatMoney(
                        plan.priceCents,
                        plan.currency,
                      )}
                    </p>

                    <p className="mt-3 text-[8px] text-white/30">
                      {plan.subscriberCount.toLocaleString()}{" "}
                      subscribers
                    </p>

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
                      className="mt-5 text-[8px] text-[#C8A35A] transition hover:text-[#E0C48A]"
                    >
                      Edit Plan
                    </button>
                  </article>
                ),
              )}
        </section>

        {/* TRANSACTIONS */}

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
                          transaction.planSlug
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
                  Transactions will
                  appear here once a
                  payment provider
                  is connected.
                </p>
              </div>
            )}
        </section>

        {/* PLAN MODAL */}

        {modalOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[470px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-serif text-[24px]">
                    {editingPlan
                      ? "Edit Plan"
                      : "New Plan"}
                  </h2>

                  <p className="mt-2 text-[8px] text-white/25">
                    Configure
                    subscription
                    access and
                    pricing.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(
                      false,
                    )
                  }
                  className="text-white/30 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <Field
                  label="Plan Name"
                  value={
                    name
                  }
                  onChange={
                    setName
                  }
                />

                {!editingPlan && (
                  <Field
                    label="Slug"
                    value={
                      slug
                    }
                    onChange={
                      setSlug
                    }
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Price"
                    type="number"
                    value={
                      price
                    }
                    onChange={
                      setPrice
                    }
                  />

                  <Field
                    label="Currency"
                    value={
                      currency
                    }
                    onChange={
                      setCurrency
                    }
                  />
                </div>

                <div>
                  <label className="block text-[8px] text-white/35">
                    Billing Cycle
                  </label>

                  <select
                    value={
                      billingCycle
                    }
                    onChange={(
                      event,
                    ) =>
                      setBillingCycle(
                        event
                          .target
                          .value,
                      )
                    }
                    className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[9px] text-white/65 outline-none"
                  >
                    <option value="free">
                      Free
                    </option>

                    <option value="monthly">
                      Monthly
                    </option>

                    <option value="annual">
                      Annual
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] text-white/35">
                    Features
                  </label>

                  <textarea
                    rows={5}
                    value={
                      features
                    }
                    onChange={(
                      event,
                    ) =>
                      setFeatures(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder={
                      "Full archive\nWisdom studies\nOffline mobile"
                    }
                    className="mt-2 w-full resize-none rounded-md border border-white/10 bg-[#080808] px-3 py-3 text-[9px] leading-5 text-white outline-none placeholder:text-white/20"
                  />

                  <p className="mt-1 text-[7px] text-white/20">
                    One feature per
                    line.
                  </p>
                </div>

                {editingPlan && (
                  <label className="flex items-center justify-between rounded-md border border-white/[0.07] bg-[#080808] px-4 py-3">
                    <span className="text-[9px] text-white/50">
                      Active Plan
                    </span>

                    <input
                      type="checkbox"
                      checked={
                        active
                      }
                      onChange={(
                        event,
                      ) =>
                        setActive(
                          event
                            .target
                            .checked,
                        )
                      }
                      className="h-4 w-4 accent-[#C8A35A]"
                    />
                  </label>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(
                      false,
                    )
                  }
                  className="h-9 rounded-md border border-white/10 px-4 text-[9px] text-white/40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    savePlan
                  }
                  className="h-9 rounded-md bg-[#C8A35A] px-5 text-[9px] font-semibold text-[#080808] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingPlan
                      ? "Save Changes"
                      : "Create Plan"}
                </button>
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
      <label className="block text-[8px] text-white/35">
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
        className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[9px] text-white outline-none focus:border-[#C8A35A]/35"
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