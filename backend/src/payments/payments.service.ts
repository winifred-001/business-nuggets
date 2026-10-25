import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { db } from "../prisma/db";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";

type PaystackInitializeResponse = {
  status: boolean;
  message?: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message?: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at?: string | null;
  };
};

type PaystackWebhookEvent = {
  event?: string;
  data?: {
    reference?: string;
  };
};

@Injectable()
export class PaymentsService {
  private readonly paystackBaseUrl =
    "https://api.paystack.co";

  constructor(
    private readonly subscriptionsService:
      SubscriptionsService,
  ) {}

  async getPlans() {
    return this.subscriptionsService.getPublicPlans();
  }

  async initializePayment(
    userId: number,
    planSlug: string,
  ) {
    const normalizedPlanSlug =
      planSlug
        ?.trim()
        .toLowerCase();

    if (!normalizedPlanSlug) {
      throw new BadRequestException(
        "A subscription plan is required.",
      );
    }

    await this.subscriptionsService.getPublicPlans();

    const [user, plan] =
      await Promise.all([
        db.orm.public.User
          .where({
            id: userId,
          })
          .first(),

        db.orm.public.SubscriptionPlan
          .where({
            slug:
              normalizedPlanSlug,
          })
          .first(),
      ]);

    if (!user) {
      throw new NotFoundException(
        "User not found.",
      );
    }

    if (
      !plan ||
      !plan.active
    ) {
      throw new NotFoundException(
        "Subscription plan not found.",
      );
    }

    if (
      plan.priceCents <= 0 ||
      plan.billingCycle ===
        "free"
    ) {
      throw new BadRequestException(
        "The free plan does not require payment.",
      );
    }

    const reference =
      `bnb-${userId}-${Date.now()}-${randomBytes(
        5,
      ).toString("hex")}`;

    await db.orm.public.BillingTransaction.create({
      userId,
      planSlug:
        plan.slug,
      amountCents:
        plan.priceCents,
      currency:
        plan.currency.toUpperCase(),
      status:
        "pending",
      provider:
        "paystack",
      providerReference:
        reference,
      paidAt:
        null,
    });

    const callbackUrl =
      process.env
        .PAYSTACK_CALLBACK_URL ||
      `${
        process.env.FRONTEND_URL ||
        "https://business-nuggets-theta.vercel.app"
      }/payment/callback`;

    try {
      const payload =
        await this.initializeWithPaystack({
          email:
            user.email,
          amount:
            plan.priceCents,
          currency:
            plan.currency.toUpperCase(),
          reference,
          callbackUrl,
          metadata: {
            userId,
            planSlug:
              plan.slug,
          },
        });

      return {
        provider:
          "paystack",
        authorizationUrl:
          payload.authorization_url,
        accessCode:
          payload.access_code,
        reference:
          payload.reference,
      };
    } catch (error) {
      await db.orm.public.BillingTransaction
        .where({
          providerReference:
            reference,
        })
        .update({
          status:
            "failed",
        });

      throw error;
    }
  }

  async verifyPaymentForUser(
    userId: number,
    reference: string,
  ) {
    return this.verifyAndFulfill(
      reference,
      userId,
    );
  }

  async handleWebhook(
    rawBody: Buffer,
    signature: string | undefined,
    event: PaystackWebhookEvent,
  ) {
    this.assertValidWebhookSignature(
      rawBody,
      signature,
    );

    if (
      event.event !==
      "charge.success"
    ) {
      return {
        received: true,
      };
    }

    const reference =
      event.data?.reference;

    if (!reference) {
      return {
        received: true,
      };
    }

    const transaction =
      await db.orm.public.BillingTransaction
        .where({
          providerReference:
            reference,
        })
        .first();

    if (!transaction) {
      return {
        received: true,
      };
    }

    await this.verifyAndFulfill(
      reference,
    );

    return {
      received: true,
    };
  }

