import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../prisma/db";

type CreatePlanInput = {
  name: string;
  slug: string;
  priceCents: number;
  currency?: string;
  billingCycle: string;
  features?: string[];
  maxNuggets?: number;
  accessDurationHours?: number;
  quotaWindowHours?: number;
};

type UpdatePlanInput = {
  name?: string;
  priceCents?: number;
  currency?: string;
  billingCycle?: string;
  features?: string[];
  active?: boolean;
  maxNuggets?: number;
  accessDurationHours?: number;
  quotaWindowHours?: number;
};

type SubscriptionPlanRow = Awaited<
  ReturnType<
    typeof db.orm.public.SubscriptionPlan.all
  >
>[number];

@Injectable()
export class SubscriptionsService {
  private accessPolicyTable?: Promise<void>;

  private ensureAccessPolicyTable() {
    if (!this.accessPolicyTable) {
      this.accessPolicyTable = db.runtime().execute(db.raw.sql`
        CREATE TABLE IF NOT EXISTS "SubscriptionAccessPolicy" (
          "planSlug" text PRIMARY KEY,
          "maxNuggets" integer NOT NULL DEFAULT 1 CHECK ("maxNuggets" >= 1),
          "accessDurationHours" integer NOT NULL DEFAULT 24 CHECK ("accessDurationHours" BETWEEN 1 AND 8760),
          "quotaWindowHours" integer NOT NULL DEFAULT 24 CHECK ("quotaWindowHours" BETWEEN 1 AND 8760),
          "updatedAt" timestamptz NOT NULL DEFAULT NOW()
        )
      `.affectedCount().build()).then(() => undefined).catch(error => {
        this.accessPolicyTable = undefined;
        throw error;
      });
    }
    return this.accessPolicyTable;
  }

  private async ensurePlanAccessPolicy(plan: SubscriptionPlanRow) {
    await this.ensureAccessPolicyTable();
    const defaultLimit = plan.billingCycle === "free" ? 1 : 5;
    await db.runtime().execute(db.raw.sql`
      INSERT INTO "SubscriptionAccessPolicy"
        ("planSlug", "maxNuggets", "accessDurationHours", "quotaWindowHours")
      VALUES (${plan.slug}, ${defaultLimit}, 24, 24)
      ON CONFLICT ("planSlug") DO NOTHING
    `.affectedCount().build());
  }

  private async getAccessPolicies() {
    await this.ensureAccessPolicyTable();
    const plans = await db.orm.public.SubscriptionPlan.all();
    for (const plan of plans) await this.ensurePlanAccessPolicy(plan);
    return db.runtime().query(db.raw.sql`
      SELECT "planSlug", "maxNuggets", "accessDurationHours", "quotaWindowHours"
      FROM "SubscriptionAccessPolicy"
    `.returnsRow({
      planSlug: "pg/text@1",
      maxNuggets: "pg/int4@1",
      accessDurationHours: "pg/int4@1",
      quotaWindowHours: "pg/int4@1",
    }).build());
  }

  /* =========================================
     CURRENCY NORMALIZATION
  ========================================= */

  private normalizeCurrencyCode(
    value: string | null | undefined,
    fallback = "USD",
  ) {
    const raw =
      (value ?? "")
        .trim()
        .toUpperCase();

    const aliases: Record<string, string> = {
      NAIRA: "NGN",
      NIARA: "NGN",
      "NIGERIAN NAIRA": "NGN",
      NIGERIAN_NAIRA: "NGN",
      "₦": "NGN",
      DOLLAR: "USD",
      DOLLARS: "USD",
      "US DOLLAR": "USD",
      "US DOLLARS": "USD",
    };

    const currency =
      aliases[raw] ??
      raw ??
      fallback;

    const candidate =
      currency ||
      fallback;

    try {
      new Intl.NumberFormat(
        "en-US",
        {
          style: "currency",
          currency:
            candidate,
        },
      ).format(0);

      return candidate;
    } catch {
      return fallback;
    }
  }

  private requireCurrencyCode(
    value: string | null | undefined,
  ) {
    const normalized =
      this.normalizeCurrencyCode(
        value,
        "",
      );

    if (!normalized) {
      throw new BadRequestException(
        "Use a valid currency code such as NGN or USD.",
      );
    }

    return normalized;
  }

