import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../prisma/db";
import { hasActivePaidSubscription, hasPaidReadingAccess, isPaidSubscriptionInGrace, paidReadingExpiry, graceGrantExpiry, restoredPaidHistoryExpiry } from "./paid-history-access";
import { TopUpsService } from "../topups/topups.service";
import { monthlyNuggetAllowanceExpiry } from "./monthly-nugget-allowance";

import {
  CreateNuggetDto,
} from "./dto/create-nugget.dto";

import {
  UpdateNuggetDto,
} from "./dto/update-nugget.dto";

type LockedNuggetPreview<T> = Omit<
  T,
  | "isGold"
  | "scriptureText"
  | "keyPrinciple"
  | "details"
  | "marketplaceApplication"
  | "practicalActionPlan"
  | "audioUrl"
  | "nuggetAudioUrl"
> & {
  isGold: true;
  locked: true;
  scriptureText: string;
  keyPrinciple: string;
  details: string;
  marketplaceApplication: string;
  practicalActionPlan: readonly string[];
  audioUrl: null;
  nuggetAudioUrl: null;
};

@Injectable()
export class NuggetsService {
  constructor(private readonly topups: TopUpsService) {}

  private async hasPremiumAccess(
    userId?: number,
  ) {
    if (!userId) {
      return false;
    }

    const user =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .first();

    if (!user) {
      return false;
    }

    return (
      user.role === "owner" ||
      Boolean(user.adminRole) ||
      hasPaidReadingAccess(user)
    );
  }

  private accessTables?: Promise<void>;

  private ensureAccessTables() {
    if (!this.accessTables) {
      this.accessTables = (async () => {
        await db.runtime().execute(db.raw.sql`
          CREATE TABLE IF NOT EXISTS "SubscriptionAccessPolicy" (
            "planSlug" text PRIMARY KEY,
            "maxNuggets" integer NOT NULL DEFAULT 1 CHECK ("maxNuggets" >= 1),
            "accessDurationHours" integer NOT NULL DEFAULT 24 CHECK ("accessDurationHours" BETWEEN 1 AND 8760),
            "quotaWindowHours" integer NOT NULL DEFAULT 24 CHECK ("quotaWindowHours" BETWEEN 1 AND 8760),
            "updatedAt" timestamptz NOT NULL DEFAULT NOW()
          )
        `.affectedCount().build());
        await db.runtime().execute(db.raw.sql`
          CREATE TABLE IF NOT EXISTS "NuggetAccessSession" (
            "userId" integer PRIMARY KEY,
            "startedAt" timestamptz NOT NULL,
            "expiresAt" timestamptz NOT NULL
          )
        `.affectedCount().build());
        await db.runtime().execute(db.raw.sql`
          CREATE TABLE IF NOT EXISTS "NuggetAccessGrant" (
            "id" bigserial PRIMARY KEY,
            "userId" integer NOT NULL,
            "nuggetId" text NOT NULL,
            "openedAt" timestamptz NOT NULL DEFAULT NOW(),
            "expiresAt" timestamptz NOT NULL,
            UNIQUE ("userId", "nuggetId")
          )
        `.affectedCount().build());
        await db.runtime().execute(db.raw.sql`
          CREATE INDEX IF NOT EXISTS "NuggetAccessGrant_user_opened_idx"
          ON "NuggetAccessGrant" ("userId", "openedAt")
        `.affectedCount().build());
      })().catch(error => {
        this.accessTables = undefined;
        throw error;
      });
    }
    return this.accessTables;
  }

