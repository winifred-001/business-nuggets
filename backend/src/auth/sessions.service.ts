import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";

import { db } from "../prisma/db";
import { EmailService } from "../email/email.service";

@Injectable()
export class SessionsService {
  constructor(
    private readonly emailService: EmailService,
  ) {}

  /* =========================================================
     DEVICE / BROWSER HELPERS
  ========================================================= */

  private getBrowser(
    userAgent?: string,
  ) {
    if (!userAgent) {
      return null;
    }

    if (
      userAgent.includes("Edg/")
    ) {
      return "Microsoft Edge";
    }

    if (
      userAgent.includes("Chrome/")
    ) {
      return "Google Chrome";
    }

    if (
      userAgent.includes("Firefox/")
    ) {
      return "Mozilla Firefox";
    }

    if (
      userAgent.includes("Safari/")
    ) {
      return "Safari";
    }

    return "Unknown browser";
  }

  private getOperatingSystem(
    userAgent?: string,
  ) {
    if (!userAgent) {
      return null;
    }

    if (
      userAgent.includes("Windows")
    ) {
      return "Windows";
    }

    if (
      userAgent.includes("Android")
    ) {
      return "Android";
    }

    if (
      userAgent.includes("iPhone") ||
      userAgent.includes("iPad")
    ) {
      return "iOS";
    }

    if (
      userAgent.includes("Mac OS")
    ) {
      return "macOS";
    }

    if (
      userAgent.includes("Linux")
    ) {
      return "Linux";
    }

    return "Unknown OS";
  }

  private getDeviceName(
    userAgent?: string,
  ) {
    if (!userAgent) {
      return "Unknown device";
    }

    if (
      userAgent.includes("iPhone")
    ) {
      return "iPhone";
    }

    if (
      userAgent.includes("iPad")
    ) {
      return "iPad";
    }

    if (
      userAgent.includes("Android")
    ) {
      return "Android device";
    }

    if (
      userAgent.includes("Windows")
    ) {
      return "Windows PC";
    }

    if (
      userAgent.includes("Macintosh")
    ) {
      return "Mac";
    }

    if (
      userAgent.includes("Linux")
    ) {
      return "Linux device";
    }

    return "Unknown device";
  }

  /* =========================================================
     KNOWN DEVICE CHECK
  ========================================================= */

  private isKnownDevice(
    sessions: Array<{
      deviceName: string;
      browser: string | null;
      operatingSystem: string | null;
    }>,
    deviceName: string,
    browser: string | null,
    operatingSystem: string | null,
  ) {
    return sessions.some(
      (session) =>
        session.deviceName ===
          deviceName &&
        session.browser ===
          browser &&
        session.operatingSystem ===
          operatingSystem,
    );
  }

  /* =========================================================
     CREATE SESSION
  ========================================================= */

  async createSession(
    userId: number,
    data: {
      userAgent?: string;
      ipAddress?: string;
    },
  ) {
    const deviceName =
      this.getDeviceName(
        data.userAgent,
      );

    const browser =
      this.getBrowser(
        data.userAgent,
      );

    const operatingSystem =
      this.getOperatingSystem(
        data.userAgent,
      );

    /*
      Look at all previously recorded sessions,
      including revoked ones.

      This prevents a device from being treated as
      "new" simply because the user previously logged out.
    */
    const previousSessions =
      await db.orm.public.UserSession
        .where({
          userId,
        })
        .all();

    const hasPreviousSessions =
      previousSessions.length >
      0;

    const knownDevice =
      this.isKnownDevice(
        previousSessions,
        deviceName,
        browser,
        operatingSystem,
      );

    const expiresAt =
      new Date(
        Date.now() +
          7 *
            24 *
            60 *
            60 *
            1000,
      ).toISOString();

    const session =
      await db.orm.public.UserSession.create({
        userId,

        deviceName,

        browser,

        operatingSystem,

        userAgent:
          data.userAgent ??
          null,

        ipAddress:
          data.ipAddress ??
          null,

        lastSeenAt:
          new Date()
            .toISOString(),

        expiresAt,

        revokedAt:
          null,
      });

    /* =========================================================
       NEW DEVICE SECURITY ALERT
    ========================================================= */

    if (
      hasPreviousSessions &&
      !knownDevice
    ) {
      const user =
        await db.orm.public.User
          .where({
            id:
              userId,
          })
          .first();

      if (user) {
        const alertMessage =
          [
            "A new device signed in to your Business Nuggets account.",
            "",
            `Device: ${deviceName}`,
            `Browser: ${browser ?? "Unknown"}`,
            `Operating system: ${operatingSystem ?? "Unknown"}`,
            `IP address: ${data.ipAddress ?? "Unknown"}`,
            `Time: ${new Date().toISOString()}`,
            "",
            "If this was you, no action is required.",
          ].join("\n");

        try {
          await this.emailService.sendSecurityAlertEmail(
            user.email,
            alertMessage,
          );
        } catch (error) {
          console.error(
            "Failed to send new-device security alert:",
            error,
          );
        }
      }
    }

    return session;
  }

  /* =========================================================
     VALIDATE SESSION
  ========================================================= */

