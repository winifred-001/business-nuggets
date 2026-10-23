import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import * as bcrypt from "bcrypt";

import {
  createHash,
} from "crypto";

import {
  JwtService,
} from "@nestjs/jwt";

import {
  UsersService,
} from "../users/users.service";

import {
  SessionsService,
} from "./sessions.service";

import {
  TwoFactorService,
} from "./two-factor.service";

import {
  RegisterDto,
} from "./dto/register.dto";

import {
  db,
} from "../prisma/db";

import { EmailService } from "../email/email.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService:
      UsersService,

    private readonly jwtService:
      JwtService,

    private readonly sessionsService:
      SessionsService,

    private readonly twoFactorService:
      TwoFactorService,

    private readonly emailService: EmailService,
  ) {}

  /* =========================================================
   REGISTER
========================================================= */

async register(
  dto: RegisterDto,
  requestInfo: {
    userAgent?: string;
    ipAddress?: string;
  },
) {
  const existingUser =
    await this.usersService.findByEmail(
      dto.email,
    );

  if (existingUser) {
    throw new ConflictException(
      "Email already registered",
    );
  }

  const passwordHash =
    await bcrypt.hash(
      dto.password,
      10,
    );

  const user =
    await this.usersService.createUser(
      dto.name,
      dto.email,
      passwordHash,
    );

  /* =========================================================
     WELCOME EMAIL
  ========================================================= */

  try {
    await this.emailService.sendWelcomeEmail(
      user.email,
      user.name,
    );
  } catch (error) {
    console.error(
      "Failed to send welcome email:",
      error,
    );
  }

  const adminRole =
    user.role === "owner"
      ? "super-admin"
      : user.adminRole ?? null;

  const session =
    await this.sessionsService.createSession(
      user.id,
      requestInfo,
    );

  const token =
    await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      adminRole,
      accountStatus:
        user.accountStatus,
      sessionId:
        session.id,
    });

  return {
    message:
      "Account created successfully",

    token,

    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      adminRole,
      accountStatus:
        user.accountStatus,
    },
  };
}

  /* =========================================================
     LOGIN
  ========================================================= */

  async login(
    email: string,
    password: string,

    requestInfo: {
      userAgent?: string;
      ipAddress?: string;
    },

    twoFactorToken?: string,
    recoveryCode?: string,
  ) {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    const user =
      await this.usersService.findByEmail(
        normalizedEmail,
      );

    if (!user) {
      throw new UnauthorizedException(
        "Invalid email or password",
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.passwordHash,
      );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        "Invalid email or password",
      );
    }

    if (
      user.accountStatus ===
      "suspended"
    ) {
      throw new UnauthorizedException(
        "This account is suspended",
      );
    }

    /* =========================================================
       ADMIN 2FA CHECK
    ========================================================= */

    const isAdmin =
      user.role === "owner" ||
      Boolean(
        user.adminRole,
      );

    if (isAdmin) {
      const settings =
        await db.orm.public.AppSettings.all();

      const twoFactorAdminsRequired =
        settings[0]
          ?.twoFactorAdmins ??
        false;

      if (
        twoFactorAdminsRequired
      ) {
        /* =====================================================
           FIRST-TIME ADMIN 2FA SETUP
        ===================================================== */

        if (
          !user.twoFactorEnabled ||
          !user.twoFactorSecret
        ) {
          const setupToken =
            await this.jwtService.signAsync(
              {
                sub:
                  user.id,

                email:
                  user.email,

                purpose:
                  "2fa-setup",
              },
              {
                expiresIn:
                  "10m",
              },
            );

          return {
            message:
              "Two-factor authentication setup is required",

            requiresTwoFactorSetup:
              true,

            setupToken,

            user: {
              id:
                user.id,

              name:
                user.name,

              email:
                user.email,

              role:
                user.role,

              adminRole:
                user.role ===
                "owner"
                  ? "super-admin"
                  : user.adminRole ??
                    null,
            },
          };
        }

        /* =====================================================
           EXISTING ADMIN 2FA
        ===================================================== */

        if (
  !twoFactorToken &&
  !recoveryCode
) {
  throw new UnauthorizedException(
    "Two-factor authentication code or recovery code required",
  );
}

/* =====================================================
   AUTHENTICATOR CODE LOGIN
===================================================== */

if (twoFactorToken) {
  const validTwoFactorCode =
    await this.twoFactorService.verifyCode(
      user.id,
      twoFactorToken,
    );

  if (!validTwoFactorCode) {
    throw new UnauthorizedException(
      "Invalid two-factor authentication code",
    );
  }
}

/* =====================================================
   RECOVERY CODE LOGIN
===================================================== */

else if (recoveryCode) {
  const validRecoveryCode =
    await this.twoFactorService.verifyRecoveryCode(
      user.id,
      recoveryCode,
    );

  if (!validRecoveryCode) {
    throw new UnauthorizedException(
      "Invalid or already used recovery code",
    );
  }
}
      }
    }

    /* =========================================================
       LOGIN SUCCESS
    ========================================================= */

    await this.usersService.markLastLogin(
      user.id,
    );

    const adminRole =
      user.role === "owner"
        ? "super-admin"
        : user.adminRole ??
          null;

    const session =
      await this.sessionsService.createSession(
        user.id,
        requestInfo,
      );

    const token =
      await this.jwtService.signAsync({
        sub:
          user.id,

        email:
          user.email,

        role:
          user.role,

        adminRole,

        accountStatus:
          user.accountStatus,

        sessionId:
          session.id,
      });

    return {
      message:
        "Login successful",

      token,

      user: {
        id:
          user.id,

        name:
          user.name,

        email:
          user.email,

        role:
          user.role,

        adminRole,

        accountStatus:
          user.accountStatus,
      },
    };
  }

  /* =========================================================
     VERIFY TEMPORARY 2FA SETUP TOKEN
  ========================================================= */

  async verifyTwoFactorSetupToken(
    setupToken: string,
  ) {
    let payload: {
      sub: number;
      email: string;
      purpose: string;
    };

    try {
      payload =
        await this.jwtService.verifyAsync(
          setupToken,
        );
    } catch {
      throw new UnauthorizedException(
        "Two-factor setup token is invalid or has expired",
      );
    }

    if (
      payload.purpose !==
      "2fa-setup"
    ) {
      throw new UnauthorizedException(
        "Invalid two-factor setup token",
      );
    }

    const user =
      await db.orm.public.User
        .where({
          id:
            Number(
              payload.sub,
            ),
        })
        .first();

    if (!user) {
      throw new UnauthorizedException(
        "User account no longer exists",
      );
    }

    if (
      user.email !==
      payload.email
    ) {
      throw new UnauthorizedException(
        "Invalid two-factor setup token",
      );
    }

    if (
      user.accountStatus ===
      "suspended"
    ) {
      throw new UnauthorizedException(
        "This account is suspended",
      );
    }

    const isAdmin =
      user.role === "owner" ||
      Boolean(
        user.adminRole,
      );

    if (!isAdmin) {
      throw new UnauthorizedException(
        "Two-factor setup is only available to administrators",
      );
    }

    if (
      user.twoFactorEnabled
    ) {
      throw new BadRequestException(
        "Two-factor authentication is already enabled",
      );
    }

    return {
      userId:
        user.id,

      email:
        user.email,
    };
  }

  /* =========================================================
     PASSWORD RESET HELPERS
  ========================================================= */

  private passwordFingerprint(
    passwordHash: string,
  ) {
    return createHash(
      "sha256",
    )
      .update(
        passwordHash,
      )
      .digest(
        "hex",
      );
  }

  /* =========================================================
   REQUEST PASSWORD RESET
========================================================= */