  private async getAccessContext(userId: number) {
    await this.ensureAccessTables();
    const user = await db.orm.public.User.where({ id: userId }).first();
    if (!user) throw new ForbiddenException("A valid account is required to open this nugget.");

    const isAdmin = user.role === "owner" || Boolean(user.adminRole);
    const paidActive = hasPaidReadingAccess(user);
    const planSlug = paidActive && user.subscriptionPlan
      ? user.subscriptionPlan
      : "free";

    let policies = await db.runtime().query(db.raw.sql`
      SELECT "maxNuggets", "accessDurationHours", "quotaWindowHours"
      FROM "SubscriptionAccessPolicy"
      WHERE "planSlug" = ${planSlug}
      LIMIT 1
    `.returnsRow({
      maxNuggets: "pg/int4@1",
      accessDurationHours: "pg/int4@1",
      quotaWindowHours: "pg/int4@1",
    }).build());

    if (!policies.length) {
      const maxNuggets = planSlug === "free" ? 1 : 5;
      await db.runtime().execute(db.raw.sql`
        INSERT INTO "SubscriptionAccessPolicy"
          ("planSlug", "maxNuggets", "accessDurationHours", "quotaWindowHours")
        VALUES (${planSlug}, ${maxNuggets}, 24, 24)
        ON CONFLICT ("planSlug") DO NOTHING
      `.affectedCount().build());
      policies = await db.runtime().query(db.raw.sql`
        SELECT "maxNuggets", "accessDurationHours", "quotaWindowHours"
        FROM "SubscriptionAccessPolicy"
        WHERE "planSlug" = ${planSlug}
        LIMIT 1
      `.returnsRow({
        maxNuggets: "pg/int4@1",
        accessDurationHours: "pg/int4@1",
        quotaWindowHours: "pg/int4@1",
      }).build());
    }

    // Only verified, paid transactions can restore an older server-granted opening.
    const payments = paidActive
      ? await db.orm.public.BillingTransaction.where({ userId, status: "paid" }).all()
      : [];
    const latestPaidAt = payments.reduce<string | null>((latest, transaction) => {
      if (transaction.planSlug === "free" || transaction.planSlug.startsWith("topup:") || !transaction.paidAt) return latest;
      const paymentTime = Date.parse(transaction.paidAt);
      if (!Number.isFinite(paymentTime)) return latest;
      return !latest || paymentTime > Date.parse(latest) ? transaction.paidAt : latest;
    }, null);

    return {
      user,
      isAdmin,
      latestPaidAt,
      policy: policies[0] ?? { maxNuggets: 1, accessDurationHours: 24, quotaWindowHours: 24 },
    };
  }

  private async getUserGrants(userId: number) {
    await this.ensureAccessTables();
    return db.runtime().query(db.raw.sql`
      SELECT "nuggetId", "openedAt", "expiresAt"
      FROM "NuggetAccessGrant"
      WHERE "userId" = ${userId}
    `.returnsRow({
      nuggetId: "pg/text@1",
      openedAt: "pg/timestamptz-string@1",
      expiresAt: "pg/timestamptz-string@1",
    }).build());
  }

  private async getUserAccessSession(userId: number) {
    await this.ensureAccessTables();
    const rows = await db.runtime().query(db.raw.sql`
      SELECT "startedAt", "expiresAt"
      FROM "NuggetAccessSession"
      WHERE "userId" = ${userId}
      LIMIT 1
    `.returnsRow({
      startedAt: "pg/timestamptz-string@1",
      expiresAt: "pg/timestamptz-string@1",
    }).build());
    return rows[0] ?? null;
  }

  private sessionNeedsReset(
    session: { startedAt: string; expiresAt: string } | null,
    context: Awaited<ReturnType<NuggetsService["getAccessContext"]>>,
    now: number,
  ): boolean {
    if (!session || Date.parse(session.expiresAt) <= now) return true;
    // A verified renewal or upgrade starts a fresh selection allowance.
    if (context.latestPaidAt && Date.parse(session.startedAt) < Date.parse(context.latestPaidAt)) return true;
    // Do not carry a paid reading window past subscription expiry.
    const oldPaidExpiry = Date.parse(context.user.subscriptionExpiresAt ?? "");
    return Number.isFinite(oldPaidExpiry) &&
      oldPaidExpiry <= now &&
      Date.parse(session.startedAt) < oldPaidExpiry;
  }

  private effectiveAccessExpiry(
    sessionExpiry: string,
    user: Awaited<ReturnType<NuggetsService["getAccessContext"]>>["user"],
  ): string {
    // The three-day grace must not be cut off by a client-side expiry timer.
    const paidExpiry = hasPaidReadingAccess(user)
      ? Date.parse(paidReadingExpiry(user) ?? "")
      : NaN;
    return Number.isFinite(paidExpiry) && paidExpiry < Date.parse(sessionExpiry)
      ? user.subscriptionExpiresAt!
      : sessionExpiry;
  }

