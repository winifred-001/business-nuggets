import {
  Controller,
  Get,
} from "@nestjs/common";

import {
  AppSettingsService,
} from "./app-settings.service";

@Controller("settings")
export class AppSettingsController {
  constructor(
    private readonly appSettingsService:
      AppSettingsService,
  ) {}

  @Get("public")
  getPublicSettings() {
    return this.appSettingsService.getPublicSettings();
  }
}