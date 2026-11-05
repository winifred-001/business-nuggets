import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";

import { PlaylistsService } from "./playlists.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  PlaylistItemDto,
  PlaylistNameDto,
} from "./dto/playlist.dto";

@Controller("playlists")
@UseGuards(JwtAuthGuard)
export class PlaylistsController {
  constructor(
    private readonly playlistsService: PlaylistsService,
  ) {}

  @Post()
  createPlaylist(
    @Request() req: any,
    @Body() body: PlaylistNameDto,
  ) {
    return this.playlistsService.createPlaylist(
      req.user.sub,
      body,
    );
  }

  @Get()
  getPlaylists(@Request() req: any) {
    return this.playlistsService.getPlaylists(
      req.user.sub,
    );
  }

  @Post(":id/items")
  addItem(
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: PlaylistItemDto,
  ) {
    return this.playlistsService.addItem(
      req.user.sub,
      id,
      body.nuggetId,
    );
  }

  @Patch(":id")
  updatePlaylist(
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: PlaylistNameDto,
  ) {
    return this.playlistsService.updatePlaylist(
      req.user.sub,
      id,
      body,
    );
  }

  @Delete(":id/items/:nuggetId")
  removeItem(
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Param("nuggetId") nuggetId: string,
  ) {
    return this.playlistsService.removeItem(
      req.user.sub,
      id,
      nuggetId,
    );
  }

  @Delete(":id")
  deletePlaylist(
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.playlistsService.deletePlaylist(
      req.user.sub,
      id,
    );
  }
}

@Controller("shared-playlists")
export class SharedPlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get(":token")
  @Header("Cache-Control", "private, no-store")
  getSharedPlaylist(@Param("token") token: string) {
    return this.playlistsService.getSharedPlaylist(token);
  }
}
