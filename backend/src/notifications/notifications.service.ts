import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";

import {
  Cron,
  CronExpression,
} from "@nestjs/schedule";

import { db } from "../prisma/db";

import {
  UserNotificationsService,
} from "../user-notifications/user-notifications.service";

type CreateCampaignInput = {
  title: string;
  message: string;

  channel?: string;

  audience: string;
  platform: string;

  sendAt?: string;
};

@Injectable()
export class NotificationsService
  implements OnModuleInit
{
  private readonly logger =
    new Logger(
      NotificationsService.name,
    );

  private processing = false;

  constructor(
    private readonly userNotificationsService:
      UserNotificationsService,
  ) {}

  /* =========================================================
     START SCHEDULED CAMPAIGN CHECKER
  ========================================================= */

  onModuleInit() {
    void this.processDueCampaigns();
  }

  @Cron(
    CronExpression.EVERY_MINUTE,
  )
  async handleScheduledCampaigns() {
    await this.processDueCampaigns();
  }

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

    const channels = [
      "push",
      "email",
      "in-app",
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

    const channel =
      data.channel ??
      "push";

    if (
      !channels.includes(
        channel,
      )
    ) {
      throw new BadRequestException(
        "Invalid notification channel",
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

    const eligibleUsers =
      await this.getEligibleUsers(
        data.audience,
      );

    const created =
      await db.orm.public.NotificationCampaign.create({
        title,

        message,

        channel,

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
     ELIGIBLE USERS
  ========================================================= */

  private async getEligibleUsers(
    audience: string,
  ) {
    const users =
      await db.orm.public.User.all();

    const activeUsers =
      users.filter(
        (user) =>
          user.accountStatus !==
          "suspended",
      );

    if (
      audience ===
      "free"
    ) {
      return activeUsers.filter(
        (user) =>
          user.membershipTier ===
          "free",
      );
    }

    if (
      audience ===
      "premium"
    ) {
      return activeUsers.filter(
        (user) =>
          user.membershipTier ===
          "premium",
      );
    }

    return activeUsers;
  }

  /* =========================================================
     DELIVER ONE CAMPAIGN
  ========================================================= */

  async deliverCampaign(
    id: number,
  ) {
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

    if (
      campaign.status ===
      "sent"
    ) {
      return campaign;
    }

    if (
      campaign.status ===
      "cancelled"
    ) {
      return campaign;
    }

    const users =
      await this.getEligibleUsers(
        campaign.audience,
      );

    await this.userNotificationsService.createForUsers(
      users.map(
        (user) =>
          user.id,
      ),

      {
        campaignId:
          campaign.id,

        type:
          "campaign",

        title:
          campaign.title,

        message:
          campaign.message,

        href:
          "/notifications",
      },
    );

    const updated =
      await db.orm.public.NotificationCampaign
        .where({
          id,
        })
        .update({
          status:
            "sent",

          reach:
            users.length,
        });

    if (!updated) {
      throw new BadRequestException(
        "Could not update notification campaign",
      );
    }

    return updated;
  }

  /* =========================================================
     PROCESS SCHEDULED CAMPAIGNS
  ========================================================= */

  async processDueCampaigns() {
    if (
      this.processing
    ) {
      return;
    }

    this.processing = true;

    try {
      const campaigns =
        await db.orm.public.NotificationCampaign.all();

      const now =
        Date.now();

      const dueCampaigns =
        campaigns.filter(
          (campaign) => {
            if (
              campaign.status !==
              "scheduled"
            ) {
              return false;
            }

            if (
              !campaign.sendAt
            ) {
              return false;
            }

            return (
              new Date(
                campaign.sendAt,
              ).getTime() <=
              now
            );
          },
        );

      for (
        const campaign
        of dueCampaigns
      ) {
        try {
          await this.deliverCampaign(
            campaign.id,
          );

          this.logger.log(
            `Delivered notification campaign ${campaign.id}`,
          );
        } catch (error) {
          this.logger.error(
            `Could not deliver notification campaign ${campaign.id}`,
            error instanceof Error
              ? error.stack
              : undefined,
          );
        }
      }
    } finally {
      this.processing =
        false;
    }
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

    if (
      status === "sent" &&
      campaign.status !==
        "sent"
    ) {
      return this.deliverCampaign(
        id,
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