  private async openNuggetAccess(
    userId: number,
    nuggetId: string,
    context: Awaited<ReturnType<NuggetsService["getAccessContext"]>>,
  ) {
    const { policy } = context;
    const now = new Date();
    let session = await this.getUserAccessSession(userId);

    // Each selection batch lasts one actual calendar month from the first opening.
    // The legacy accessDurationHours column is retained for API/schema compatibility
    // but no longer controls the allowance.
    if (this.sessionNeedsReset(session, context, now.getTime())) {
      const expiresAt = new Date(monthlyNuggetAllowanceExpiry(now.toISOString()));
      await db.runtime().execute(db.raw.sql`
        INSERT INTO "NuggetAccessSession" ("userId", "startedAt", "expiresAt")
        VALUES (${userId}, ${now.toISOString()}, ${expiresAt.toISOString()})
        ON CONFLICT ("userId") DO UPDATE SET
          "startedAt" = EXCLUDED."startedAt",
          "expiresAt" = EXCLUDED."expiresAt"
      `.affectedCount().build());
      session = { startedAt: now.toISOString(), expiresAt: expiresAt.toISOString() };
    }

    const grants = await this.getUserGrants(userId);
    const selected = grants.filter(grant =>
      new Date(grant.openedAt).getTime() >= new Date(session!.startedAt).getTime()
    );
    const existing = selected.find(grant => grant.nuggetId === nuggetId);

    if (existing) {
      return { openedAt: session.startedAt, expiresAt: session.expiresAt };
    }

    if (selected.length >= policy.maxNuggets) {
      if (hasActivePaidSubscription(context.user)) {
        // An unused paid Top-up credit can extend the selection allowance.
        await this.topups.redeem(userId, nuggetId, paidReadingExpiry(context.user)!);
        return { openedAt: now.toISOString(), expiresAt: paidReadingExpiry(context.user)! };
      }
      throw new ForbiddenException({
        statusCode: 403,
        code: "NUGGET_QUOTA_REACHED",
        message: `You have selected all ${policy.maxNuggets} Nuggets in your monthly allowance. You can select new Nuggets when the next monthly period starts.`,
        maxNuggets: policy.maxNuggets,
        allowancePeriod: "monthly",
        nextAvailableAt: session.expiresAt,
      });
    }

    await db.runtime().execute(db.raw.sql`
      INSERT INTO "NuggetAccessGrant" ("userId", "nuggetId", "openedAt", "expiresAt")
      VALUES (${userId}, ${nuggetId}, ${session.startedAt}, ${session.expiresAt})
      ON CONFLICT ("userId", "nuggetId") DO UPDATE SET
        "openedAt" = EXCLUDED."openedAt",
        "expiresAt" = EXCLUDED."expiresAt"
    `.affectedCount().build());

    return { openedAt: session.startedAt, expiresAt: session.expiresAt };
  }

  private toLockedPreview<
    T extends {
      number: number;
      title: string;
      topic: string;
      tag: string;
      scriptureRef: string;
      scriptureText: string;
      keyPrinciple: string;
      marketplaceApplication: string;
      practicalActionPlan: readonly string[];
      book: string;
      bibleSection: string;
      isGold: boolean;
      featured: boolean;
      audioUrl?: string | null;
    },
  >(
    nugget: T,
  ): LockedNuggetPreview<T> {
    return {
      ...nugget,
      isGold: true,
      locked: true,
      scriptureText: "",
      keyPrinciple: "",
      details: "",
      marketplaceApplication:
        "",
      practicalActionPlan: [],
      audioUrl: null,
      nuggetAudioUrl: null,
    };
  }

  /* =========================================================
     GET PUBLISHED NUGGETS
     SEARCH + FILTER + SORT + PAGINATION
  ========================================================= */

