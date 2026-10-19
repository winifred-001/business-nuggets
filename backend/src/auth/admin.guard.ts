import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class AdminGuard
  implements CanActivate
{
  canActivate(
    context:
      ExecutionContext,
  ) {
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

    const allowedRoles = [
      "owner",
      "admin",
    ];

    if (
      !allowedRoles.includes(
        user.role,
      )
    ) {
      throw new ForbiddenException(
        "Admin access required",
      );
    }

    if (
      user.accountStatus ===
      "suspended"
    ) {
      throw new ForbiddenException(
        "Admin account is suspended",
      );
    }

    return true;
  }
}