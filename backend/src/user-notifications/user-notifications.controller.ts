import {
  Controller,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Request,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";

import {
  UserNotificationsService,
} from "./user-notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class UserNotificationsController {
  constructor(
    private readonly userNotificationsService:
      UserNotificationsService,
  ) {}

  /* =========================================================
     GET MY NOTIFICATIONS
  ========================================================= */

  @Get()
  getNotifications(
    @Request() req: any,
  ) {
    return this.userNotificationsService.getNotifications(
      req.user.sub,
    );
  }

  /* =========================================================
     GET UNREAD COUNT
  ========================================================= */

  @Get("unread-count")
  getUnreadCount(
    @Request() req: any,
  ) {
    return this.userNotificationsService.getUnreadCount(
      req.user.sub,
    );
  }

  /* =========================================================
     MARK ALL AS READ
  ========================================================= */

  @Patch("read-all")
  markAllAsRead(
    @Request() req: any,
  ) {
    return this.userNotificationsService.markAllAsRead(
      req.user.sub,
    );
  }

  /* =========================================================
     MARK ONE AS READ
  ========================================================= */

  @Patch(":id/read")
  markAsRead(
    @Request() req: any,

    @Param(
      "id",
      ParseIntPipe,
    )
    id: number,
  ) {
    return this.userNotificationsService.markAsRead(
      req.user.sub,
      id,
    );
  }
}