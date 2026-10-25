"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  Crown,
} from "lucide-react";

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
};

export default function PremiumCheckout({
  isPremium,
}: {
  isPremium: boolean;
}) {
  const [plans, setPlans] =
    useState<SubscriptionPlan[]>([]);

  const [loading, setLoading] =
    useState(!isPremium);

  const [payingSlug, setPayingSlug] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (isPremium) {
      setLoading(false);
      return;
    }

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
  }, [isPremium]);

  async function startCheckout(
    planSlug: string,
  ) {
    const token =
      localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
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

  if (isPremium) {
    return null;
  }

  return (
    <section className="mt-10 rounded-[14px] border border-[#C8A35A]/35 bg-[#111111] p-5 sm:p-7 lg:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#C8A35A]/25 bg-[#C8A35A]/10 text-[#C8A35A]">
          <Crown size={20} />
        </div>

        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
            Upgrade to Premium
          </p>

          <h2 className="mt-1 font-serif text-[34px] leading-tight sm:text-[38px]">
            Unlock the complete Business Nuggets library
          </h2>
        </div>
      </div>

      <p className="mt-4 max-w-[820px] text-[16px] leading-7 text-white/55">
        Choose a plan below and pay securely with Paystack. Your Premium access is activated only after the backend verifies the successful payment.
      </p>

      {error && (
        <div className="mt-6 rounded-md border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-[15px] leading-6 text-red-300">
          {error}
        </div>
      )}

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
            The payment area is working, but there is currently no active paid subscription plan returned by the backend. Check Admin → Subscriptions and make sure at least one Premium plan is active with a price above zero.
          </p>
        </div>
      ) : (
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-[12px] border border-[#C8A35A]/30 bg-[#080808] p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-[26px] leading-tight">
                    {plan.name}
                  </h3>

                  <p className="mt-2 text-[14px] font-medium uppercase tracking-[0.08em] text-white/40">
                    {plan.billingCycle}
                  </p>
                </div>

                <p className="font-serif text-[30px] leading-none text-[#C8A35A]">
                  {formatMoney(
                    plan.priceCents,
                    plan.currency,
                  )}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <p
                    key={feature}
                    className="flex items-start gap-3 text-[15px] leading-6 text-white/60"
                  >
                    <Check
                      size={16}
                      className="mt-1 shrink-0 text-[#C8A35A]"
                    />
                    {feature}
                  </p>
                ))}
              </div>

              <button
                type="button"
                disabled={payingSlug !== null}
                onClick={() =>
                  startCheckout(plan.slug)
                }
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#C8A35A] px-5 text-[15px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {payingSlug === plan.slug
                  ? "Opening Paystack..."
                  : `Pay for ${plan.name}`}
              </button>
            </article>
          ))}
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
