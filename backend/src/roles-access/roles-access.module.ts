import {
  Module,
} from "@nestjs/common";

import {
  AuthModule,
} from "../auth/auth.module";

import {
  AppSettingsModule,
} from "../app-settings/app-settings.module";

import {
  AdminIpAllowListGuard,
} from "../admin/admin-ip-allow-list.guard";

import {
  RolesAccessController,
} from "./roles-access.controller";

import {
  RolesAccessService,
} from "./roles-access.service";

@Module({
  imports: [
    AuthModule,
    AppSettingsModule,
  ],

  controllers: [
    RolesAccessController,
  ],

  providers: [
    RolesAccessService,
    AdminIpAllowListGuard,
  ],

  exports: [
    RolesAccessService,
  ],
})
export class RolesAccessModule {}
