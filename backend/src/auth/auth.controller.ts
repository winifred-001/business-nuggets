import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";

import {
  Throttle,
} from "@nestjs/throttler";

import {
  AuthService,
} from "./auth.service";

import {
  SessionsService,
} from "./sessions.service";

import {
  JwtAuthGuard,
} from "./jwt-auth.guard";

import {
  RegisterDto,
} from "./dto/register.dto";

import {
  LoginDto,
} from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService:
      AuthService,

    private readonly sessionsService:
      SessionsService,
  ) {}

  private getRequestInfo(
    req: any,
  ) {
    const userAgent =
      req.headers[
        "user-agent"
      ];

    const ipAddress =
      req.ip ??
      req.socket
        ?.remoteAddress ??
      undefined;

    return {
      userAgent,
      ipAddress,
    };
  }

  /* =========================================================
     REGISTER
  ========================================================= */

  @Post("register")
  @Throttle({
    default: {
      limit: 3,
      ttl: 60_000,
    },
  })
  register(
    @Body()
    dto: RegisterDto,

    @Request()
    req: any,
  ) {
    return this.authService.register(
      dto,
      this.getRequestInfo(
        req,
      ),
    );
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  @Post("login")
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  login(
    @Body()
    dto: LoginDto,

    @Request()
    req: any,
  ) {
    return this.authService.login(
      dto.email,
      dto.password,
      this.getRequestInfo(
        req,
      ),
    );
  }

  /* =========================================================
     ADMIN EMAIL 2FA VERIFY
  ========================================================= */

  @Post("2fa/verify-email")
  @Throttle({
    default: {
      limit: 5,
      ttl: 10 * 60_000,
    },
  })
  verifyAdminEmailTwoFactor(
    @Body()
    body: {
      challengeToken: string;
      code: string;
    },

    @Request()
    req: any,
  ) {
    return this.authService.verifyAdminEmailTwoFactor(
      body.challengeToken,
      body.code,
      this.getRequestInfo(
        req,
      ),
    );
  }

  /* =========================================================
     ADMIN EMAIL 2FA RESEND
  ========================================================= */

  @Post("2fa/resend-email")
  @Throttle({
    default: {
      limit: 3,
      ttl: 10 * 60_000,
    },
  })
  resendAdminEmailTwoFactor(
    @Body()
    body: {
      challengeToken: string;
    },
  ) {
    return this.authService.resendAdminEmailTwoFactor(
      body.challengeToken,
    );
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  @Post("logout")
  @UseGuards(
    JwtAuthGuard,
  )
  logout(
    @Request()
    req: any,
  ) {
    return this.sessionsService.revokeSession(
      Number(
        req.user.sub,
      ),
      Number(
        req.user.sessionId,
      ),
    );
  }

  /* =========================================================
     SESSIONS
  ========================================================= */

  @Get("sessions")
  @UseGuards(
    JwtAuthGuard,
  )
  getSessions(
    @Request()
    req: any,
  ) {
    return this.sessionsService.getUserSessions(
      Number(
        req.user.sub,
      ),
      Number(
        req.user.sessionId,
      ),
    );
  }

  @Delete("sessions/others")
  @UseGuards(
    JwtAuthGuard,
  )
  revokeOtherSessions(
    @Request()
    req: any,
  ) {
    return this.sessionsService.revokeOtherSessions(
      Number(
        req.user.sub,
      ),
      Number(
        req.user.sessionId,
      ),
    );
  }

  @Delete("sessions/:id")
  @UseGuards(
    JwtAuthGuard,
  )
  revokeSession(
    @Request()
    req: any,

    @Param("id")
    id: string,
  ) {
    return this.sessionsService.revokeSession(
      Number(
        req.user.sub,
      ),
      Number(id),
    );
  }

  /* =========================================================
     FORGOT PASSWORD
  ========================================================= */

  @Post("forgot-password")
  @Throttle({
    default: {
      limit: 3,
      ttl:
        15 *
        60_000,
    },
  })
  forgotPassword(
    @Body()
    body: {
      email: string;
    },
  ) {
    return this.authService.requestPasswordReset(
      body.email,
    );
  }

  /* =========================================================
     RESET PASSWORD
  ========================================================= */

  @Post("reset-password")
  @Throttle({
    default: {
      limit: 5,
      ttl:
        15 *
        60_000,
    },
  })
  resetPassword(
    @Body()
    body: {
      token: string;
      newPassword: string;
    },
  ) {
    return this.authService.resetPassword(
      body.token,
      body.newPassword,
    );
  }
}
