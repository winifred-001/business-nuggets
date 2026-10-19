import {
  Module,
} from "@nestjs/common";

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
import {SubscriptionsModule,} from "../subscriptions/subscriptions.module";
import {ModerationModule,} from "../moderation/moderation.module";
import {AnalyticsModule,} from "../analytics/analytics.module";
import {MobileAppModule,} from "../mobile-app/mobile-app.module";
import {NotificationsModule,} from "../notifications/notifications.module";
import {RolesAccessModule,} from "../roles-access/roles-access.module";
import {AuditLogsModule,} from "../audit-logs/audit-logs.module";
import {AppSettingsModule,} from "../app-settings/app-settings.module";

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
  ],

  controllers: [
    AdminController,
  ],
})
export class AdminModule {}