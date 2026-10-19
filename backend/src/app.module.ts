import { Module } from "@nestjs/common";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";

import { SavedNuggetsModule } from "./saved-nuggets/saved-nuggets.module";
import { SavedFoldersModule } from "./saved-folders/saved-folders.module";
import { PlaylistsModule } from "./playlists/playlists.module";
import { NotesModule } from "./notes/notes.module";
import { HistoryModule } from "./history/history.module";
import { FollowingModule } from "./following/following.module";

import { NuggetsModule } from "./nuggets/nuggets.module";

import { MediaModule } from "./media/media.module";
import { ModerationModule } from "./moderation/moderation.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { MobileAppModule } from "./mobile-app/mobile-app.module";
import { AppSettingsModule } from "./app-settings/app-settings.module";
import {UserNotificationsModule,} from "./user-notifications/user-notifications.module";
import { AdminModule } from "./admin/admin.module";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
    MediaModule,
    ModerationModule,
    AnalyticsModule,
    MobileAppModule,
    AppSettingsModule,

    AdminModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}