  private async repairPlanCurrencies(
    plans: readonly SubscriptionPlanRow[],
  ) {
    return Promise.all(
      plans.map(
        async (plan) => {
          const normalizedCurrency =
            this.normalizeCurrencyCode(
              plan.currency,
              "USD",
            );

          if (
            normalizedCurrency ===
            plan.currency
          ) {
            return plan;
          }

          const updated =
            await db.orm.public.SubscriptionPlan
              .where({
                id: plan.id,
              })
              .update({
                currency:
                  normalizedCurrency,
              });

          return (
            updated ?? {
              ...plan,
              currency:
                normalizedCurrency,
            }
          );
        },
      ),
    );
  }

  /* =========================================
     DEFAULT PLANS FROM THE ADMIN DESIGN
  ========================================= */

  private async ensureDefaultPlans() {
    const plans =
      await db.orm.public.SubscriptionPlan.all();

    if (plans.length > 0) {
      return;
    }

    await db.orm.public.SubscriptionPlan.create({
      slug: "free",
      name: "Free",
      priceCents: 0,
      currency: "USD",
      billingCycle: "free",
      features: [
        "Daily nugget",
        "Basic archive",
        "Web & mobile",
      ],
      active: true,
      displayOrder: 0,
    });

    await db.orm.public.SubscriptionPlan.create({
      slug: "premium-monthly",
      name: "Premium Monthly",
      priceCents: 900,
      currency: "USD",
      billingCycle: "monthly",
      features: [
        "Full archive",
        "Wisdom studies",
        "Offline mobile",
      ],
      active: true,
      displayOrder: 1,
    });

    await db.orm.public.SubscriptionPlan.create({
      slug: "premium-annual",
      name: "Premium Annual",
      priceCents: 8900,
      currency: "USD",
      billingCycle: "annual",
      features: [
        "Everything in Monthly",
        "2 months free",
        "Priority support",
      ],
      active: true,
      displayOrder: 2,
    });
  }

  /* =========================================
     OVERVIEW
  ========================================= */

  async getOverview() {
    await this.ensureDefaultPlans();

    const rawPlans =
      await db.orm.public.SubscriptionPlan.all();

    const plans =
      await this.repairPlanCurrencies(
        rawPlans,
      );

    const users =
      await db.orm.public.User.all();

    const transactions =
      await db.orm.public.BillingTransaction.all();

    const accessPolicies = await this.getAccessPolicies();
    const policyBySlug = new Map(accessPolicies.map(policy => [policy.planSlug, policy]));

    const plansWithCounts =
      plans
        .map((plan) => ({
          ...plan,
          ...(policyBySlug.get(plan.slug) ?? {
            maxNuggets: plan.billingCycle === "free" ? 1 : 5,
            accessDurationHours: 24,
            quotaWindowHours: 24,
          }),

          subscriberCount:
            users.filter(
              (user) =>
                user.subscriptionPlan ===
                plan.slug,
            ).length,
        }))
        .sort(
          (a, b) =>
            a.displayOrder -
            b.displayOrder,
        );

    const transactionRows =
      transactions
        .map((transaction) => {
          const user =
            users.find(
              (item) =>
                item.id ===
                transaction.userId,
            );

          return {
            ...transaction,

            currency:
              this.normalizeCurrencyCode(
                transaction.currency,
                "USD",
              ),

            member:
              user?.name ||
              "Unknown Member",

            email:
              user?.email ||
              "",
          };
        })
        .sort(
          (a, b) =>
            new Date(
              b.createdAt,
            ).getTime() -
            new Date(
              a.createdAt,
            ).getTime(),
        )
        .slice(0, 20);

    const now = Date.now();
    const monthStart = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1);
    const revenueByCurrency = new Map<string, number>();
    let monthlyTopUpSales = 0;
    let verifiedPayments = 0;
    for (const transaction of transactions) {
      if (transaction.status !== "paid") continue;
      verifiedPayments++;
      const time = Date.parse(transaction.paidAt || transaction.createdAt);
      if (!Number.isFinite(time) || time < monthStart) continue;
      const currency = this.normalizeCurrencyCode(transaction.currency, "USD");
      revenueByCurrency.set(currency, (revenueByCurrency.get(currency) || 0) + transaction.amountCents);
      if (transaction.planSlug.startsWith("topup:")) monthlyTopUpSales++;
    }
    const activeSubscribers = users.filter(user =>
      user.membershipTier === "premium" &&
      user.subscriptionPlan !== "free" &&
      user.subscriptionStatus === "active" &&
      Date.parse(user.subscriptionExpiresAt || "") > now
    ).length;
    const expiringSoon = users.filter(user => {
      const expires = Date.parse(user.subscriptionExpiresAt || "");
      return user.subscriptionPlan !== "free" && user.subscriptionStatus === "active" &&
        Number.isFinite(expires) && expires > now && expires <= now + 7 * 24 * 3600_000;
    }).length;
    const graceMembers = users.filter(user => {
      const expires = Date.parse(user.subscriptionExpiresAt || "");
      return user.membershipTier === "premium" && user.subscriptionPlan !== "free" &&
        (user.subscriptionStatus === "active" || user.subscriptionStatus === "grace") &&
        Number.isFinite(expires) && expires <= now && now < expires + 72 * 3600_000;
    }).length;

