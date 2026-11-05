import {
  Controller,
  Get,
} from "@nestjs/common";

import {
  Throttle,
} from "@nestjs/throttler";

import {
  EmailService,
} from "./email.service";

@Controller("health")
export class EmailController {
  constructor(
    private readonly emailService:
      EmailService,
  ) {}

  @Get("email")
  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  async getEmailStatus() {
    const status =
      await this.emailService.getDeliveryStatus();

    return {
      status:
        status.connected
          ? "ok"
          : "degraded",
    };
  }
}