async requestPasswordReset(
  email: string,
) {
  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  const user =
    await this.usersService.findByEmail(
      normalizedEmail,
    );

  const message =
    "If an account exists for that email, a password reset link has been prepared.";

  /*
    Keep the same generic response whether the email exists
    or not so attackers cannot discover registered accounts.
  */
  if (!user) {
    return {
      message,
    };
  }

  const token =
    await this.jwtService.signAsync(
      {
        sub:
          user.id,

        email:
          user.email,

        purpose:
          "password-reset",

        fingerprint:
          this.passwordFingerprint(
            user.passwordHash,
          ),
      },
      {
        expiresIn:
          "15m",
      },
    );

  const frontendUrl =
    (
      process.env
        .FRONTEND_URL ||
      "http://localhost:3000"
    ).replace(
      /\/$/,
      "",
    );

  const resetUrl =
    `${frontendUrl}/reset-password?token=${encodeURIComponent(
      token,
    )}`;

  await this.emailService.sendPasswordResetEmail(
    user.email,
    resetUrl,
  );

  return {
    message,
  };
}
  /* =========================================================
     RESET PASSWORD
  ========================================================= */

  async resetPassword(
    token: string,
    newPassword: string,
  ) {
    if (
      !newPassword ||
      newPassword.length < 8
    ) {
      throw new BadRequestException(
        "Password must be at least 8 characters.",
      );
    }

    let payload: {
      sub: number;
      email: string;
      purpose: string;
      fingerprint: string;
    };

    try {
      payload =
        await this.jwtService.verifyAsync(
          token,
        );
    } catch {
      throw new BadRequestException(
        "This password reset link is invalid or has expired.",
      );
    }

    if (
      payload.purpose !==
      "password-reset"
    ) {
      throw new BadRequestException(
        "Invalid password reset link.",
      );
    }

    const user =
      await this.usersService.findAuthUserById(
        payload.sub,
      );

    if (!user) {
      throw new BadRequestException(
        "Invalid password reset link.",
      );
    }

    const currentFingerprint =
      this.passwordFingerprint(
        user.passwordHash,
      );

    if (
      currentFingerprint !==
      payload.fingerprint
    ) {
      throw new BadRequestException(
        "This password reset link has already been used.",
      );
    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        10,
      );

    await this.usersService.updatePasswordHash(
  user.id,
  passwordHash,
);

await this.sessionsService.revokeAllSessions(
  user.id,
);

/* =========================================================
   PASSWORD CHANGED EMAIL
========================================================= */

try {
  await this.emailService.sendPasswordChangedEmail(
    user.email,
  );
} catch (error) {
  console.error(
    "Failed to send password changed email:",
    error,
  );
}

return {
  message:
    "Password reset successfully",
};
  }
}