  async validateSession(
    sessionId: number,
    userId: number,
  ) {
    const session =
      await db.orm.public.UserSession
        .where({
          id:
            sessionId,
        })
        .first();

    if (
      !session ||
      session.userId !==
        userId
    ) {
      throw new UnauthorizedException(
        "Session is invalid",
      );
    }

    if (
      session.revokedAt
    ) {
      throw new UnauthorizedException(
        "Session has been revoked",
      );
    }

    const now =
      Date.now();

    /* =========================================================
       ABSOLUTE SESSION EXPIRY
    ========================================================= */

    if (
      new Date(
        session.expiresAt,
      ).getTime() <=
      now
    ) {
      throw new UnauthorizedException(
        "Session has expired",
      );
    }

    /* =========================================================
       INACTIVITY TIMEOUT
    ========================================================= */

    const settings =
      await db.orm.public.AppSettings.all();

    const sessionTimeoutMinutes =
      settings[0]
        ?.sessionTimeoutMinutes ??
      30;

    const lastSeenAt =
      new Date(
        session.lastSeenAt,
      ).getTime();

    const timeoutMs =
      sessionTimeoutMinutes *
      60 *
      1000;

    if (
      now -
        lastSeenAt >
      timeoutMs
    ) {
      await db.orm.public.UserSession
        .where({
          id:
            sessionId,
        })
        .update({
          revokedAt:
            new Date()
              .toISOString(),
        });

      throw new UnauthorizedException(
        "Session expired due to inactivity",
      );
    }

    /* =========================================================
       UPDATE ACTIVITY
    ========================================================= */

    await db.orm.public.UserSession
      .where({
        id:
          sessionId,
      })
      .update({
        lastSeenAt:
          new Date()
            .toISOString(),
      });

    return session;
  }

  /* =========================================================
     GET USER SESSIONS
  ========================================================= */

  async getUserSessions(
    userId: number,
    currentSessionId?: number,
  ) {
    const sessions =
      await db.orm.public.UserSession
        .where({
          userId,
        })
        .all();

    return sessions
      .filter(
        (session) =>
          !session.revokedAt,
      )
      .sort(
        (a, b) =>
          new Date(
            b.lastSeenAt,
          ).getTime() -
          new Date(
            a.lastSeenAt,
          ).getTime(),
      )
      .map(
        (session) => ({
          id:
            session.id,

          deviceName:
            session.deviceName,

          browser:
            session.browser,

          operatingSystem:
            session.operatingSystem,

          ipAddress:
            session.ipAddress,

          lastSeenAt:
            session.lastSeenAt,

          createdAt:
            session.createdAt,

          expiresAt:
            session.expiresAt,

          current:
            session.id ===
            currentSessionId,
        }),
      );
  }

  /* =========================================================
     REVOKE ONE SESSION
  ========================================================= */

  async revokeSession(
    userId: number,
    sessionId: number,
  ) {
    const session =
      await db.orm.public.UserSession
        .where({
          id:
            sessionId,
        })
        .first();

    if (
      !session ||
      session.userId !==
        userId
    ) {
      throw new NotFoundException(
        "Session not found",
      );
    }

    await db.orm.public.UserSession
      .where({
        id:
          sessionId,
      })
      .update({
        revokedAt:
          new Date()
            .toISOString(),
      });

    return {
      message:
        "Session revoked successfully",
    };
  }

  /* =========================================================
     REVOKE OTHER SESSIONS
  ========================================================= */

  async revokeOtherSessions(
    userId: number,
    currentSessionId: number,
  ) {
    const sessions =
      await db.orm.public.UserSession
        .where({
          userId,
        })
        .all();

    for (
      const session of sessions
    ) {
      if (
        session.id !==
          currentSessionId &&
        !session.revokedAt
      ) {
        await db.orm.public.UserSession
          .where({
            id:
              session.id,
          })
          .update({
            revokedAt:
              new Date()
                .toISOString(),
          });
      }
    }

    return {
      message:
        "Other sessions revoked successfully",
    };
  }

  /* =========================================================
     REVOKE ALL SESSIONS
  ========================================================= */

  async revokeAllSessions(
    userId: number,
  ) {
    const sessions =
      await db.orm.public.UserSession
        .where({
          userId,
        })
        .all();

    for (
      const session of sessions
    ) {
      if (
        !session.revokedAt
      ) {
        await db.orm.public.UserSession
          .where({
            id:
              session.id,
          })
          .update({
            revokedAt:
              new Date()
                .toISOString(),
          });
      }
    }

    return {
      message:
        "All sessions revoked successfully",
    };
  }

  /* =========================================================
     GET CURRENT AUTHENTICATED USER
  ========================================================= */

  async getAuthenticatedUser(
    userId: number,
  ) {
    const user =
      await db.orm.public.User
        .where({
          id:
            userId,
        })
        .first();

    if (!user) {
      throw new UnauthorizedException(
        "User account no longer exists",
      );
    }

    if (
      user.accountStatus ===
      "suspended"
    ) {
      throw new UnauthorizedException(
        "This account is suspended",
      );
    }

    const adminRole =
      user.role ===
      "owner"
        ? "super-admin"
        : user.adminRole ??
          null;

    return {
      id:
        user.id,

      email:
        user.email,

      role:
        user.role,

      adminRole,

      accountStatus:
        user.accountStatus,
    };
  }
}