  async getPublishedNuggets(
    query?: {
      search?: string;
      topic?: string;
      book?: string;
      bibleSection?: string;
      gold?: string;
      featured?: string;
      sort?: string;
      page?: string;
      limit?: string;
    },
    userId?: number,
  ) {
    const published =
      await db.orm.public.Nugget
        .where({
          status: "published",
        })
        .all();

    const premium =
      await this.hasPremiumAccess(
        userId,
      );

    let nuggets =
      published.map(
        (nugget) => {
          if (
            premium ||
            !nugget.isGold
          ) {
            return {
              ...nugget,
              locked: false,
            };
          }

          return this.toLockedPreview(
            nugget,
          );
        },
      );

    let accessSummary: Record<string, unknown> = {
      maxNuggets: null,
      accessDurationHours: null,
      quotaWindowHours: null,
      used: 0,
      remaining: null,
    };

    if (userId) {
      const context = await this.getAccessContext(userId);
      if (!context.isAdmin) {
        const grants = await this.getUserGrants(userId);
        const session = await this.getUserAccessSession(userId);
        const now = Date.now();
        const inGrace = isPaidSubscriptionInGrace(context.user, now);
        const canChooseNew = !inGrace;
        const redeemedIds = hasPaidReadingAccess(context.user, now)
          ? await this.topups.getRedeemedIds(userId).catch(() => new Set<string>())
          : new Set<string>();
        const topUpWallet = hasActivePaidSubscription(context.user, now)
          ? await this.topups.getWallet(userId).catch(() => null)
          : null;
        const sessionActive = !this.sessionNeedsReset(session, context, now);
        const selectedGrants = sessionActive
          ? grants.filter(grant => new Date(grant.openedAt).getTime() >= new Date(session!.startedAt).getTime())
          : [];
        const usedIds = new Set(selectedGrants.map(grant => grant.nuggetId));
        const grantByNugget = new Map(selectedGrants.map(grant => [grant.nuggetId, grant]));
        const previousGrants = new Map(grants.map(grant => [grant.nuggetId, grant]));

        nuggets = nuggets.map((nugget: any) => {
          if (nugget.isGold && !premium) {
            return { ...nugget, accessLocked: true, accessAvailable: false, accessReason: "PREMIUM_REQUIRED" };
          }

          const previousGrant = previousGrants.get(nugget.id);
          const graceExpiry = graceGrantExpiry(context.user, previousGrant, now);
          if (graceExpiry) {
            return { ...nugget, locked: false, accessLocked: false, accessAvailable: true,
              accessInGrace: true, accessExpiresAt: graceExpiry };
          }
          if (redeemedIds.has(nugget.id)) {
            return { ...nugget, locked: false, accessLocked: false, accessAvailable: true,
              accessFromTopUp: true, accessExpiresAt: paidReadingExpiry(context.user) };
          }
          const restoredExpiry = restoredPaidHistoryExpiry(context.user, context.latestPaidAt, previousGrant);
          if (restoredExpiry) {
            return {
              ...nugget, locked: false, accessLocked: false, accessAvailable: true,
              accessRestored: true, accessExpiresAt: restoredExpiry,
            };
          }

          const grant = grantByNugget.get(nugget.id);
          const active = Boolean(sessionActive && grant);
          const canOpen = canChooseNew && !active && (usedIds.size < context.policy.maxNuggets || Boolean(topUpWallet?.balance));

          if (active) {
            return {
              ...nugget,
              locked: false,
              accessLocked: false,
              accessAvailable: true,
              accessExpiresAt: session ? this.effectiveAccessExpiry(session.expiresAt, context.user) : null,
            };
          }

          return {
            ...nugget,
            locked: true,
            accessLocked: true,
            accessAvailable: canOpen,
            accessReason: inGrace ? "SUBSCRIPTION_GRACE"
              : session && !sessionActive ? "ACCESS_PERIOD_EXPIRED"
              : canOpen ? "OPEN_TO_START" : "NUGGET_QUOTA_REACHED",
            accessAvailableAt: sessionActive && session ? this.effectiveAccessExpiry(session.expiresAt, context.user) : null,
            accessExpiresAt: null,
            scriptureText: "",
            keyPrinciple: "",
            details: "",
            marketplaceApplication: "",
            practicalActionPlan: [],
            audioUrl: null,
            nuggetAudioUrl: null,
          };
        });

        accessSummary = {
          maxNuggets: context.policy.maxNuggets,
          accessDurationHours: context.policy.accessDurationHours,
          quotaWindowHours: context.policy.quotaWindowHours,
          allowancePeriod: "monthly",
          startedAt: sessionActive ? session?.startedAt : null,
          expiresAt: sessionActive && session ? this.effectiveAccessExpiry(session.expiresAt, context.user) : null,
          used: usedIds.size,
          remaining: Math.max(0, context.policy.maxNuggets - usedIds.size),
          topUpRemaining: topUpWallet?.balance ?? 0,
          subscriptionInGrace: inGrace,
          graceEndsAt: inGrace ? paidReadingExpiry(context.user) : null,
        };
      }
    }

    /* =========================================================
       SEARCH
    ========================================================= */

    const search =
      query?.search
        ?.trim()
        .toLowerCase();

    if (search) {
      nuggets =
        nuggets.filter(
          (nugget) =>
            nugget.title
              .toLowerCase()
              .includes(search) ||
            nugget.topic
              .toLowerCase()
              .includes(search) ||
            nugget.tag
              .toLowerCase()
              .includes(search) ||
            nugget.scriptureRef
              .toLowerCase()
              .includes(search) ||
            nugget.scriptureText
              .toLowerCase()
              .includes(search) ||
            nugget.keyPrinciple
              .toLowerCase()
              .includes(search) ||
            nugget.marketplaceApplication
              .toLowerCase()
              .includes(search),
        );
    }

    /* =========================================================
       TOPIC FILTER
    ========================================================= */

    if (query?.topic) {
      const topic =
        query.topic
          .trim()
          .toLowerCase();

      nuggets =
        nuggets.filter(
          (nugget) =>
            nugget.topic
              .toLowerCase() ===
            topic,
        );
    }

    /* =========================================================
       BOOK FILTER
    ========================================================= */

    if (query?.book) {
      const book =
        query.book
          .trim()
          .toLowerCase();

      nuggets =
        nuggets.filter(
          (nugget) =>
            nugget.book
              .toLowerCase() ===
            book,
        );
    }

    /* =========================================================
       BIBLE SECTION FILTER
    ========================================================= */

    if (query?.bibleSection) {
      const bibleSection =
        query.bibleSection
          .trim()
          .toLowerCase();

      nuggets =
        nuggets.filter(
          (nugget) =>
            nugget.bibleSection
              .toLowerCase() ===
            bibleSection,
        );
    }

    /* =========================================================
       GOLD FILTER
    ========================================================= */

    if (
      query?.gold ===
      "true"
    ) {
      nuggets =
        nuggets.filter(
          (nugget) =>
            nugget.isGold,
        );
    }

    if (
      query?.gold ===
      "false"
    ) {
      nuggets =
        nuggets.filter(
          (nugget) =>
            !nugget.isGold,
        );
    }

    /* =========================================================
       FEATURED FILTER
    ========================================================= */

    if (
      query?.featured ===
      "true"
    ) {
      nuggets =
        nuggets.filter(
          (nugget) =>
            nugget.featured,
        );
    }

    if (
      query?.featured ===
      "false"
    ) {
      nuggets =
        nuggets.filter(
          (nugget) =>
            !nugget.featured,
        );
    }

    /* =========================================================
       SORTING
    ========================================================= */

    switch (query?.sort) {
      case "oldest":
        nuggets.sort(
          (a, b) =>
            a.number -
            b.number,
        );
        break;

      case "newest":
        nuggets.sort(
          (a, b) =>
            b.number -
            a.number,
        );
        break;

      case "title-asc":
        nuggets.sort(
          (a, b) =>
            a.title.localeCompare(
              b.title,
            ),
        );
        break;

      case "title-desc":
        nuggets.sort(
          (a, b) =>
            b.title.localeCompare(
              a.title,
            ),
        );
        break;

      default:
        nuggets.sort(
          (a, b) =>
            a.number -
            b.number,
        );
    }

    /* =========================================================
       PAGINATION
    ========================================================= */

    const page =
      Math.max(
        Number.parseInt(
          query?.page ??
            "1",
          10,
        ) || 1,
        1,
      );

    const limit =
      Math.min(
        Math.max(
          Number.parseInt(
            query?.limit ??
              "12",
            10,
          ) || 12,
          1,
        ),
        100,
      );

    const total =
      nuggets.length;

    const totalPages =
      Math.max(
        Math.ceil(
          total /
            limit,
        ),
        1,
      );

    const start =
      (page - 1) *
      limit;

    const data =
      nuggets.slice(
        start,
        start +
          limit,
      );

    return {
      data,

      access: {
        premium,
        freeLimit: null,
        ...accessSummary,
      },

      pagination: {
        page,
        limit,
        total,
        totalPages,

        hasNextPage:
          page <
          totalPages,

        hasPreviousPage:
          page > 1,
      },
    };
  }

