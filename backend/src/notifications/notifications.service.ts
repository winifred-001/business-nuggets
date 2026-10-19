import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../prisma/db";

type CreateCampaignInput = {
  title: string;
  message: string;
  audience: string;
  platform: string;
  sendAt?: string;
};

@Injectable()
export class NotificationsService {
  /* =========================================================
     ADMIN HISTORY
  ========================================================= */

  async getCampaigns() {
    const campaigns =
      await db.orm.public.NotificationCampaign.all();

    return [...campaigns].sort(
      (a, b) =>
        new Date(
          b.createdAt,
        ).getTime() -
        new Date(
          a.createdAt,
        ).getTime(),
    );
  }

  /* =========================================================
     CREATE / SCHEDULE CAMPAIGN
  ========================================================= */

  async createCampaign(
    data: CreateCampaignInput,
  ) {
    const title =
      data.title.trim();

    const message =
      data.message.trim();

    if (!title) {
      throw new BadRequestException(
        "Notification title is required",
      );
    }

    if (!message) {
      throw new BadRequestException(
        "Notification message is required",
      );
    }

    const audiences = [
      "all",
      "free",
      "premium",
    ];

    const platforms = [
      "all",
      "web",
      "ios",
      "android",
      "ios-android",
    ];

    if (
      !audiences.includes(
        data.audience,
      )
    ) {
      throw new BadRequestException(
        "Invalid audience",
      );
    }

    if (
      !platforms.includes(
        data.platform,
      )
    ) {
      throw new BadRequestException(
        "Invalid platform",
      );
    }

    let sendAt:
      | string
      | null = null;

    let status =
      "draft";

    if (
      data.sendAt
    ) {
      const date =
        new Date(
          data.sendAt,
        );

      if (
        Number.isNaN(
          date.getTime(),
        )
      ) {
        throw new BadRequestException(
          "Invalid send date",
        );
      }

      sendAt =
        date.toISOString();

      status =
        "scheduled";
    }

    const users =
      await db.orm.public.User.all();

    let eligibleUsers =
      users;

    if (
      data.audience ===
      "free"
    ) {
      eligibleUsers =
        users.filter(
          (user) =>
            user.membershipTier ===
            "free",
        );
    }

    if (
      data.audience ===
      "premium"
    ) {
      eligibleUsers =
        users.filter(
          (user) =>
            user.membershipTier ===
            "premium",
        );
    }

    const created =
      await db.orm.public.NotificationCampaign.create({
        title,

        message,

        audience:
          data.audience,

        platform:
          data.platform,

        sendAt,

        status,

        reach:
          eligibleUsers.length,
      });

    if (!created) {
      throw new BadRequestException(
        "Could not create notification campaign",
      );
    }

    return created;
  }

  /* =========================================================
     UPDATE CAMPAIGN STATUS
  ========================================================= */

  async updateStatus(
    id: number,
    status: string,
  ) {
    const allowed = [
      "draft",
      "scheduled",
      "sent",
      "failed",
      "cancelled",
    ];

    if (
      !allowed.includes(
        status,
      )
    ) {
      throw new BadRequestException(
        "Invalid campaign status",
      );
    }

    const campaign =
      await db.orm.public.NotificationCampaign
        .where({
          id,
        })
        .first();

    if (!campaign) {
      throw new NotFoundException(
        "Notification campaign not found",
      );
    }

    const updated =
      await db.orm.public.NotificationCampaign
        .where({
          id,
        })
        .update({
          status,
        });

    if (!updated) {
      throw new NotFoundException(
        "Notification campaign not found",
      );
    }

    return updated;
  }
}