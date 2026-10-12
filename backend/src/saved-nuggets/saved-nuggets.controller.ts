import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  Delete,
  Param,
} from "@nestjs/common";
import { SavedNuggetsService } from "./saved-nuggets.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("saved-nuggets")
@UseGuards(JwtAuthGuard)
export class SavedNuggetsController {
  constructor(
    private readonly savedNuggetsService: SavedNuggetsService,
  ) {}

  @Post()
  saveNugget(
    @Request() req: any,
    @Body() body: { nuggetId: string },
  ) {
    return this.savedNuggetsService.saveNugget(
      req.user.sub,
      body.nuggetId,
    );
  }

  @Get()
  getSavedNuggets(@Request() req: any) {
    return this.savedNuggetsService.getSavedNuggets(
      req.user.sub,
    );
  }

  @Delete(":nuggetId")
 removeSavedNugget(
  @Request() req: any,
  @Param("nuggetId") nuggetId: string,
 ) {
  return this.savedNuggetsService.removeSavedNugget(
    req.user.sub,
    nuggetId,
  );
}
}