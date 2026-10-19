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

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SavedFoldersService } from "./saved-folders.service";

@Controller("saved-folders")
@UseGuards(JwtAuthGuard)
export class SavedFoldersController {
  constructor(
    private readonly savedFoldersService: SavedFoldersService,
  ) {}

  @Post()
  createFolder(
    @Request() req: any,
    @Body()
    body: {
      name: string;
      description?: string;
      nuggetIds?: string[];
    },
  ) {
    return this.savedFoldersService.createFolder(
      req.user.sub,
      body.name,
      body.description,
      body.nuggetIds ?? [],
    );
  }

  @Get()
  getFolders(
    @Request() req: any,
  ) {
    return this.savedFoldersService.getFolders(
      req.user.sub,
    );
  }

  @Post(":id/items")
  addItem(
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Body()
    body: {
      nuggetId: string;
    },
  ) {
    return this.savedFoldersService.addItem(
      req.user.sub,
      id,
      body.nuggetId,
    );
  }

  @Delete(":id/items/:nuggetId")
  removeItem(
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Param("nuggetId") nuggetId: string,
  ) {
    return this.savedFoldersService.removeItem(
      req.user.sub,
      id,
      nuggetId,
    );
  }

  @Delete(":id")
  deleteFolder(
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.savedFoldersService.deleteFolder(
      req.user.sub,
      id,
    );
  }
}