  /* =========================================================
     GET ONE PUBLISHED NUGGET
  ========================================================= */

  async getNuggetBySlug(
    slug: string,
    userId?: number,
  ) {
    const nugget =
      await db.orm.public.Nugget
        .where({
          slug,
          status:
            "published",
        })
        .first();

    if (!nugget) {
      throw new NotFoundException(
        "Nugget not found",
      );
    }

    const premium =
      await this.hasPremiumAccess(
        userId,
      );

    if (!premium && nugget.isGold) {
      throw new ForbiddenException({
        statusCode: 403,
        code: "PREMIUM_REQUIRED",
        message: "This Business Nugget is available to Premium members.",
      });
    }

    if (userId) {
      const context = await this.getAccessContext(userId);
      if (!context.isAdmin) {
        const previousGrant = (await this.getUserGrants(userId)).find(grant => grant.nuggetId === nugget.id);
        const graceExpiry = graceGrantExpiry(context.user, previousGrant);
        if (graceExpiry) return { ...nugget, accessExpiresAt: graceExpiry, accessInGrace: true };
        if (hasPaidReadingAccess(context.user) &&
          (await this.topups.getRedeemedIds(userId).catch(() => new Set<string>())).has(nugget.id)) {
          return { ...nugget, accessExpiresAt: paidReadingExpiry(context.user), accessFromTopUp: true };
        }
        const restoredExpiry = restoredPaidHistoryExpiry(context.user, context.latestPaidAt, previousGrant);
        if (restoredExpiry) {
          return { ...nugget, accessExpiresAt: restoredExpiry, accessRestored: true };
        }

        if (isPaidSubscriptionInGrace(context.user)) throw new ForbiddenException({
          code: "SUBSCRIPTION_GRACE",
          message: "Your paid plan is in its three-day grace period. You can reread Nuggets already opened; renew to open new Nuggets.",
        });
        const access = await this.openNuggetAccess(userId, nugget.id, context);
        return {
          ...nugget,
          accessExpiresAt: this.effectiveAccessExpiry(access.expiresAt, context.user),
          allowancePeriod: "monthly",
        };
      }
    }

    return nugget;
  }

