import { LegalPagesService } from "../app-settings/legal-pages.service";
import { UpdateLegalPageDto } from "../app-settings/legal-pages.dto";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";

import {
  AdminPermissionGuard,
  RequireAdminPermission,
} from "../auth/admin-permission.guard";

import { NuggetsService } from "../nuggets/nuggets.service";
import { CreateNuggetDto } from "../nuggets/dto/create-nugget.dto";
import { UpdateNuggetDto } from "../nuggets/dto/update-nugget.dto";

import { ScriptureService } from "../scripture/scripture.service";
import { ScheduleService } from "../schedule/schedule.service";
import { UsersService } from "../users/users.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { ModerationService } from "../moderation/moderation.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { MobileAppService } from "../mobile-app/mobile-app.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RolesAccessService } from "../roles-access/roles-access.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { AppSettingsService } from "../app-settings/app-settings.service";
import { TopicsService } from "../topics/topics.service";
import { EmailService } from "../email/email.service";
import { AdminAuditInterceptor } from "../audit-logs/admin-audit.interceptor";
import {AdminIpAllowListGuard,} from "./admin-ip-allow-list.guard";

@Controller("admin")
@UseGuards(
  JwtAuthGuard,
  AdminGuard,
  AdminPermissionGuard,
  AdminIpAllowListGuard,
)
@UseInterceptors(
  AdminAuditInterceptor,
)
export class AdminController {
  constructor(
    private readonly nuggetsService: NuggetsService,
    private readonly topicsService: TopicsService,
    private readonly scriptureService: ScriptureService,
    private readonly scheduleService: ScheduleService,
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly moderationService: ModerationService,
    private readonly analyticsService: AnalyticsService,
    private readonly mobileAppService: MobileAppService,
    private readonly notificationsService: NotificationsService,
    private readonly rolesAccessService: RolesAccessService,
    private readonly auditLogsService: AuditLogsService,
    private readonly appSettingsService: AppSettingsService,
    private readonly legalPagesService: LegalPagesService,
    private readonly emailService: EmailService,
  ) {}

  /* =========================================
     ADMIN TEST
  ========================================= */

  @Get("test")
  testAdminAccess(
    @Request() req: any,
  ) {
    return {
      message:
        "Admin access granted",

      user: {
        id:
          req.user.sub,

        email:
          req.user.email,

        role:
          req.user.role,

        adminRole:
          req.user.adminRole,
      },
    };
  }

  /* =========================================
     NUGGETS
  ========================================= */

  @Post("nuggets")
  @RequireAdminPermission(
    "manageNuggets",
  )
  createNugget(
    @Body()
    dto: CreateNuggetDto,
  ) {
    return this.nuggetsService.createNugget(
      dto,
    );
  }

  @Get("nuggets")
  @RequireAdminPermission(
    "manageNuggets",
  )
  getAllNuggets() {
    return this.nuggetsService.getAllNuggetsForAdmin();
  }

  @Patch("nuggets/:id")
  @RequireAdminPermission(
    "manageNuggets",
  )
  updateNugget(
    @Param("id")
    id: string,

    @Body()
    dto: UpdateNuggetDto,
  ) {
    return this.nuggetsService.updateNugget(
      id,
      dto,
    );
  }

  @Delete("nuggets/:id")
  @RequireAdminPermission(
    "manageNuggets",
  )
  deleteNugget(
    @Param("id")
    id: string,
  ) {
    return this.nuggetsService.deleteNugget(
      id,
    );
  }

  /* =========================================
     TOPICS
  ========================================= */

  @Get("topics")
  @RequireAdminPermission(
    "manageNuggets",
  )
  getTopics() {
    return this.topicsService.getAllTopics();
  }

  @Post("topics")
  @RequireAdminPermission(
    "manageNuggets",
  )
  createTopic(
    @Body()
    body: {
      name: string;
      description?: string;
      visible?: boolean;
    },
  ) {
    return this.topicsService.createTopic(
      body,
    );
  }

