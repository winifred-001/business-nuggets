import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SavedNuggetsModule } from './saved-nuggets/saved-nuggets.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { NotesModule } from './notes/notes.module';
import { HistoryModule } from './history/history.module';
import { FollowingModule } from './following/following.module';
import {AdminModule} from "./admin/admin.module";
import {NuggetsModule} from "./nuggets/nuggets.module";

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
  
    UsersModule,
    AuthModule,
    SavedNuggetsModule,
    PlaylistsModule,
    NotesModule,
    HistoryModule,
    FollowingModule,
    AdminModule,
    NuggetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
