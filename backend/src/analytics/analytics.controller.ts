import {
  Body,
  Controller,
  Post,
} from "@nestjs/common";

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
  recordEvent(
    @Body()
    body: RecordAnalyticsEventDto,
  ) {
    return this.analyticsService.recordEvent(
      body,
    );
  }
}
