import { CollectionsService } from "../collections/collections.service";
import { CollectionsController } from "../collections/collections.controller";
import { ImportUploadController } from "../imports/import-upload.controller";
import { ImportTicketGuard } from "../imports/import-ticket";
import {
  Module,
} from "@nestjs/common";
import {
  APP_INTERCEPTOR,
} from "@nestjs/core";

import {
  AdminController,
} from "./admin.controller";

import {
  AuthModule,
} from "../auth/auth.module";

import {
  NuggetsModule,
} from "../nuggets/nuggets.module";

import { ScriptureModule } from "../scripture/scripture.module";

import {
  TopicsModule,
} from "../topics/topics.module";

import { ScheduleModule } from "../schedule/schedule.module";
import { UsersModule } from "../users/users.module";
import {
  SubscriptionsModule,
} from "../subscriptions/subscriptions.module";
import {
  ModerationModule,
} from "../moderation/moderation.module";
import {
  AnalyticsModule,
} from "../analytics/analytics.module";
import {
  MobileAppModule,
} from "../mobile-app/mobile-app.module";
import {
  NotificationsModule,
} from "../notifications/notifications.module";
import {
  RolesAccessModule,
} from "../roles-access/roles-access.module";
import {
  AuditLogsModule,
} from "../audit-logs/audit-logs.module";
import {
  AppSettingsModule,
} from "../app-settings/app-settings.module";
import {
  AdminIpAllowListGuard,
} from "./admin-ip-allow-list.guard";
import {
  AdminRequestValidationInterceptor,
} from "./admin-request-validation.interceptor";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [
    AuthModule,
    NuggetsModule,
    TopicsModule,
    ModerationModule,
    SubscriptionsModule,
    ScriptureModule,
    ScheduleModule,
    AuditLogsModule,
    UsersModule,
    AnalyticsModule,
    MobileAppModule,
    NotificationsModule,
    RolesAccessModule,
    AppSettingsModule,
    EmailModule,
  ],

  controllers: [
    AdminController,
    CollectionsController,
    ImportUploadController,
  ],

  providers: [
    AdminIpAllowListGuard,
    CollectionsService,
    ImportTicketGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: AdminRequestValidationInterceptor,
    },
  ],
})
export class AdminModule {}
