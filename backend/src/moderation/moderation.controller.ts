import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";

import {
  JwtAuthGuard,
} from "../auth/jwt-auth.guard";

import {
  ModerationService,
} from "./moderation.service";

@Controller("comments")
export class ModerationController {
  constructor(
    private readonly moderationService:
      ModerationService,
  ) {}

  @Get("nugget/:nuggetId")
  getApprovedComments(
    @Param("nuggetId")
    nuggetId: string,
  ) {
    return this.moderationService.getApprovedForNugget(
      nuggetId,
    );
  }

  @Post()
  @UseGuards(
    JwtAuthGuard,
  )
  createComment(
    @Request()
    req: any,

    @Body()
    body: {
      nuggetId: string;
      body: string;
    },
  ) {
    return this.moderationService.createComment(
      req.user.sub,
      body,
    );
  }

  @Post(":id/report")
  @UseGuards(
    JwtAuthGuard,
  )
  reportComment(
    @Param("id")
    id: string,
  ) {
    return this.moderationService.reportComment(
      Number(id),
    );
  }
}