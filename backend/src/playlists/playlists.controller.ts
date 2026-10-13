import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { PlaylistsService } from "./playlists.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("playlists")
@UseGuards(JwtAuthGuard)
export class PlaylistsController {
  constructor(
    private readonly playlistsService: PlaylistsService
  ) {}

  @Post()
  createPlaylist(
    @Request() req: any,
    @Body() body: { name: string }
  ) {
    return this.playlistsService.createPlaylist(
      req.user.sub,
      body.name
    );
  }

  @Get()
  getPlaylists(@Request() req: any) {
    return this.playlistsService.getPlaylists(
      req.user.sub
    );
  }

  @Post(":id/items")
  addItem(
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { nuggetId: string }
  ) {
    return this.playlistsService.addItem(
      req.user.sub,
      id,
      body.nuggetId
    );
  }

  @Delete(":id/items/:nuggetId")
  removeItem(
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Param("nuggetId") nuggetId: string
  ) {
    return this.playlistsService.removeItem(
      req.user.sub,
      id,
      nuggetId
    );
  }

  @Delete(":id")
  deletePlaylist(
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number
  ) {
    return this.playlistsService.deletePlaylist(
      req.user.sub,
      id
    );
  }
}