    return {
      plans: plansWithCounts,
      transactions: transactionRows,
      summary: {
        activeSubscribers, expiringSoon, graceMembers,
        monthlyTopUpSales, verifiedPayments,
        monthlyRevenueByCurrency: [...revenueByCurrency].map(([currency, amountCents]) => ({ currency, amountCents })),
      },
    };
  }

  /* =========================================
     PUBLIC ACTIVE PLANS
  ========================================= */

  async getPublicPlans() {
    await this.ensureDefaultPlans();

    const rawPlans =
      await db.orm.public.SubscriptionPlan.all();

    const plans =
      await this.repairPlanCurrencies(
        rawPlans,
      );

    const accessPolicies = await this.getAccessPolicies();
    const policyBySlug = new Map(accessPolicies.map(policy => [policy.planSlug, policy]));

    return plans
      .filter(
        (plan) =>
          plan.active,
      )
      .map(plan => ({
        ...plan,
        ...(policyBySlug.get(plan.slug) ?? {
          maxNuggets: plan.billingCycle === "free" ? 1 : 5,
          accessDurationHours: 24,
          quotaWindowHours: 24,
        }),
      }))
      .sort(
        (a, b) =>
          a.displayOrder -
          b.displayOrder,
      );
  }

  /* =========================================
     CREATE PLAN
  ========================================= */

  async createPlan(
    input: CreatePlanInput,
  ) {
    const slug =
      input.slug
        .trim()
        .toLowerCase();

    const name =
      input.name.trim();

    const currency =
      this.requireCurrencyCode(
        input.currency ??
          "USD",
      );

    if (!slug || !name) {
      throw new BadRequestException(
        "Plan name and slug are required",
      );
    }

    if (
      input.priceCents < 0
    ) {
      throw new BadRequestException(
        "Price cannot be negative",
      );
    }

    if (input.maxNuggets !== undefined && (!Number.isInteger(input.maxNuggets) || input.maxNuggets < 1 || input.maxNuggets > 10000)) {
      throw new BadRequestException("Maximum nuggets must be between 1 and 10,000.");
    }
    if (input.accessDurationHours !== undefined && (!Number.isInteger(input.accessDurationHours) || input.accessDurationHours < 1 || input.accessDurationHours > 8760)) {
      throw new BadRequestException("Nugget access duration must be between 1 and 8,760 hours.");
    }
    if (input.quotaWindowHours !== undefined && (!Number.isInteger(input.quotaWindowHours) || input.quotaWindowHours < 1 || input.quotaWindowHours > 8760)) {
      throw new BadRequestException("Quota reset period must be between 1 and 8,760 hours.");
    }

    const existing =
      await db.orm.public.SubscriptionPlan
        .where({
          slug,
        })
        .first();

    if (existing) {
      throw new ConflictException(
        "A plan with this slug already exists",
      );
    }

    const plans =
      await db.orm.public.SubscriptionPlan.all();

    const created = await db.orm.public.SubscriptionPlan.create({
      slug,

      name,

      priceCents:
        input.priceCents,

      currency,

      billingCycle:
        input.billingCycle,

      features:
        input.features ??
        [],

      active: true,

      displayOrder:
        plans.length,
    });

    await this.ensureAccessPolicyTable();
    await db.runtime().execute(db.raw.sql`
      INSERT INTO "SubscriptionAccessPolicy"
        ("planSlug", "maxNuggets", "accessDurationHours", "quotaWindowHours")
      VALUES (
        ${slug},
        ${input.maxNuggets ?? (input.billingCycle === "free" ? 1 : 5)},
        ${input.accessDurationHours ?? 24},
        ${input.quotaWindowHours ?? 24}
      )
      ON CONFLICT ("planSlug") DO UPDATE SET
        "maxNuggets" = EXCLUDED."maxNuggets",
        "accessDurationHours" = EXCLUDED."accessDurationHours",
        "quotaWindowHours" = EXCLUDED."quotaWindowHours",
        "updatedAt" = NOW()
    `.affectedCount().build());

    return {
      ...created,
      maxNuggets: input.maxNuggets ?? (input.billingCycle === "free" ? 1 : 5),
      accessDurationHours: input.accessDurationHours ?? 24,
      quotaWindowHours: input.quotaWindowHours ?? 24,
    };
  }

  /* =========================================
     UPDATE PLAN
  ========================================= */

  async updatePlan(
    id: number,
    input: UpdatePlanInput,
  ) {
    const plan =
      await db.orm.public.SubscriptionPlan
        .where({
          id,
        })
        .first();

    if (!plan) {
      throw new NotFoundException(
        "Subscription plan not found",
      );
    }

    if (
      input.priceCents !==
        undefined &&
      input.priceCents < 0
    ) {
      throw new BadRequestException(
        "Price cannot be negative",
      );
    }

    if (input.maxNuggets !== undefined && (!Number.isInteger(input.maxNuggets) || input.maxNuggets < 1 || input.maxNuggets > 10000)) {
      throw new BadRequestException("Maximum nuggets must be between 1 and 10,000.");
    }
    if (input.accessDurationHours !== undefined && (!Number.isInteger(input.accessDurationHours) || input.accessDurationHours < 1 || input.accessDurationHours > 8760)) {
      throw new BadRequestException("Nugget access duration must be between 1 and 8,760 hours.");
    }
    if (input.quotaWindowHours !== undefined && (!Number.isInteger(input.quotaWindowHours) || input.quotaWindowHours < 1 || input.quotaWindowHours > 8760)) {
      throw new BadRequestException("Quota reset period must be between 1 and 8,760 hours.");
    }

    const currency =
      input.currency !==
      undefined
        ? this.requireCurrencyCode(
            input.currency,
          )
        : undefined;

    const updated =
      await db.orm.public.SubscriptionPlan
        .where({
          id,
        })
        .update({
          ...(input.name !==
            undefined && {
            name:
              input.name.trim(),
          }),

          ...(input.priceCents !==
            undefined && {
            priceCents:
              input.priceCents,
          }),

          ...(currency !==
            undefined && {
            currency,
          }),

          ...(input.billingCycle !==
            undefined && {
            billingCycle:
              input.billingCycle,
          }),

          ...(input.features !==
            undefined && {
            features:
              input.features,
          }),

          ...(input.active !==
            undefined && {
            active:
              input.active,
          }),
        });

    if (!updated) {
      throw new NotFoundException(
        "Subscription plan not found",
      );
    }

    
    await this.ensurePlanAccessPolicy(plan);

    if (input.maxNuggets !== undefined) {
      await db.runtime().execute(db.raw.sql`
        UPDATE "SubscriptionAccessPolicy"
        SET
          "maxNuggets" = ${input.maxNuggets},
          "updatedAt" = NOW()
        WHERE "planSlug" = ${plan.slug}
      `.affectedCount().build());
    }

    if (input.accessDurationHours !== undefined) {
      await db.runtime().execute(db.raw.sql`
        UPDATE "SubscriptionAccessPolicy"
        SET
          "accessDurationHours" = ${input.accessDurationHours},
          "updatedAt" = NOW()
        WHERE "planSlug" = ${plan.slug}
      `.affectedCount().build());
    }

    if (input.quotaWindowHours !== undefined) {
      await db.runtime().execute(db.raw.sql`
        UPDATE "SubscriptionAccessPolicy"
        SET
          "quotaWindowHours" = ${input.quotaWindowHours},
          "updatedAt" = NOW()
        WHERE "planSlug" = ${plan.slug}
      `.affectedCount().build());
    }


    const policies = await this.getAccessPolicies();
    const policy = policies.find(item => item.planSlug === plan.slug);
    return {
      ...updated,
      maxNuggets: policy?.maxNuggets ?? 1,
      accessDurationHours: policy?.accessDurationHours ?? 24,
      quotaWindowHours: policy?.quotaWindowHours ?? 24,
    };
  }
}
