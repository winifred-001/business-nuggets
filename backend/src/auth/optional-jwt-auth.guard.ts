import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";

import {
  JwtAuthGuard,
} from "./jwt-auth.guard";

@Injectable()
export class OptionalJwtAuthGuard
  implements CanActivate
{
  constructor(
    private readonly jwtAuthGuard:
      JwtAuthGuard,
  ) {}

  canActivate(
    context: ExecutionContext,
  ) {
    const request =
      context
        .switchToHttp()
        .getRequest();

    const authorization =
      request.headers
        .authorization;

    if (!authorization) {
      return true;
    }

    return this.jwtAuthGuard.canActivate(
      context,
    );
  }
}
