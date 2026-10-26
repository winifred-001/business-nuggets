import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../prisma/db";
import { isIP } from "node:net";
@Injectable()
export class AppSettingsService {
  private brandingTable?: Promise<void>;
  private ensureBrandingTable() {
    if (!this.brandingTable) this.brandingTable = db.runtime().execute(db.raw.sql`
      CREATE TABLE IF NOT EXISTS "SiteBranding" (
        "id" integer PRIMARY KEY CHECK ("id" = 1), "content" text NOT NULL
      )
    `.affectedCount().build()).then(() => undefined).catch(error => { this.brandingTable = undefined; throw error; });
    return this.brandingTable;
  }
  async getBranding() {
    await this.ensureBrandingTable();
    const rows = await db.runtime().query(db.raw.sql`SELECT "content" FROM "SiteBranding" WHERE "id" = 1`
      .returnsRow({ content: "pg/text@1" }).build());
    return rows.length ? JSON.parse(rows[0].content) : { logoUrl: "", faviconUrl: "", socialImageUrl: "" };
  }
  async updateBranding(data: { logoUrl: string; faviconUrl: string; socialImageUrl: string }) {
    for (const value of Object.values(data)) {
      if (!value) continue;
      let url: URL;
      try { url = new URL(value); } catch { throw new BadRequestException("Use a valid HTTPS image URL"); }
      if (url.protocol !== "https:" || url.username || url.password) throw new BadRequestException("Use a public HTTPS image URL without credentials");
    }
    const content = JSON.stringify({ logoUrl: data.logoUrl, faviconUrl: data.faviconUrl, socialImageUrl: data.socialImageUrl });
    await this.ensureBrandingTable();
    await db.runtime().execute(db.raw.sql`INSERT INTO "SiteBranding" ("id", "content") VALUES (1, ${content})
      ON CONFLICT ("id") DO UPDATE SET "content" = EXCLUDED."content"`.affectedCount().build());
    return this.getBranding();
  }
  getConnections() {
    const configured = (...keys: string[]) => keys.every(key => Boolean(process.env[key]?.trim()));
    const key = process.env.PAYSTACK_SECRET_KEY || "";
    // Presence of credentials is configuration, not a live connection/health check.
    return {
      paystack: { configured: configured("PAYSTACK_SECRET_KEY"), mode: key.startsWith("sk_live_") ? "live" : key.startsWith("sk_test_") ? "test" : "unknown" },
      email: { configured: configured("SMTP_HOST", "SMTP_USER", "SMTP_PASS") },
      firebase: { configured: configured("FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY") },
      cloudinary: { configured: configured("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET") },
    };
  }
  private async ensureSettings() {
    const settings =
      await db.orm.public.AppSettings.all();

    if (settings.length > 0) {
      return settings[0];
    }

    const created =
      await db.orm.public.AppSettings.create({
        siteName:
          "Business Nuggets",

        tagline:
          "Command Your Business with Absolute Clarity",

        supportEmail:
          "support@businessnuggets.com",

        timezone:
          "WAT (UTC+1)",

        defaultLanguage:
          "English",

        dailyPublishTime:
          "06:00",

        twoFactorAdmins:
          false,

        sessionTimeoutMinutes:
          30,

        ipAllowListEnabled:
          false,

        maintenanceMode:
          false,
      });

    if (!created) {
      throw new BadRequestException(
        "Could not create application settings",
      );
    }

    return created;
  }

  async getSettings() {
    return this.ensureSettings();
  }

  async getPublicSettings() {
    const settings =
      await this.ensureSettings();

    return {
      siteName:
        settings.siteName,

      tagline:
        settings.tagline,

      supportEmail: settings.supportEmail,

      timezone:
        settings.timezone,

      defaultLanguage:
        settings.defaultLanguage,

      dailyPublishTime:
        settings.dailyPublishTime,

      maintenanceMode:
        settings.maintenanceMode,
    };
  }

