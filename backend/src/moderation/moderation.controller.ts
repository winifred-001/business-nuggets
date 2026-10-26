import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import {
  JwtAuthGuard,
} from "../auth/jwt-auth.guard";

import {
  ModerationService,
} from "./moderation.service";
import {
  CreateCommentDto,
} from "./dto/create-comment.dto";

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
    body: CreateCommentDto,
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
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  reportComment(
    @Request()
    req: any,

    @Param("id", ParseIntPipe)
    id: number,
  ) {
    return this.moderationService.reportComment(
      id,
      req.user.sub,
    );
  }
}
