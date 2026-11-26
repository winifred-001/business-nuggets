import { Module } from "@nestjs/common";
import { PlaylistsController, SharedPlaylistsController } from "./playlists.controller";
import { PlaylistsService } from "./playlists.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [PlaylistsController, SharedPlaylistsController],
  providers: [PlaylistsService],
})
export class PlaylistsModule {}