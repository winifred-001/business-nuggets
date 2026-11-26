import { LegalPagesService } from "./legal-pages.service";
import {
  Module,
} from "@nestjs/common";

import {
  AppSettingsController,
} from "./app-settings.controller";

import {
  AppSettingsService,
} from "./app-settings.service";

@Module({
  controllers: [
    AppSettingsController,
  ],

  providers: [
    AppSettingsService,
    LegalPagesService,
  ],

  exports: [
    AppSettingsService,
    LegalPagesService,
  ],
})
export class AppSettingsModule {}