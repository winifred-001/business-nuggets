import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../prisma/db";

type UpdateSettingsInput = {
  forceUpdate?: boolean;
  maintenanceMode?: boolean;
  offlineReading?: boolean;
  dailyNuggetWidget?: boolean;
  homeBannerTitle?: string;
};

@Injectable()
export class MobileAppService {
  /* =========================================================
     DEFAULT DATA
  ========================================================= */

  private async ensureDefaults() {
    const settings =
      await db.orm.public.MobileAppSettings.all();

    if (settings.length === 0) {
      await db.orm.public.MobileAppSettings.create({
        forceUpdate: false,

        maintenanceMode: false,

        offlineReading: true,

        dailyNuggetWidget: true,

        homeBannerTitle:
          "Command Your Business with Absolute Clarity",

        publishedAt: null,
      });
    }

    const onboarding =
      await db.orm.public.MobileOnboardingScreen.all();

    if (onboarding.length === 0) {
      await db.orm.public.MobileOnboardingScreen.create({
        step: 1,

        title:
          "Welcome",

        description:
          "Welcome to Business Nuggets.",
      });

      await db.orm.public.MobileOnboardingScreen.create({
        step: 2,

        title:
          "Pick Your Topics",

        description:
          "Choose the business and wisdom topics that matter to you.",
      });

      await db.orm.public.MobileOnboardingScreen.create({
        step: 3,

        title:
          "Daily Reminder",

        description:
          "Choose when you want to receive your daily Nugget.",
      });
    }

    /*
     * These are the versions displayed
     * in the supplied admin design.
     *
     * Install counts remain 0 instead
     * of inventing App Store data.
     */

    const versions =
      await db.orm.public.MobileAppVersion.all();

    if (versions.length === 0) {
      await db.orm.public.MobileAppVersion.create({
        platform: "iOS",
        version: "2.4.1",
        installCount: 0,
        status: "live",
      });

      await db.orm.public.MobileAppVersion.create({
        platform: "Android",
        version: "2.4.0",
        installCount: 0,
        status: "live",
      });

      await db.orm.public.MobileAppVersion.create({
        platform: "iOS",
        version: "2.5.0 beta",
        installCount: 0,
        status: "review",
      });
    }
  }

  /* =========================================================
     GET CONFIG
  ========================================================= */

  async getConfig() {
    await this.ensureDefaults();

    const settings =
      await db.orm.public.MobileAppSettings.all();

    const versions =
      await db.orm.public.MobileAppVersion.all();

    const onboarding =
      await db.orm.public.MobileOnboardingScreen.all();

    return {
      settings:
        settings[0] ??
        null,

      versions:
        [...versions].sort(
          (a, b) =>
            a.id -
            b.id,
        ),

      onboarding:
        [...onboarding].sort(
          (a, b) =>
            a.step -
            b.step,
        ),
    };
  }

  /* =========================================================
     PUBLISH SETTINGS
  ========================================================= */

  async publishSettings(
    data: UpdateSettingsInput,
  ) {
    await this.ensureDefaults();

    const settingsList =
      await db.orm.public.MobileAppSettings.all();

    const settings =
      settingsList[0];

    if (!settings) {
      throw new NotFoundException(
        "Mobile app settings not found",
      );
    }

    if (
      data.homeBannerTitle !==
      undefined &&
      !data.homeBannerTitle.trim()
    ) {
      throw new BadRequestException(
        "Banner title cannot be empty",
      );
    }

    const updated =
      await db.orm.public.MobileAppSettings
        .where({
          id: settings.id,
        })
        .update({
          ...(data.forceUpdate !==
            undefined && {
            forceUpdate:
              data.forceUpdate,
          }),

          ...(data.maintenanceMode !==
            undefined && {
            maintenanceMode:
              data.maintenanceMode,
          }),

          ...(data.offlineReading !==
            undefined && {
            offlineReading:
              data.offlineReading,
          }),

          ...(data.dailyNuggetWidget !==
            undefined && {
            dailyNuggetWidget:
              data.dailyNuggetWidget,
          }),

          ...(data.homeBannerTitle !==
            undefined && {
            homeBannerTitle:
              data.homeBannerTitle.trim(),
          }),

          publishedAt:
            new Date().toISOString(),
        });

    if (!updated) {
      throw new NotFoundException(
        "Could not publish mobile settings",
      );
    }

    return updated;
  }

  /* =========================================================
     UPDATE ONBOARDING SCREEN
  ========================================================= */

  async updateOnboarding(
    id: number,
    data: {
      title?: string;
      description?: string;
    },
  ) {
    const screen =
      await db.orm.public.MobileOnboardingScreen
        .where({
          id,
        })
        .first();

    if (!screen) {
      throw new NotFoundException(
        "Onboarding screen not found",
      );
    }

    if (
      data.title !==
        undefined &&
      !data.title.trim()
    ) {
      throw new BadRequestException(
        "Screen title cannot be empty",
      );
    }

    const updated =
      await db.orm.public.MobileOnboardingScreen
        .where({
          id,
        })
        .update({
          ...(data.title !==
            undefined && {
            title:
              data.title.trim(),
          }),

          ...(data.description !==
            undefined && {
            description:
              data.description.trim(),
          }),
        });

    if (!updated) {
      throw new NotFoundException(
        "Could not update onboarding screen",
      );
    }

    return updated;
  }

  /* =========================================================
     UPDATE VERSION DATA
  ========================================================= */

  async updateVersion(
    id: number,
    data: {
      version?: string;
      installCount?: number;
      status?: string;
    },
  ) {
    const version =
      await db.orm.public.MobileAppVersion
        .where({
          id,
        })
        .first();

    if (!version) {
      throw new NotFoundException(
        "Mobile app version not found",
      );
    }

    const updated =
      await db.orm.public.MobileAppVersion
        .where({
          id,
        })
        .update({
          ...(data.version !==
            undefined && {
            version:
              data.version.trim(),
          }),

          ...(data.installCount !==
            undefined && {
            installCount:
              Math.max(
                0,
                data.installCount,
              ),
          }),

          ...(data.status !==
            undefined && {
            status:
              data.status,
          }),
        });

    if (!updated) {
      throw new NotFoundException(
        "Could not update app version",
      );
    }

    return updated;
  }
}