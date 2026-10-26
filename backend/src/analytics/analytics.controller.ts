import {
  Body,
  Controller,
  Post,
} from "@nestjs/common";
import {
  Throttle,
} from "@nestjs/throttler";

import {
  AnalyticsService,
} from "./analytics.service";
import {
  RecordAnalyticsEventDto,
} from "./dto/record-analytics-event.dto";

@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly analyticsService:
      AnalyticsService,
  ) {}

  @Post("events")
  @Throttle({
    default: {
      limit: 120,
      ttl: 60_000,
    },
  })
  recordEvent(
    @Body()
    body: RecordAnalyticsEventDto,
  ) {
    return this.analyticsService.recordEvent(
      body,
    );
  }
}