  async updateGeneral(data: {
    siteName?: string;
    tagline?: string;
    supportEmail?: string;
    timezone?: string;
    defaultLanguage?: string;
    dailyPublishTime?: string;
  }) {
    const settings =
      await this.ensureSettings();

    if (
      data.siteName !==
        undefined &&
      !data.siteName.trim()
    ) {
      throw new BadRequestException(
        "Site name cannot be empty",
      );
    }

    if (
      data.supportEmail !==
        undefined &&
      !data.supportEmail.includes(
        "@",
      )
    ) {
      throw new BadRequestException(
        "Enter a valid support email",
      );
    }

    if (
      data.dailyPublishTime !==
        undefined &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        data.dailyPublishTime,
      )
    ) {
      throw new BadRequestException(
        "Daily publish time must use HH:MM format",
      );
    }

    const updated =
      await db.orm.public.AppSettings
        .where({
          id: settings.id,
        })
        .update({
          ...(data.siteName !==
            undefined && {
            siteName:
              data.siteName.trim(),
          }),

          ...(data.tagline !==
            undefined && {
            tagline:
              data.tagline.trim(),
          }),

          ...(data.supportEmail !==
            undefined && {
            supportEmail:
              data.supportEmail
                .trim()
                .toLowerCase(),
          }),

          ...(data.timezone !==
            undefined && {
            timezone:
              data.timezone.trim(),
          }),

          ...(data.defaultLanguage !==
            undefined && {
            defaultLanguage:
              data.defaultLanguage.trim(),
          }),

          ...(data.dailyPublishTime !==
            undefined && {
            dailyPublishTime:
              data.dailyPublishTime,
          }),
        });

    if (!updated) {
      throw new NotFoundException(
        "Settings not found",
      );
    }

    return updated;
  }

  async updateSecurity(data: {
  twoFactorAdmins?: boolean;
  sessionTimeoutMinutes?: number;
  ipAllowListEnabled?: boolean;
  ipAllowList?: string[];
}) {
  const settings =
    await this.ensureSettings();

  if (
    data.sessionTimeoutMinutes !==
    undefined
  ) {
    if (
      data.sessionTimeoutMinutes < 5 ||
      data.sessionTimeoutMinutes > 1440
    ) {
      throw new BadRequestException(
        "Session timeout must be between 5 and 1440 minutes",
      );
    }
  }

  let ipAllowList =
    data.ipAllowList;

  if (ipAllowList !== undefined) {
    ipAllowList = [
      ...new Set(
        ipAllowList
          .map((ip) =>
            ip.trim(),
          )
          .filter(Boolean),
      ),
    ];

    for (const ip of ipAllowList) {
      if (isIP(ip) === 0) {
        throw new BadRequestException(
          `Invalid IP address: ${ip}`,
        );
      }
    }
  }

  const effectiveIpAllowList =
    ipAllowList ??
    settings.ipAllowList ??
    [];

  const enableIpAllowList =
    data.ipAllowListEnabled ??
    settings.ipAllowListEnabled;

  if (
    enableIpAllowList &&
    effectiveIpAllowList.length === 0
  ) {
    throw new BadRequestException(
      "Add at least one allowed IP address before enabling the IP allow-list",
    );
  }

  const updated =
    await db.orm.public.AppSettings
      .where({
        id: settings.id,
      })
      .update({
        ...(data.twoFactorAdmins !==
          undefined && {
          twoFactorAdmins:
            data.twoFactorAdmins,
        }),

        ...(data.sessionTimeoutMinutes !==
          undefined && {
          sessionTimeoutMinutes:
            data.sessionTimeoutMinutes,
        }),

        ...(data.ipAllowListEnabled !==
          undefined && {
          ipAllowListEnabled:
            data.ipAllowListEnabled,
        }),

        ...(ipAllowList !==
          undefined && {
          ipAllowList,
        }),
      });

  if (!updated) {
    throw new NotFoundException(
      "Settings not found",
    );
  }

  return updated;
}

  async setMaintenanceMode(
    enabled: boolean,
  ) {
    const settings =
      await this.ensureSettings();

    const updated =
      await db.orm.public.AppSettings
        .where({
          id: settings.id,
        })
        .update({
          maintenanceMode:
            enabled,
        });

    if (!updated) {
      throw new NotFoundException(
        "Settings not found",
      );
    }

    return updated;
  }
}