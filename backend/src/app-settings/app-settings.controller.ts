import { Param } from "@nestjs/common";
import { LegalPagesService } from "./legal-pages.service";
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
    private readonly legalPagesService: LegalPagesService,
  ) {}

  @Get(["legal/:slug", "pages/:slug"])
  getLegalPage(@Param("slug") slug: string) {
    return this.legalPagesService.getPage(slug);
  }

  @Get("branding")
  getBranding() { return this.appSettingsService.getBranding(); }

  @Get("public")
  getPublicSettings() {
    return this.appSettingsService.getPublicSettings();
  }
}