  @Patch("topics/reorder")
  @RequireAdminPermission(
    "manageNuggets",
  )
  reorderTopics(
    @Body()
    body: {
      ids: number[];
    },
  ) {
    return this.topicsService.reorderTopics(
      body.ids,
    );
  }

  @Patch("topics/:id")
  @RequireAdminPermission(
    "manageNuggets",
  )
  updateTopic(
    @Param("id")
    id: string,

    @Body()
    body: {
      name?: string;
      description?: string;
      visible?: boolean;
      displayOrder?: number;
    },
  ) {
    return this.topicsService.updateTopic(
      Number(id),
      body,
    );
  }

  /* =========================================
     SCRIPTURE
  ========================================= */

  @Get("scripture")
  @RequireAdminPermission(
    "manageNuggets",
  )
  getScriptureIndex() {
    return this.scriptureService.getIndex();
  }

  @Post("scripture/books")
  @RequireAdminPermission(
    "manageNuggets",
  )
  createScriptureBook(
    @Body()
    body: {
      name: string;
      chapterCount?: number;
    },
  ) {
    return this.scriptureService.createBook(
      body,
    );
  }

  @Patch(
    "scripture/books/:id",
  )
  @RequireAdminPermission(
    "manageNuggets",
  )
  updateScriptureBook(
    @Param("id")
    id: string,

    @Body()
    body: {
      name?: string;
      chapterCount?: number;
      visible?: boolean;
      displayOrder?: number;
    },
  ) {
    return this.scriptureService.updateBook(
      Number(id),
      body,
    );
  }

  /* =========================================
     SCHEDULE
  ========================================= */

  @Get("schedule")
  @RequireAdminPermission(
    "manageNuggets",
  )
  getSchedule() {
    return this.scheduleService.getSchedule();
  }

  @Post("schedule")
  @RequireAdminPermission(
    "manageNuggets",
  )
  createSchedule(
    @Body()
    body: {
      nuggetId: string;
      scheduledFor: string;
    },
  ) {
    return this.scheduleService.createSchedule(
      body,
    );
  }

  @Patch("schedule/:id")
  @RequireAdminPermission(
    "manageNuggets",
  )
  updateSchedule(
    @Param("id")
    id: string,

    @Body()
    body: {
      nuggetId: string;
      scheduledFor: string;
    },
  ) {
    return this.scheduleService.updateSchedule(
      Number(id),
      body,
    );
  }

  @Delete("schedule/:id")
  @RequireAdminPermission(
    "manageNuggets",
  )
  deleteSchedule(
    @Param("id")
    id: string,
  ) {
    return this.scheduleService.deleteSchedule(
      Number(id),
    );
  }

  @Post(
    "schedule/auto-fill",
  )
  @RequireAdminPermission(
    "manageNuggets",
  )
  autoFillSchedule() {
    return this.scheduleService.autoFillWeek();
  }

  /* =========================================
     USERS
  ========================================= */

  @Get("users")
  @RequireAdminPermission(
    "manageUsers",
  )
  getAdminUsers() {
    return this.usersService.getAllUsersForAdmin();
  }

