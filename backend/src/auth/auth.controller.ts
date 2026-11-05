import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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

import {
  ForgotPasswordDto,
  ResetPasswordDto,
  TwoFactorConfirmRequiredDto,
  TwoFactorSetupRequiredDto,
  TwoFactorTokenDto,
} from "./dto/auth-security.dto";

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

    @Param(
      "id",
      ParseIntPipe,
    )
    id: number,
  ) {
    return this.sessionsService.revokeSession(
      Number(
        req.user.sub,
      ),
      id,
    );
  }

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

  @Post("2fa/confirm")
  @UseGuards(
    JwtAuthGuard,
    AdminGuard,
  )
  confirmTwoFactor(
    @Request()
    req: any,

    @Body()
    body: TwoFactorTokenDto,
  ) {
    return this.twoFactorService.confirmSetup(
      Number(
        req.user.sub,
      ),
      body.token,
    );
  }

  @Post("2fa/setup-required")
  @Throttle({
    default: {
      limit: 5,
      ttl: 10 * 60_000,
    },
  })
  async setupRequiredTwoFactor(
    @Body()
    body: TwoFactorSetupRequiredDto,
  ) {
    const verified =
      await this.authService.verifyTwoFactorSetupToken(
        body.setupToken,
      );

    return this.twoFactorService.beginSetup(
      verified.userId,
    );
  }

  @Post("2fa/confirm-required")
  @Throttle({
    default: {
      limit: 5,
      ttl: 10 * 60_000,
    },
  })
  async confirmRequiredTwoFactor(
    @Body()
    body: TwoFactorConfirmRequiredDto,
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

  @Post("2fa/disable")
  @UseGuards(
    JwtAuthGuard,
    AdminGuard,
  )
  async disableTwoFactor(
    @Request()
    req: any,

    @Body()
    body: TwoFactorTokenDto,
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
    body: ForgotPasswordDto,
  ) {
    return this.authService.requestPasswordReset(
      body.email,
    );
  }

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
    body: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      body.token,
      body.newPassword,
    );
  }
}
