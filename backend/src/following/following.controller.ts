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

import { FollowingService } from "./following.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("following")
@UseGuards(JwtAuthGuard)
export class FollowingController {
  constructor(
    private readonly followingService: FollowingService
  ) {}

  @Post("topics")
  followTopic(
    @Request() req: any,
    @Body() body: { topic: string }
  ) {
    return this.followingService.followTopic(
      req.user.sub,
      body.topic
    );
  }

  @Get("topics")
  getFollowedTopics(@Request() req: any) {
    return this.followingService.getFollowedTopics(
      req.user.sub
    );
  }

  @Delete("topics/:topic")
  unfollowTopic(
    @Request() req: any,
    @Param("topic") topic: string
  ) {
    return this.followingService.unfollowTopic(
      req.user.sub,
      topic
    );
  }
}