  @Post("users")
  @RequireAdminPermission(
    "manageUsers",
  )
  createAdminUser(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      membershipTier?: string;
      accountStatus?: string;
    },
  ) {
    return this.usersService.createUserForAdmin(
      body,
    );
  }

  @Patch("users/:id")
  @RequireAdminPermission(
    "manageUsers",
  )
  updateAdminUser(
    @Param("id")
    id: string,

    @Body()
    body: {
      name?: string;
      email?: string;
      role?: string;
      membershipTier?: string;
      accountStatus?: string;
    },
  ) {
    return this.usersService.updateUserForAdmin(
      Number(id),
      body,
    );
  }

  /* =========================================
     SUBSCRIPTIONS
  ========================================= */

  @Get("subscriptions")
  @RequireAdminPermission(
    "billing",
  )
  getSubscriptions() {
    return this.subscriptionsService.getOverview();
  }

  @Post(
    "subscriptions/plans",
  )
  @RequireAdminPermission(
    "billing",
  )
  createSubscriptionPlan(
    @Body()
    body: {
      name: string;
      slug: string;
      priceCents: number;
      currency?: string;
      billingCycle: string;
      features?: string[];
    },
  ) {
    return this.subscriptionsService.createPlan(
      body,
    );
  }

  @Patch(
    "subscriptions/plans/:id",
  )
  @RequireAdminPermission(
    "billing",
  )
  updateSubscriptionPlan(
    @Param("id")
    id: string,

    @Body()
    body: {
      name?: string;
      priceCents?: number;
      currency?: string;
      billingCycle?: string;
      features?: string[];
      active?: boolean;
    },
  ) {
    return this.subscriptionsService.updatePlan(
      Number(id),
      body,
    );
  }

  /* =========================================
     MODERATION
  ========================================= */

  @Get("moderation")
  @RequireAdminPermission(
    "moderateComments",
  )
  getModerationQueue() {
    return this.moderationService.getAdminComments();
  }

  @Patch(
    "moderation/:id/status",
  )
  @RequireAdminPermission(
    "moderateComments",
  )
  updateModerationStatus(
    @Param("id")
    id: string,

    @Body()
    body: {
      status:
        | "pending"
        | "approved"
        | "flagged"
        | "rejected";
    },
  ) {
    return this.moderationService.updateStatus(
      Number(id),
      body.status,
    );
  }

  @Patch(
    "moderation/:id/reply",
  )
  @RequireAdminPermission(
    "moderateComments",
  )
  replyToComment(
    @Param("id")
    id: string,

    @Body()
    body: {
      reply: string;
    },
  ) {
    return this.moderationService.reply(
      Number(id),
      body.reply,
    );
  }

  @Post(
    "moderation/bulk",
  )
  @RequireAdminPermission(
    "moderateComments",
  )
  bulkModeration(
    @Body()
    body: {
      ids: number[];

      action:
        | "approve"
        | "reject"
        | "pending";
    },
  ) {
    return this.moderationService.bulkAction(
      body.ids,
      body.action,
    );
  }

  /* =========================================
     ANALYTICS
  ========================================= */

  @Get("analytics")
  @RequireAdminPermission(
    "viewAnalytics",
  )
  getAnalytics(
    @Query("days")
    days?: string,
  ) {
    return this.analyticsService.getAdminAnalytics(
      Number(days) || 30,
    );
  }

  /* =========================================
     MOBILE
  ========================================= */

  @Get("mobile")
  @RequireAdminPermission(
    "manageMobile",
  )
  getMobileAppConfig() {
    return this.mobileAppService.getConfig();
  }

  @Patch(
    "mobile/settings",
  )
  @RequireAdminPermission(
    "manageMobile",
  )
  publishMobileSettings(
    @Body()
    body: {
      forceUpdate?: boolean;
      maintenanceMode?: boolean;
      offlineReading?: boolean;
      dailyNuggetWidget?: boolean;
      homeBannerTitle?: string;
    },
  ) {
    return this.mobileAppService.publishSettings(
      body,
    );
  }

  @Patch(
    "mobile/onboarding/:id",
  )
  @RequireAdminPermission(
    "manageMobile",
  )
  updateMobileOnboarding(
    @Param("id")
    id: string,

    @Body()
    body: {
      title?: string;
      description?: string;
    },
  ) {
    return this.mobileAppService.updateOnboarding(
      Number(id),
      body,
    );
  }

  @Patch(
    "mobile/versions/:id",
  )
  @RequireAdminPermission(
    "manageMobile",
  )
  updateMobileVersion(
    @Param("id")
    id: string,

    @Body()
    body: {
      version?: string;
      installCount?: number;
      status?: string;
    },
  ) {
    return this.mobileAppService.updateVersion(
      Number(id),
      body,
    );
  }

  /* =========================================
     NOTIFICATIONS
  ========================================= */

  @Get("notifications")
  @RequireAdminPermission(
    "manageNotifications",
  )
  getNotificationCampaigns() {
    return this.notificationsService.getCampaigns();
  }

  @Post("notifications")
  @RequireAdminPermission(
    "manageNotifications",
  )
  createNotificationCampaign(
    @Body()
    body: {
      title: string;
      message: string;
      channel?: "in-app";
      audience: string;
      platform: string;
      sendAt?: string;
    },
  ) {
    return this.notificationsService.createCampaign(
      body,
    );
  }

  @Patch(
    "notifications/:id/status",
  )
  @RequireAdminPermission(
    "manageNotifications",
  )
  updateNotificationStatus(
    @Param("id")
    id: string,

    @Body()
    body: {
      status: string;
    },
  ) {
    return this.notificationsService.updateStatus(
      Number(id),
      body.status,
    );
  }

  /* =========================================
     ADMIN ROLES
  ========================================= */

  @Post("roles/admins")
