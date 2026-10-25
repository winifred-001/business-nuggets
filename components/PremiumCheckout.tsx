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
  const [
    plans,
    setPlans,
  ] =
    useState<
      SubscriptionPlan[]
    >([]);

  const [loading, setLoading] =
    useState(!isPremium);

  const [
    payingSlug,
    setPayingSlug,
  ] = useState<string | null>(
    null,
  );

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (isPremium) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadPlans() {
      try {
        const response =
          await fetch(
            `${API_URL}/payments/plans`,
          );

        const data =
          await response
            .json()
            .catch(() => []);

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not load plans.",
          );
        }

        if (!mounted) {
          return;
        }

        setPlans(
          Array.isArray(data)
            ? data.filter(
                (plan) =>
                  plan.priceCents >
                    0 &&
                  plan.billingCycle !==
                    "free",
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
            : "Could not load plans.",
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
      localStorage.getItem(
        "token",
      );

    if (!token) {
      window.location.href =
        "/login";
      return;
    }

    setPayingSlug(planSlug);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/payments/initialize`,
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body:
              JSON.stringify({
                planSlug,
              }),
          },
        );

      const data =
        await response
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
    <section className="mt-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C8A35A]/25 bg-[#C8A35A]/10 text-[#C8A35A]">
          <Crown size={16} />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
            Upgrade
          </p>

          <h2 className="font-serif text-[28px] leading-tight">
            Unlock Business Nuggets Premium
          </h2>
        </div>
      </div>

      <p className="mt-3 max-w-[760px] text-[12px] leading-6 text-white/40">
        Choose a plan and complete payment securely with Paystack. Premium access is activated only after the backend verifies the payment.
      </p>

      {error && (
        <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[10px] text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[1, 2].map(
            (item) => (
              <div
                key={item}
                className="h-[190px] animate-pulse rounded-[10px] border border-white/10 bg-[#111111]"
              />
            ),
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {plans.map(
            (plan) => (
              <article
                key={plan.id}
                className="rounded-[10px] border border-[#C8A35A]/30 bg-[#111111] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-[20px]">
                      {plan.name}
                    </h3>

                    <p className="mt-2 text-[9px] uppercase tracking-[0.08em] text-white/30">
                      {plan.billingCycle}
                    </p>
                  </div>

                  <p className="font-serif text-[24px] text-[#C8A35A]">
                    {formatMoney(
                      plan.priceCents,
                      plan.currency,
                    )}
                  </p>
                </div>

                <div className="mt-5 space-y-2">
                  {plan.features.map(
                    (feature) => (
                      <p
                        key={feature}
                        className="flex items-start gap-2 text-[10px] leading-5 text-white/45"
                      >
                        <Check
                          size={12}
                          className="mt-1 shrink-0 text-[#C8A35A]"
                        />

                        {feature}
                      </p>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  disabled={
                    payingSlug !==
                    null
                  }
                  onClick={() =>
                    startCheckout(
                      plan.slug,
                    )
                  }
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#C8A35A] px-4 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {payingSlug ===
                  plan.slug
                    ? "Opening Paystack..."
                    : `Choose ${plan.name}`}
                </button>
              </article>
            ),
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
        style:
          "currency",
        currency:
          currency ||
          "USD",
        minimumFractionDigits:
          0,
        maximumFractionDigits:
          2,
      },
    ).format(
      cents / 100,
    );
  } catch {
    return `${currency} ${(
      cents / 100
    ).toFixed(2)}`;
  }
}
