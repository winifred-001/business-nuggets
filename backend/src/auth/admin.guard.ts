import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { db } from "../prisma/db";

@Injectable()
export class AdminGuard
  implements CanActivate
{
  async canActivate(
    context:
      ExecutionContext,
  ) {
    const request =
      context
        .switchToHttp()
        .getRequest();

    const tokenUser =
      request.user;

    if (!tokenUser) {
      throw new ForbiddenException(
        "User not authenticated",
      );
    }

    const userId = Number(
      tokenUser.sub ??
        tokenUser.id,
    );

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      throw new ForbiddenException(
        "Invalid admin session",
      );
    }

    const currentUser =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .first();

    if (!currentUser) {
      throw new ForbiddenException(
        "Admin account no longer exists",
      );
    }

    const allowedRoles = [
      "owner",
      "admin",
    ];

    if (
      !allowedRoles.includes(
        currentUser.role,
      )
    ) {
      throw new ForbiddenException(
        "Admin access required",
      );
    }

    if (
      currentUser.accountStatus ===
      "suspended"
    ) {
      throw new ForbiddenException(
        "Admin account is suspended",
      );
    }

    request.user = {
      ...tokenUser,
      id: currentUser.id,
      sub: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      adminRole:
        currentUser.role ===
        "owner"
          ? "super-admin"
          : currentUser.adminRole,
      accountStatus:
        currentUser.accountStatus,
    };

    return true;
  }
}
