import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";
import { NuggetsService } from "../nuggets/nuggets.service";
import { CreateNuggetDto } from "../nuggets/dto/create-nugget.dto";
import { UpdateNuggetDto } from "../nuggets/dto/update-nugget.dto";
import { ScriptureService } from "../scripture/scripture.service";
import { ScheduleService } from "../schedule/schedule.service";
import { UsersService } from "../users/users.service";
import {SubscriptionsService,} from "../subscriptions/subscriptions.service";
import {ModerationService,} from "../moderation/moderation.service";
import {AnalyticsService,} from "../analytics/analytics.service";
import {MobileAppService,} from "../mobile-app/mobile-app.service";
import {NotificationsService,} from "../notifications/notifications.service";
import {RolesAccessService,} from "../roles-access/roles-access.service";
import {AdminAuditInterceptor,} from "../audit-logs/admin-audit.interceptor";
import {AuditLogsService,} from "../audit-logs/audit-logs.service";
import {AppSettingsService,} from "../app-settings/app-settings.service";

import {
  TopicsService,
} from "../topics/topics.service";
@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AdminAuditInterceptor,)
export class AdminController {
  constructor(
    private readonly nuggetsService: NuggetsService,
    private readonly topicsService: TopicsService,
    private readonly scriptureService: ScriptureService,
    private readonly scheduleService:ScheduleService,
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly moderationService:ModerationService,
    private readonly analyticsService:AnalyticsService,
    private readonly mobileAppService: MobileAppService,
    private readonly notificationsService: NotificationsService,
    private readonly rolesAccessService:RolesAccessService,
    private readonly auditLogsService: AuditLogsService,
    private readonly appSettingsService:
  AppSettingsService,
  ) {}

  @Get("test")
  testAdminAccess(@Request() req: any) {
    return {
      message: "Admin access granted",
      user: {
        id: req.user.sub,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }

  @Post("nuggets")
  createNugget(@Body() dto: CreateNuggetDto) {
    return this.nuggetsService.createNugget(dto);
  }

  @Get("nuggets")
  getAllNuggets() {
    return this.nuggetsService.getAllNuggetsForAdmin();
  }

  @Patch("nuggets/:id")
updateNugget(
  @Param("id") id: string,
  @Body() dto: UpdateNuggetDto
) {
  return this.nuggetsService.updateNugget(id, dto);
}

@Delete("nuggets/:id")
deleteNugget(@Param("id") id: string) {
  return this.nuggetsService.deleteNugget(id);
}

@Get("topics")
getTopics() {
  return this.topicsService.getAllTopics();
}

@Post("topics")
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
updateTopic(
  @Param("id") id: string,

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

@Get("scripture")
getScriptureIndex() {
  return this.scriptureService.getIndex();
}

@Post("scripture/books")
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

@Patch("scripture/books/:id")
updateScriptureBook(
  @Param("id") id: string,

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

@Get("schedule")
getSchedule() {
  return this.scheduleService.getSchedule();
}

@Post("schedule")
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
updateSchedule(
  @Param("id") id: string,

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
deleteSchedule(
  @Param("id") id: string,
) {
  return this.scheduleService.deleteSchedule(
    Number(id),
  );
}

@Post("schedule/auto-fill")
autoFillSchedule() {
  return this.scheduleService.autoFillWeek();
}

@Get("users")
getAdminUsers() {
  return this.usersService.getAllUsersForAdmin();
}

@Post("users")
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
updateAdminUser(
  @Param("id") id: string,

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

@Get("subscriptions")
getSubscriptions() {
  return this.subscriptionsService.getOverview();
}

@Post("subscriptions/plans")
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

@Patch("subscriptions/plans/:id")
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

@Get("moderation")
getModerationQueue() {
  return this.moderationService.getAdminComments();
}

@Patch("moderation/:id/status")
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

@Patch("moderation/:id/reply")
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

@Post("moderation/bulk")
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

@Get("analytics")
getAnalytics(
  @Query("days")
  days?: string,
) {
  return this.analyticsService.getAdminAnalytics(
    Number(days) || 30,
  );
}

@Get("mobile")
getMobileAppConfig() {
  return this.mobileAppService.getConfig();
}

@Patch("mobile/settings")
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

@Patch("mobile/onboarding/:id")
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

@Patch("mobile/versions/:id")
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
@Get("notifications")
getNotificationCampaigns() {
  return this.notificationsService.getCampaigns();
}

@Post("notifications")
createNotificationCampaign(
  @Body()
  body: {
    title: string;
    message: string;
    channel?: string;
    audience: string;
    platform: string;
    sendAt?: string;
  },
) {
  return this.notificationsService.createCampaign(
    body,
  );
}

@Patch("notifications/:id/status")
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

@Get("roles")
getAdminRoles() {
  return this.rolesAccessService.getAdminTeam();
}

@Post("roles/admins")
createAdminAccount(
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
  return this.rolesAccessService.createAdmin(
    body,
  );
}

@Patch("roles/admins/:id")
updateAdminAccount(
  @Param("id")
  id: string,

  @Body()
  body: {
    adminRole?:
      | "super-admin"
      | "editor"
      | "moderator"
      | "support";

    accountStatus?:
      | "active"
      | "suspended";
  },
) {
  return this.rolesAccessService.updateAdmin(
    Number(id),
    body,
  );
}

@Get("audit-logs")
getAuditLogs() {
  return this.auditLogsService.getLogs();
}

  @Get("settings")
  getAdminSettings() {
    return this.appSettingsService.getSettings();
  }

  @Patch("settings/general")
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
    return this.appSettingsService.updateGeneral(body);
  }

  @Patch("settings/security")
  updateSecuritySettings(
    @Body()
    body: {
      twoFactorAdmins?: boolean;
      sessionTimeoutMinutes?: number;
      ipAllowListEnabled?: boolean;
    },
  ) {
    return this.appSettingsService.updateSecurity(body);
  }

  @Patch("settings/maintenance")
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