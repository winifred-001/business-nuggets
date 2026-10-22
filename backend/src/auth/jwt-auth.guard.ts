import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import {
  JwtService,
} from "@nestjs/jwt";

import {
  SessionsService,
} from "./sessions.service";

@Injectable()
export class JwtAuthGuard
  implements CanActivate
{
  constructor(
    private readonly jwtService:
      JwtService,

    private readonly sessionsService:
      SessionsService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ) {
    const request =
      context
        .switchToHttp()
        .getRequest();

    const authHeader =
      request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        "No token provided",
      );
    }

    const [
      type,
      token,
    ] =
      authHeader.split(" ");

    if (
      type !== "Bearer" ||
      !token
    ) {
      throw new UnauthorizedException(
        "Invalid token format",
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync(
          token,
          {
            secret:
              process.env.JWT_SECRET,
          },
        );

      if (
        !payload.sessionId
      ) {
        throw new UnauthorizedException(
          "Session information is missing. Please log in again.",
        );
      }

      await this.sessionsService.validateSession(
        Number(
          payload.sessionId,
        ),
        Number(
          payload.sub,
        ),
      );

      const user =
        await this.sessionsService.getAuthenticatedUser(
          Number(
            payload.sub,
          ),
        );

      request.user = {
        ...payload,

        sub:
          user.id,

        email:
          user.email,

        role:
          user.role,

        adminRole:
          user.adminRole,

        accountStatus:
          user.accountStatus,

        sessionId:
          Number(
            payload.sessionId,
          ),
      };

      return true;
    } catch (error) {
      if (
        error instanceof
        UnauthorizedException
      ) {
        throw error;
      }

      throw new UnauthorizedException(
        "Invalid or expired token",
      );
    }
  }
}