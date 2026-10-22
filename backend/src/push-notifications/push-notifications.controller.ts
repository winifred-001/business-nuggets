import {
  Body,
  Controller,
  Delete,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";

import {
  PushNotificationsService,
} from "./push-notifications.service";

import {
  RegisterPushTokenDto,
} from "./dto/register-push-token.dto";

import {
  UnregisterPushTokenDto,
} from "./dto/unregister-push-token.dto";

@Controller(
  "push-notifications",
)
@UseGuards(
  JwtAuthGuard,
)
export class PushNotificationsController {
  constructor(
    private readonly pushNotificationsService:
      PushNotificationsService,
  ) {}

  @Post("device")
  registerDevice(
    @Request()
    req: any,

    @Body()
    dto: RegisterPushTokenDto,
  ) {
    const userId =
      req.user.id ??
      req.user.sub;

    return this.pushNotificationsService
      .registerDeviceToken(
        Number(
          userId,
        ),
        dto,
      );
  }

  @Delete("device")
  unregisterDevice(
    @Request()
    req: any,

    @Body()
    dto: UnregisterPushTokenDto,
  ) {
    const userId =
      req.user.id ??
      req.user.sub;

    return this.pushNotificationsService
      .unregisterDeviceToken(
        Number(
          userId,
        ),
        dto.token,
      );
  }
}