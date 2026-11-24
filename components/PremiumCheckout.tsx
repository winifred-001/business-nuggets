"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  Crown,
} from "lucide-react";

import { loginFor } from "@/lib/auth-return";
import { API_URL } from "@/lib/api";

type SubscriptionPlan = {
  id: number;
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  billingCycle: string;
  features: readonly string[];
  active: boolean;
  displayOrder: number;
  maxNuggets?: number;
};

export default function PremiumCheckout({
  isPremium,
  currentPlan,
}: {
  isPremium: boolean;
  currentPlan?: string | null;
}) {
  const [retryCount, setRetryCount] = useState(0);
  const [billingView, setBillingView] = useState<"monthly" | "annual">("monthly");
  const [plans, setPlans] =
    useState<SubscriptionPlan[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [payingSlug, setPayingSlug] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPlans() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/payments/plans`,
          {
            cache: "no-store",
          },
        );

        const data = await response
          .json()
          .catch(() => []);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Could not load payment plans.",
          );
        }

        if (!mounted) {
          return;
        }

        if (Array.isArray(data) && !data.some((plan) => plan?.active && plan?.billingCycle === "monthly") && data.some((plan) => plan?.active && plan?.billingCycle === "annual")) setBillingView("annual");
        setPlans(
          Array.isArray(data)
            ? data.filter(
                (plan) =>
                  plan?.active !== false &&
                  Number(plan?.priceCents) > 0 &&
                  plan?.billingCycle !== "free",
              )
            : [],
        );
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Could not load payment plans.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadPlans();

    return () => {
      mounted = false;
    };
  }, [retryCount]);

  async function startCheckout(
    planSlug: string,
  ) {
    const token =
      localStorage.getItem("token");

    if (!token) {
      window.location.assign(loginFor(`/membership?plan=${encodeURIComponent(planSlug)}#plans`));
      return;
    }

    setPayingSlug(planSlug);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/payments/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            planSlug,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (response.status === 401) {
        window.location.assign(loginFor(`/membership?plan=${encodeURIComponent(planSlug)}#plans`));
        return;
      }
      if (
        !response.ok ||
        !data.authorizationUrl
      ) {
        throw new Error(
          data.message ||
            "Could not start payment.",
        );
      }

      window.location.assign(
        data.authorizationUrl,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start payment.",
      );
      setPayingSlug(null);
    }
  }

  return (
    <section id="plans" className="mt-10 rounded-[14px] border border-[#E28906]/35 bg-[#111111] p-5 sm:p-7 lg:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#E28906]/25 bg-[#E28906]/10 text-[#E28906]">
          <Crown size={20} />
        </div>

        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#E28906]">
            {isPremium
              ? "Manage Premium Plan"
              : "Upgrade to Premium"}
          </p>

          <h2 className="mt-1 font-serif text-[34px] leading-tight sm:text-[38px]">
            {isPremium
              ? "Choose how you want to continue your Premium access"
              : "Unlock the complete Business Nuggets library"}
          </h2>
        </div>
      </div>

      <p className="mt-4 max-w-[820px] text-[16px] leading-7 text-white/55">
        {isPremium
          ? "Your current plan stays active. You can view the available paid plans below and upgrade to Annual whenever you want."
          : "Choose a plan below and pay securely with Paystack. Your Premium access is activated only after the backend verifies the successful payment."}
      </p>

      {error && (
        <div role="alert" className="mt-6 rounded-md border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-[15px] leading-6 text-red-300">
          {error}
        </div>
      )}

      {!loading && (error || plans.length === 0) && <button type="button" onClick={() => setRetryCount(value => value + 1)} className="mt-4 rounded border border-[#E28906]/40 px-4 py-3 text-[#E28906]">Retry Loading Plans</button>}

      {loading ? (
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-[250px] animate-pulse rounded-[12px] border border-white/10 bg-[#080808]"
            />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="mt-7 rounded-[12px] border border-white/10 bg-[#080808] p-6">
          <h3 className="font-serif text-[24px]">
            No paid plan is available yet
          </h3>
          <p className="mt-2 text-[16px] leading-7 text-white/50">
            Membership plans are temporarily unavailable. Please try again shortly.
          </p>
        </div>
      ) : (
        <div className="mt-7">
          <div className="mb-5 flex w-fit rounded-md border border-white/15 bg-[#080808] p-1" role="group" aria-label="Choose a billing period">
            {(["monthly", "annual"] as const).map(cycle => (
              <button type="button" key={cycle} onClick={() => setBillingView(cycle)} aria-pressed={billingView === cycle}
                className={"min-h-10 rounded px-5 text-sm font-semibold " + (billingView === cycle ? "bg-[#E28906] text-black" : "text-white/55 hover:text-white")}>
                {cycle === "monthly" ? "Monthly" : "Annual"}
              </button>
            ))}
          </div>
          <div className="grid gap-5 md:grid-cols-2">
          {plans.filter(plan => plan.billingCycle === billingView).map((plan) => {
            const isCurrentPlan =
              isPremium &&
              currentPlan === plan.slug;

            return (
              <article
                key={plan.id}
                className={`rounded-[12px] border bg-[#080808] p-5 sm:p-6 ${
                  isCurrentPlan
                    ? "border-[#E28906]/65"
                    : "border-[#E28906]/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-[26px] leading-tight">
                        {plan.name}
                      </h3>

                      {isCurrentPlan && (
                        <span className="rounded-full bg-[#E28906]/15 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#E28906]">
                          Current Plan
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[14px] font-medium uppercase tracking-[0.08em] text-white/40">
                      {plan.billingCycle === "annual" ? "12-month billing · Monthly Nugget allowance" : "Monthly billing · Monthly Nugget allowance"}
                    </p>
                  </div>

                  <p className="font-serif text-[30px] leading-none text-[#E28906]">
                    {formatMoney(
                      plan.priceCents,
                      plan.currency,
                    )}
                  </p>
                </div>

                <p className="mt-5 text-sm text-[#E28906]">{typeof plan.maxNuggets === "number" ? plan.maxNuggets + " Nuggets per month" : "Monthly allowance"}</p>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <p
                      key={feature}
                      className="flex items-start gap-3 text-[15px] leading-6 text-white/60"
                    >
                      <Check
                        size={16}
                        className="mt-1 shrink-0 text-[#E28906]"
                      />
                      {feature}
                    </p>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={
                    payingSlug !== null
                  }
                  onClick={() =>
                    startCheckout(plan.slug)
                  }
                  className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#E28906] px-5 text-[15px] font-semibold text-[#080808] transition hover:bg-[#E28906] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {payingSlug === plan.slug
                    ? "Opening Paystack..."
                    : isCurrentPlan ? "Renew " + plan.name
                    : isPremium && plan.billingCycle === "annual"
                      ? `Upgrade to ${plan.name}`
                      : `Pay for ${plan.name}`}
                </button>
              </article>
            );
          })}
          </div>
          {!plans.some(plan => plan.billingCycle === billingView) && (
            <p className="rounded-md border border-white/10 p-5 text-sm text-white/50">No {billingView} plans are currently available.</p>
          )}
        </div>
      )}
    </section>
  );
}

function formatMoney(
  cents: number,
  currency: string,
) {
  try {
    return new Intl.NumberFormat(
      "en",
      {
        style: "currency",
        currency: currency || "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    ).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}
