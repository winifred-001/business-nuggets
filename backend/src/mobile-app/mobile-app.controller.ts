import {
  Controller,
  Get,
} from "@nestjs/common";

import {
  MobileAppService,
} from "./mobile-app.service";

@Controller("mobile")
export class MobileAppController {
  constructor(
    private readonly mobileAppService:
      MobileAppService,
  ) {}

  @Get("config")
  getConfig() {
    return this.mobileAppService.getConfig();
  }
}