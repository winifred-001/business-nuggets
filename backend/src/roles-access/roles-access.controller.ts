import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";

import {
  JwtAuthGuard,
} from "../auth/jwt-auth.guard";

import {
  AdminGuard,
} from "../auth/admin.guard";

import {
  AdminPermissionGuard,
  RequireAdminPermission,
} from "../auth/admin-permission.guard";

import {
  AdminIpAllowListGuard,
} from "../admin/admin-ip-allow-list.guard";

import {
  RolesAccessService,
} from "./roles-access.service";

import type {
  AdminRole,
} from "../auth/admin-permissions";

@Controller("admin/roles")
@UseGuards(
  JwtAuthGuard,
  AdminGuard,
  AdminPermissionGuard,
  AdminIpAllowListGuard,
)
export class RolesAccessController {
  constructor(
    private readonly rolesAccessService:
      RolesAccessService,
  ) {}

  @Get()
  @RequireAdminPermission(
    "manageAdmins",
  )
  getAdminRoles() {
    return this.rolesAccessService.getAdminTeam();
  }

  @Patch("admins/:id")
  @RequireAdminPermission(
    "manageAdmins",
  )
  updateAdmin(
    @Param("id")
    id: string,

    @Body()
    body: {
      adminRole?: AdminRole;
      accountStatus?:
        | "active"
        | "suspended";
    },
  ) {
    return this.rolesAccessService.updateAdmin(
      Number(id),
      body,
    );
  }
}
