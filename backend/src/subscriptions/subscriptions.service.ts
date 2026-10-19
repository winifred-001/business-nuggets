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
};

type UpdatePlanInput = {
  name?: string;
  priceCents?: number;
  currency?: string;
  billingCycle?: string;
  features?: string[];
  active?: boolean;
};

@Injectable()
export class SubscriptionsService {
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

    const plans =
      await db.orm.public.SubscriptionPlan.all();

    const users =
      await db.orm.public.User.all();

    const transactions =
      await db.orm.public.BillingTransaction.all();

    const plansWithCounts =
      plans
        .map((plan) => ({
          ...plan,

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

    return {
      plans:
        plansWithCounts,

      transactions:
        transactionRows,
    };
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

    return db.orm.public.SubscriptionPlan.create({
      slug,

      name,

      priceCents:
        input.priceCents,

      currency:
        input.currency ??
        "USD",

      billingCycle:
        input.billingCycle,

      features:
        input.features ??
        [],

      active: true,

      displayOrder:
        plans.length,
    });
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

          ...(input.currency !==
            undefined && {
            currency:
              input.currency,
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

    return updated;
  }
}