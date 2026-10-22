import {
  Module,
} from "@nestjs/common";

import {
  APP_GUARD,
} from "@nestjs/core";

import {
  ThrottlerGuard,
  ThrottlerModule,
} from "@nestjs/throttler";

import {
  ScheduleModule,
} from "@nestjs/schedule";

import {
  AppController,
} from "./app.controller";

import {
  AppService,
} from "./app.service";

import {
  UsersModule,
} from "./users/users.module";

import {
  AuthModule,
} from "./auth/auth.module";

import {
  SavedNuggetsModule,
} from "./saved-nuggets/saved-nuggets.module";

import {
  SavedFoldersModule,
} from "./saved-folders/saved-folders.module";

import {
  PlaylistsModule,
} from "./playlists/playlists.module";

import {
  NotesModule,
} from "./notes/notes.module";

import {
  HistoryModule,
} from "./history/history.module";

import {
  FollowingModule,
} from "./following/following.module";

import {
  NuggetsModule,
} from "./nuggets/nuggets.module";

import {
  MediaModule,
} from "./media/media.module";

import {
  ModerationModule,
} from "./moderation/moderation.module";

import {
  AnalyticsModule,
} from "./analytics/analytics.module";

import {
  MobileAppModule,
} from "./mobile-app/mobile-app.module";

import {
  AppSettingsModule,
} from "./app-settings/app-settings.module";

import {
  UserNotificationsModule,
} from "./user-notifications/user-notifications.module";

import {
  AdminModule,
} from "./admin/admin.module";

import {
  PushNotificationsModule,
} from "./push-notifications/push-notifications.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),

    UsersModule,
    AuthModule,

    NuggetsModule,

    SavedNuggetsModule,
    SavedFoldersModule,
    PlaylistsModule,
    NotesModule,
    HistoryModule,
    FollowingModule,
    UserNotificationsModule,
    PushNotificationsModule,
    MediaModule,
    ModerationModule,
    AnalyticsModule,
    MobileAppModule,
    AppSettingsModule,

    AdminModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,

    {
      provide:
        APP_GUARD,

      useClass:
        ThrottlerGuard,
    },
  ],
})
export class AppModule {}