import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../prisma/db";

@Injectable()
export class UserNotificationsService {
  /* =========================================================
     GET CURRENT USER'S NOTIFICATIONS
  ========================================================= */

  async getNotifications(
    userId: number,
  ) {
    const notifications =
      await db.orm.public.UserNotification
        .where({
          userId,
        })
        .all();

    return [...notifications].sort(
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
     UNREAD COUNT
  ========================================================= */

  async getUnreadCount(
    userId: number,
  ) {
    const notifications =
      await db.orm.public.UserNotification
        .where({
          userId,
        })
        .all();

    const unreadCount =
      notifications.filter(
        (notification) =>
          !notification.readAt,
      ).length;

    return {
      unreadCount,
    };
  }

  /* =========================================================
     MARK ONE AS READ
  ========================================================= */

  async markAsRead(
    userId: number,
    notificationId: number,
  ) {
    const notification =
      await db.orm.public.UserNotification
        .where({
          id: notificationId,
          userId,
        })
        .first();

    if (!notification) {
      throw new NotFoundException(
        "Notification not found",
      );
    }

    if (notification.readAt) {
      return notification;
    }

    const updated =
      await db.orm.public.UserNotification
        .where({
          id: notificationId,
          userId,
        })
        .update({
          readAt:
            new Date().toISOString(),
        });

    if (!updated) {
      throw new NotFoundException(
        "Notification not found",
      );
    }

    return updated;
  }

  /* =========================================================
     MARK ALL AS READ
  ========================================================= */

  async markAllAsRead(
    userId: number,
  ) {
    const notifications =
      await db.orm.public.UserNotification
        .where({
          userId,
        })
        .all();

    const unread =
      notifications.filter(
        (notification) =>
          !notification.readAt,
      );

    const readAt =
      new Date().toISOString();

    for (
      const notification of unread
    ) {
      await db.orm.public.UserNotification
        .where({
          id: notification.id,
          userId,
        })
        .update({
          readAt,
        });
    }

    return {
      message:
        "All notifications marked as read",
      updatedCount:
        unread.length,
    };
  }

    /* =========================================================
     CREATE ONE NOTIFICATION
     INTERNAL BACKEND USE
  ========================================================= */

  async createNotification(
    data: {
      userId: number;
      campaignId?: number | null;
      type?: string;
      title: string;
      message: string;
      href?: string | null;
    },
  ) {
    return db.orm.public.UserNotification.create({
      userId:
        data.userId,

      campaignId:
        data.campaignId ?? null,

      type:
        data.type ?? "system",

      title:
        data.title.trim(),

      message:
        data.message.trim(),

      href:
        data.href ?? null,

      readAt:
        null,
    });
  }

  /* =========================================================
     CREATE FOR MULTIPLE USERS
  ========================================================= */

  async createForUsers(
    userIds: number[],
    data: {
      campaignId?: number | null;
      type?: string;
      title: string;
      message: string;
      href?: string | null;
    },
  ) {
    let createdCount = 0;

    for (const userId of userIds) {
      const created =
        await this.createNotification({
          userId,

          campaignId:
            data.campaignId,

          type:
            data.type,

          title:
            data.title,

          message:
            data.message,

          href:
            data.href,
        });

      if (created) {
        createdCount += 1;
      }
    }

    return {
      createdCount,
    };
  }
}