  /* =========================================================
     ADMIN - GET ALL NUGGETS
  ========================================================= */

  async getAllNuggetsForAdmin() {
    return db.orm.public.Nugget.all();
  }

  /* =========================================================
     ADMIN - CREATE NUGGET
  ========================================================= */

  async createNugget(
    dto: CreateNuggetDto,
  ) {
    const status =
      dto.status ??
      "draft";

    const isGold =
      dto.isGold ??
      false;

    return db.orm.public.Nugget.create({
      id:
        `nugget-${dto.number}`,

      number:
        dto.number,

      slug:
        dto.slug,

      title:
        dto.title,

      topic:
        dto.topic,

      tag:
        dto.tag,

      scriptureRef:
        dto.scriptureRef,

      scriptureText:
        dto.scriptureText,

      image:
        dto.image,

      keyPrinciple:
        dto.keyPrinciple,

      details: dto.details?.trim() || null,

      marketplaceApplication:
        dto.marketplaceApplication,

      practicalActionPlan:
        dto.practicalActionPlan,

      duration:
        dto.duration,

      isGold,

      book:
        dto.book,

      bibleSection:
        dto.bibleSection,

      challenges:
        dto.challenges,

      status,

      featured:
        dto.featured ??
        false,

      audioUrl: dto.audioUrl?.trim() || null,
      nuggetAudioUrl: dto.nuggetAudioUrl?.trim() || null,

      publishedAt:
        status ===
        "published"
          ? dto.publishedAt ??
            new Date()
              .toISOString()
          : null,
    });
  }

  /* =========================================================
     ADMIN - UPDATE NUGGET
  ========================================================= */

  async updateNugget(
    id: string,
    dto: UpdateNuggetDto,
  ) {
    const existing =
      await db.orm.public.Nugget
        .where({
          id,
        })
        .first();

    if (!existing) {
      throw new NotFoundException(
        "Nugget not found",
      );
    }

    const updates: any = {
      ...dto,
    };
    if (dto.audioUrl !== undefined) updates.audioUrl = dto.audioUrl?.trim() || null;
    if (dto.nuggetAudioUrl !== undefined) updates.nuggetAudioUrl = dto.nuggetAudioUrl?.trim() || null;

    if (
      dto.status ===
        "published" &&
      existing.status !==
        "published"
    ) {
      updates.publishedAt =
        new Date()
          .toISOString();
    }

    if (
      dto.status ===
      "draft"
    ) {
      updates.publishedAt =
        null;
    }

    return db.orm.public.Nugget
      .where({
        id,
      })
      .update(
        updates,
      );
  }

  /* =========================================================
     ADMIN - DELETE NUGGET
  ========================================================= */

  async deleteNugget(
    id: string,
  ) {
    const existing =
      await db.orm.public.Nugget
        .where({
          id,
        })
        .first();

    if (!existing) {
      throw new NotFoundException(
        "Nugget not found",
      );
    }

    return db.orm.public.Nugget
      .where({
        id,
      })
      .delete();
  }
}
