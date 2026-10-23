import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";

import { Reflector } from "@nestjs/core";

import {
  AdminPermission,
  AdminRole,
  getAdminPermissionMatrix,
} from "./admin-permissions";

const ADMIN_PERMISSION_KEY =
  "adminPermission";

export const RequireAdminPermission = (
  permission: AdminPermission,
) =>
  SetMetadata(
    ADMIN_PERMISSION_KEY,
    permission,
  );

@Injectable()
export class AdminPermissionGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ) {
    const requiredPermission =
      this.reflector.getAllAndOverride<
        AdminPermission | undefined
      >(
        ADMIN_PERMISSION_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (!requiredPermission) {
      return true;
    }

    const request =
      context
        .switchToHttp()
        .getRequest();

    const user =
      request.user;

    if (!user) {
      throw new ForbiddenException(
        "User not authenticated",
      );
    }

    let adminRole:
      | AdminRole
      | null = null;

    if (
      user.role === "owner"
    ) {
      adminRole =
        "super-admin";
    } else if (
      user.role === "admin"
    ) {
      adminRole =
        user.adminRole ?? null;
    }

    if (!adminRole) {
      throw new ForbiddenException(
        "Admin role is not configured",
      );
    }

    const permissions =
      await getAdminPermissionMatrix();

    const rolePermissions =
      permissions[adminRole];

    if (!rolePermissions) {
      throw new ForbiddenException(
        "Admin role is not configured",
      );
    }

    const allowed =
      rolePermissions[
        requiredPermission
      ];

    if (!allowed) {
      throw new ForbiddenException(
        "You do not have permission to access this resource",
      );
    }

    return true;
  }
}