@RequireAdminPermission(
  "manageAdmins",
)
async createAdminAccount(
  @Body()
  body: {
    name: string;
    email: string;
    password: string;

    adminRole:
      | "super-admin"
      | "editor"
      | "moderator"
      | "support";
  },
) {
  const admin =
    await this.rolesAccessService.createAdmin(
      body,
    );

  const frontendUrl =
    (
      process.env.FRONTEND_URL ||
      "http://localhost:3000"
    ).replace(
      /\/$/,
      "",
    );

  const loginUrl =
    `${frontendUrl}/login`;

  try {
    await this.emailService.sendAdminInviteEmail(
      body.email,
      body.name,
      loginUrl,
    );
  } catch (error) {
    console.error(
      "Failed to send admin invitation email:",
      error,
    );
  }

  return admin;
}
  /* =========================================
     AUDIT LOGS
  ========================================= */

  @Get("audit-logs")
  @RequireAdminPermission(
    "viewAuditLogs",
  )
  getAuditLogs() {
    return this.auditLogsService.getLogs();
  }

  /* =========================================
     SETTINGS
  ========================================= */

  @Get(["settings/legal/:slug", "settings/pages/:slug"])
  @RequireAdminPermission("settings")
  getLegalPage(@Param("slug") slug: string) {
    return this.legalPagesService.getPage(slug);
  }

  @Patch(["settings/legal/:slug", "settings/pages/:slug"])
  @RequireAdminPermission("settings")
  updateLegalPage(@Param("slug") slug: string, @Body() body: UpdateLegalPageDto) {
    return this.legalPagesService.updatePage(slug, body);
  }

  @Get("settings")
  @RequireAdminPermission(
    "settings",
  )
  getAdminSettings() {
    return this.appSettingsService.getSettings();
  }

  @Patch(
    "settings/general",
  )
  @RequireAdminPermission(
    "settings",
  )
  updateGeneralSettings(
    @Body()
    body: {
      siteName?: string;
      tagline?: string;
      supportEmail?: string;
      timezone?: string;
      defaultLanguage?: string;
      dailyPublishTime?: string;
    },
  ) {
    return this.appSettingsService.updateGeneral(
      body,
    );
  }

  @Patch(
    "settings/security",
  )
  @RequireAdminPermission(
    "settings",
  )
  updateSecuritySettings(
    @Body()
    body: {
      twoFactorAdmins?: boolean;
      sessionTimeoutMinutes?: number;
      ipAllowListEnabled?: boolean;
      ipAllowList?: string[];
    },
  ) {
    return this.appSettingsService.updateSecurity(
      body,
    );
  }

  @Patch(
    "settings/maintenance",
  )
  @RequireAdminPermission(
    "settings",
  )
  updateMaintenanceMode(
    @Body()
    body: {
      enabled: boolean;
    },
  ) {
    return this.appSettingsService.setMaintenanceMode(
      body.enabled,
    );
  }
}