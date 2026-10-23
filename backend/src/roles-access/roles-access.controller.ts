import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Request,
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
  AdminPermission,
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

  @Patch("permissions")
  @RequireAdminPermission(
    "manageAdmins",
  )
  updateRolePermission(
    @Request()
    req: any,

    @Body()
    body: {
      role: AdminRole;
      permission: AdminPermission;
      enabled: boolean;
    },
  ) {
    const isSuperAdmin =
      req.user?.role ===
        "owner" ||
      req.user?.adminRole ===
        "super-admin";

    if (!isSuperAdmin) {
      throw new ForbiddenException(
        "Only a Super Admin can change role permissions",
      );
    }

    return this.rolesAccessService.updateRolePermission(
      body,
    );
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
