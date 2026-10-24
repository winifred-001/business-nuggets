import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
  UseInterceptors,
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
  AdminAuditInterceptor,
} from "../audit-logs/admin-audit.interceptor";

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
@UseInterceptors(
  AdminAuditInterceptor,
)
export class RolesAccessController {
  constructor(
    private readonly rolesAccessService:
      RolesAccessService,
  ) {}

  private isSuperAdmin(
    user: any,
  ) {
    return (
      user?.role === "owner" ||
      user?.adminRole ===
        "super-admin"
    );
  }

  @Get()
  @RequireAdminPermission(
    "manageAdmins",
  )
  getAdminRoles() {
    return this.rolesAccessService.getAdminTeam();
  }

  @Get("promotable-users")
  @RequireAdminPermission(
    "manageAdmins",
  )
  getPromotableUsers() {
    return this.rolesAccessService.getPromotableUsers();
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
    if (
      !this.isSuperAdmin(
        req.user,
      )
    ) {
      throw new ForbiddenException(
        "Only a Super Admin can change role permissions",
      );
    }

    return this.rolesAccessService.updateRolePermission(
      body,
    );
  }

  @Patch("users/:id/promote")
  @RequireAdminPermission(
    "manageAdmins",
  )
  promoteUser(
    @Request()
    req: any,

    @Param("id")
    id: string,

    @Body()
    body: {
      adminRole: AdminRole;
    },
  ) {
    return this.rolesAccessService.promoteUser(
      Number(id),
      body.adminRole,
      this.isSuperAdmin(
        req.user,
      ),
    );
  }

  @Patch("admins/:id")
  @RequireAdminPermission(
    "manageAdmins",
  )
  updateAdmin(
    @Request()
    req: any,

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
    const adminId =
      Number(id);

    if (
      Number(
        req.user?.sub,
      ) === adminId
    ) {
      throw new ForbiddenException(
        "You cannot modify your own admin access",
      );
    }

    return this.rolesAccessService.updateAdmin(
      adminId,
      body,
      this.isSuperAdmin(
        req.user,
      ),
    );
  }

  @Patch("admins/:id/demote")
  @RequireAdminPermission(
    "manageAdmins",
  )
  demoteAdmin(
    @Request()
    req: any,

    @Param("id")
    id: string,
  ) {
    const adminId =
      Number(id);

    if (
      Number(
        req.user?.sub,
      ) === adminId
    ) {
      throw new ForbiddenException(
        "You cannot remove your own admin access",
      );
    }

    return this.rolesAccessService.demoteAdmin(
      adminId,
      this.isSuperAdmin(
        req.user,
      ),
    );
  }
}