  private async verifyAndFulfill(
    reference: string,
    expectedUserId?: number,
  ) {
    const normalizedReference =
      reference?.trim();

    if (!normalizedReference) {
      throw new BadRequestException(
        "Payment reference is required.",
      );
    }

    const transaction =
      await db.orm.public.BillingTransaction
        .where({
          providerReference:
            normalizedReference,
        })
        .first();

    if (!transaction) {
      throw new NotFoundException(
        "Payment transaction not found.",
      );
    }

    if (
      expectedUserId !==
        undefined &&
      transaction.userId !==
        expectedUserId
    ) {
      throw new UnauthorizedException(
        "This payment does not belong to your account.",
      );
    }

    const verified =
      await this.verifyWithPaystack(
        normalizedReference,
      );

    if (
      verified.status !==
      "success"
    ) {
      await db.orm.public.BillingTransaction
        .where({
          id:
            transaction.id,
        })
        .update({
          status:
            verified.status ||
            "failed",
        });

      throw new BadRequestException(
        "Payment has not been completed successfully.",
      );
    }

    const expectedCurrency =
      transaction.currency.toUpperCase();

    if (
      verified.reference !==
        normalizedReference ||
      verified.amount !==
        transaction.amountCents ||
      verified.currency.toUpperCase() !==
        expectedCurrency
    ) {
      await db.orm.public.BillingTransaction
        .where({
          id:
            transaction.id,
        })
        .update({
          status:
            "mismatch",
        });

      throw new BadRequestException(
        "Payment verification did not match the expected transaction.",
      );
    }

    const paidAt =
      verified.paid_at &&
      !Number.isNaN(
        new Date(
          verified.paid_at,
        ).getTime(),
      )
        ? new Date(
            verified.paid_at,
          ).toISOString()
        : new Date()
            .toISOString();

    await db.orm.public.BillingTransaction
      .where({
        id:
          transaction.id,
      })
      .update({
        status:
          "paid",
        paidAt,
      });

    const membership =
      await this.rebuildMembershipFromPaidTransactions(
        transaction.userId,
      );

    return {
      success: true,
      reference:
        normalizedReference,
      transactionStatus:
        "paid",
      membership,
    };
  }

  private async rebuildMembershipFromPaidTransactions(
    userId: number,
  ) {
    const [user, transactions, plans] =
      await Promise.all([
        db.orm.public.User
          .where({
            id: userId,
          })
          .first(),

        db.orm.public.BillingTransaction
          .where({
            userId,
            status:
              "paid",
          })
          .all(),

        db.orm.public.SubscriptionPlan.all(),
      ]);

    if (!user) {
      throw new NotFoundException(
        "User not found.",
      );
    }

    const planMap =
      new Map(
        plans.map(
          (plan) => [
            plan.slug,
            plan,
          ],
        ),
      );

    const eligibleTransactions =
      [...transactions]
        .filter((transaction) => {
          const plan =
            planMap.get(
              transaction.planSlug,
            );

          return Boolean(
            plan &&
              plan.priceCents > 0 &&
              plan.billingCycle !==
                "free",
          );
        })
        .sort(
          (a, b) =>
            this.getTransactionTime(
              a,
            ) -
            this.getTransactionTime(
              b,
            ),
        );

    if (
      eligibleTransactions.length ===
      0
    ) {
      return {
        membershipTier:
          user.membershipTier,
        subscriptionPlan:
          user.subscriptionPlan,
        subscriptionStatus:
          user.subscriptionStatus,
        subscriptionExpiresAt:
          user.subscriptionExpiresAt,
      };
    }

    let expiresAt:
      Date | null = null;

    let latestPlanSlug =
      user.subscriptionPlan;

    for (
      const transaction of
      eligibleTransactions
    ) {
      const plan =
        planMap.get(
          transaction.planSlug,
        );

      if (!plan) {
        continue;
      }

      const paymentDate =
        new Date(
          transaction.paidAt ||
            transaction.createdAt,
        );

      const baseDate =
        expiresAt &&
        expiresAt.getTime() >
          paymentDate.getTime()
          ? new Date(
              expiresAt.getTime(),
            )
          : paymentDate;

      expiresAt =
        this.addBillingCycle(
          baseDate,
          plan.billingCycle,
        );

      latestPlanSlug =
        plan.slug;
    }

    if (!expiresAt) {
      throw new BadRequestException(
        "The purchased plan has an unsupported billing cycle.",
      );
    }

    const active =
      expiresAt.getTime() >
      Date.now();

    const updatedUser =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .update({
          membershipTier:
            active
              ? "premium"
              : "free",
          subscriptionPlan:
            active
              ? latestPlanSlug
              : "free",
          subscriptionStatus:
            active
              ? "active"
              : "expired",
          subscriptionExpiresAt:
            expiresAt.toISOString(),
        });

    return {
      membershipTier:
        updatedUser?.membershipTier ??
        (active
          ? "premium"
          : "free"),
      subscriptionPlan:
        updatedUser?.subscriptionPlan ??
        (active
          ? latestPlanSlug
          : "free"),
      subscriptionStatus:
        updatedUser?.subscriptionStatus ??
        (active
          ? "active"
          : "expired"),
      subscriptionExpiresAt:
        updatedUser?.subscriptionExpiresAt ??
        expiresAt.toISOString(),
    };
  }

