import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UnauthorizedException,
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
  TwoFactorService,
} from "./two-factor.service";

import {
  JwtAuthGuard,
} from "./jwt-auth.guard";

import {
  AdminGuard,
} from "./admin.guard";

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

    private readonly twoFactorService:
      TwoFactorService,
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
       dto.twoFactorToken,
      dto.recoveryCode,
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

  @Delete(
    "sessions/others",
  )
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

  @Delete(
    "sessions/:id",
  )
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
     ADMIN 2FA SETUP
  ========================================================= */

  @Post("2fa/setup")
  @UseGuards(
    JwtAuthGuard,
    AdminGuard,
  )
  setupTwoFactor(
    @Request()
    req: any,
  ) {
    return this.twoFactorService.beginSetup(
      Number(
        req.user.sub,
      ),
    );
  }

  /* =========================================================
     ADMIN 2FA CONFIRM
  ========================================================= */

  @Post("2fa/confirm")
  @UseGuards(
    JwtAuthGuard,
    AdminGuard,
  )
  confirmTwoFactor(
    @Request()
    req: any,

    @Body()
    body: {
      token: string;
    },
  ) {
    return this.twoFactorService.confirmSetup(
      Number(
        req.user.sub,
      ),
      body.token,
    );
  }

  /* =========================================================
   FIRST-TIME ADMIN 2FA SETUP
   Uses temporary setup token - NOT a login token
========================================================= */

@Post("2fa/setup-required")
@Throttle({
  default: {
    limit: 5,
    ttl: 10 * 60_000,
  },
})
async setupRequiredTwoFactor(
  @Body()
  body: {
    setupToken: string;
  },
) {
  const verified =
    await this.authService.verifyTwoFactorSetupToken(
      body.setupToken,
    );

  return this.twoFactorService.beginSetup(
    verified.userId,
  );
}

/* =========================================================
   FIRST-TIME ADMIN 2FA CONFIRM
========================================================= */

@Post("2fa/confirm-required")
@Throttle({
  default: {
    limit: 5,
    ttl: 10 * 60_000,
  },
})
async confirmRequiredTwoFactor(
  @Body()
  body: {
    setupToken: string;
    token: string;
  },
) {
  const verified =
    await this.authService.verifyTwoFactorSetupToken(
      body.setupToken,
    );

  return this.twoFactorService.confirmSetup(
    verified.userId,
    body.token,
  );
}

  /* =========================================================
     ADMIN 2FA DISABLE
  ========================================================= */

  @Post("2fa/disable")
  @UseGuards(
    JwtAuthGuard,
    AdminGuard,
  )
  async disableTwoFactor(
    @Request()
    req: any,

    @Body()
    body: {
      token: string;
    },
  ) {
    const userId =
      Number(
        req.user.sub,
      );

    const valid =
      await this.twoFactorService.verifyCode(
        userId,
        body.token,
      );

    if (!valid) {
      throw new UnauthorizedException(
        "Invalid authentication code",
      );
    }

    return this.twoFactorService.disable(
      userId,
    );
  }

  /* =========================================================
     FORGOT PASSWORD
  ========================================================= */

  @Post(
    "forgot-password",
  )
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

  @Post(
    "reset-password",
  )
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