import {
  Body,
  Controller,
  Post,
} from "@nestjs/common";

import {
  AnalyticsService,
} from "./analytics.service";

@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly analyticsService:
      AnalyticsService,
  ) {}

  @Post("events")
  recordEvent(
    @Body()
    body: {
      visitorId: string;

      eventType:
        | "view"
        | "read"
        | "share";

      nuggetId?: string;

      platform?: string;

      durationSeconds?: number;

      country?: string;
    },
  ) {
    return this.analyticsService.recordEvent(
      body,
    );
  }
}