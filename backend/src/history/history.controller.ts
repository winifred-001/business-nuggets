import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";

import { HistoryService } from "./history.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("history")
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(
    private readonly historyService: HistoryService
  ) {}

  @Get()
  getHistory(@Request() req: any) {
    return this.historyService.getHistory(
      req.user.sub
    );
  }

  @Post()
  updateHistory(
    @Request() req: any,
    @Body()
    body: {
      nuggetId: string;
      progress?: number;
    }
  ) {
    return this.historyService.updateHistory(
      req.user.sub,
      body.nuggetId,
      body.progress ?? 0
    );
  }

  @Delete(":nuggetId")
  removeHistory(
    @Request() req: any,
    @Param("nuggetId") nuggetId: string
  ) {
    return this.historyService.removeHistory(
      req.user.sub,
      nuggetId
    );
  }
}