import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../prisma/db";

@Injectable()
export class AppSettingsService {
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
  }) {
    const settings =
      await this.ensureSettings();

    if (
      data.sessionTimeoutMinutes !==
      undefined
    ) {
      if (
        data.sessionTimeoutMinutes <
          5 ||
        data.sessionTimeoutMinutes >
          1440
      ) {
        throw new BadRequestException(
          "Session timeout must be between 5 and 1440 minutes",
        );
      }
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