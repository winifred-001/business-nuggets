import {
  Injectable,
} from "@nestjs/common";

import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getMessaging,
} from "firebase-admin/messaging";

import { db } from "../prisma/db";

@Injectable()
export class PushNotificationsService {
  /* =========================================================
     FIREBASE CONFIG
  ========================================================= */

  private isConfigured() {
    return Boolean(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    );
  }

  private initializeFirebase() {
    if (
      !this.isConfigured()
    ) {
      return false;
    }

    if (
      getApps().length ===
      0
    ) {
      initializeApp({
        credential:
          cert({
            projectId:
              process.env
                .FIREBASE_PROJECT_ID!,

            clientEmail:
              process.env
                .FIREBASE_CLIENT_EMAIL!,

            privateKey:
              process.env
                .FIREBASE_PRIVATE_KEY!
                .replace(
                  /\\n/g,
                  "\n",
                ),
          }),
      });
    }

    return true;
  }

  /* =========================================================
     REGISTER DEVICE TOKEN
  ========================================================= */

  async registerDeviceToken(
    userId: number,
    data: {
      token: string;
      platform: string;
      deviceName?: string;
    },
  ) {
    const existingToken =
      await db.orm.public.PushDeviceToken
        .where({
          token:
            data.token,
        })
        .first();

    /*
      FCM tokens belong to devices/installations.

      If the same token is later used by another account,
      move the token to the currently authenticated user.
    */
    if (existingToken) {
      await db.orm.public.PushDeviceToken
        .where({
          id:
            existingToken.id,
        })
        .update({
          userId,

          platform:
            data.platform,

          deviceName:
            data.deviceName ??
            existingToken.deviceName,

          active:
            true,

          lastSeenAt:
            new Date()
              .toISOString(),
        });

      return {
        message:
          "Push notification device updated successfully",
      };
    }

    await db.orm.public.PushDeviceToken.create({
      userId,

      token:
        data.token,

      platform:
        data.platform,

      deviceName:
        data.deviceName ??
        null,

      active:
        true,

      lastSeenAt:
        new Date()
          .toISOString(),
    });

    return {
      message:
        "Push notification device registered successfully",
    };
  }

  /* =========================================================
     UNREGISTER DEVICE TOKEN
  ========================================================= */

  async unregisterDeviceToken(
    userId: number,
    token: string,
  ) {
    const device =
      await db.orm.public.PushDeviceToken
        .where({
          token,
        })
        .first();

    /*
      Do not reveal whether another user's token exists.
    */
    if (
      !device ||
      device.userId !==
        userId
    ) {
      return {
        message:
          "Push notification device removed successfully",
      };
    }

    await db.orm.public.PushDeviceToken
      .where({
        id:
          device.id,
      })
      .update({
        active:
          false,

        lastSeenAt:
          new Date()
            .toISOString(),
      });

    return {
      message:
        "Push notification device removed successfully",
    };
  }

  /* =========================================================
     GET ACTIVE TOKENS FOR USER
  ========================================================= */

  async getActiveTokensForUser(
    userId: number,
  ) {
    const devices =
      await db.orm.public.PushDeviceToken
        .where({
          userId,
        })
        .all();

    return devices
      .filter(
        (device) =>
          device.active,
      )
      .map(
        (device) =>
          device.token,
      );
  }

  /* =========================================================
     SEND TO ONE DEVICE
  ========================================================= */

  async sendToDevice(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<
      string,
      string
    >,
  ) {
    if (
      !this.initializeFirebase()
    ) {
      console.warn(
        "Push notification skipped because Firebase is not configured",
      );

      return {
        sent:
          false,

        reason:
          "Firebase is not configured",
      };
    }

    const messageId =
      await getMessaging().send({
        token:
          deviceToken,

        notification: {
          title,
          body,
        },

        data:
          data ?? {},
      });

    return {
      sent:
        true,

      messageId,
    };
  }

  /* =========================================================
     SEND TO MULTIPLE DEVICES
  ========================================================= */

  async sendToMultipleDevices(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<
      string,
      string
    >,
  ) {
    if (
      deviceTokens.length ===
      0
    ) {
      return {
        sent:
          0,

        failed:
          0,
      };
    }

    if (
      !this.initializeFirebase()
    ) {
      console.warn(
        "Push notifications skipped because Firebase is not configured",
      );

      return {
        sent:
          0,

        failed:
          deviceTokens.length,

        reason:
          "Firebase is not configured",
      };
    }

    const response =
      await getMessaging()
        .sendEachForMulticast({
          tokens:
            deviceTokens,

          notification: {
            title,
            body,
          },

          data:
            data ?? {},
        });

    return {
      sent:
        response.successCount,

      failed:
        response.failureCount,

      responses:
        response.responses,
    };
  }
}