  private getTransactionTime(
    transaction: {
      paidAt: string | null;
      createdAt: string;
    },
  ) {
    return new Date(
      transaction.paidAt ||
        transaction.createdAt,
    ).getTime();
  }

  private addBillingCycle(
    baseDate: Date,
    billingCycle: string,
  ) {
    const result =
      new Date(
        baseDate.getTime(),
      );

    if (
      billingCycle ===
      "monthly"
    ) {
      result.setUTCMonth(
        result.getUTCMonth() +
          1,
      );

      return result;
    }

    if (
      billingCycle ===
      "annual"
    ) {
      result.setUTCFullYear(
        result.getUTCFullYear() +
          1,
      );

      return result;
    }

    return null;
  }

  private async initializeWithPaystack(
    input: {
      email: string;
      amount: number;
      currency: string;
      reference: string;
      callbackUrl: string;
      metadata: Record<
        string,
        string | number
      >;
    },
  ) {
    const secretKey =
      this.getSecretKey();

    let response: Response;

    try {
      response =
        await fetch(
          `${this.paystackBaseUrl}/transaction/initialize`,
          {
            method:
              "POST",
            headers: {
              Authorization:
                `Bearer ${secretKey}`,
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                email:
                  input.email,
                amount:
                  String(
                    input.amount,
                  ),
                currency:
                  input.currency,
                reference:
                  input.reference,
                callback_url:
                  input.callbackUrl,
                metadata:
                  JSON.stringify(
                    input.metadata,
                  ),
              }),
          },
        );
    } catch {
      throw new BadGatewayException(
        "Could not connect to Paystack.",
      );
    }

    const payload =
      (await response
        .json()
        .catch(() => null)) as
        | PaystackInitializeResponse
        | null;

    if (
      !response.ok ||
      !payload?.status ||
      !payload.data
    ) {
      throw new BadGatewayException(
        payload?.message ||
          "Paystack could not initialize the payment.",
      );
    }

    return payload.data;
  }

  private async verifyWithPaystack(
    reference: string,
  ) {
    const secretKey =
      this.getSecretKey();

    let response: Response;

    try {
      response =
        await fetch(
          `${this.paystackBaseUrl}/transaction/verify/${encodeURIComponent(
            reference,
          )}`,
          {
            headers: {
              Authorization:
                `Bearer ${secretKey}`,
            },
          },
        );
    } catch {
      throw new BadGatewayException(
        "Could not connect to Paystack.",
      );
    }

    const payload =
      (await response
        .json()
        .catch(() => null)) as
        | PaystackVerifyResponse
        | null;

    if (
      !response.ok ||
      !payload?.status ||
      !payload.data
    ) {
      throw new BadGatewayException(
        payload?.message ||
          "Paystack could not verify the payment.",
      );
    }

    return payload.data;
  }

  private assertValidWebhookSignature(
    rawBody: Buffer,
    signature?: string,
  ) {
    const secretKey =
      this.getSecretKey();

    if (!signature) {
      throw new UnauthorizedException(
        "Missing Paystack signature.",
      );
    }

    const expected =
      createHmac(
        "sha512",
        secretKey,
      )
        .update(rawBody)
        .digest("hex");

    const expectedBuffer =
      Buffer.from(
        expected,
        "utf8",
      );

    const providedBuffer =
      Buffer.from(
        signature,
        "utf8",
      );

    if (
      expectedBuffer.length !==
        providedBuffer.length ||
      !timingSafeEqual(
        expectedBuffer,
        providedBuffer,
      )
    ) {
      throw new UnauthorizedException(
        "Invalid Paystack signature.",
      );
    }
  }

  private getSecretKey() {
    const secretKey =
      process.env
        .PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      throw new ServiceUnavailableException(
        "Payments are not configured yet.",
      );
    }

    return secretKey;
  }
}
