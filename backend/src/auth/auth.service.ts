import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";

import * as bcrypt from "bcrypt";

import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

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
  RegisterDto,
} from "./dto/register.dto";

import {
  db,
} from "../prisma/db";

import {
  EmailService,
} from "../email/email.service";

type AdminEmailChallenge = {
  type: "admin-email-otp";
  nonce: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

@Injectable()
export class AuthService {
  private readonly adminEmailCodeMinutes = 10;
  private readonly adminEmailCodeMaxAttempts = 5;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
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

    return this.createAuthenticatedSession(
      user,
      requestInfo,
      "Account created successfully",
    );
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

    const isAdmin =
      user.role === "owner" ||
      user.role === "admin" ||
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

      if (twoFactorAdminsRequired) {
        const challengeToken =
          await this.startAdminEmailChallenge(
            user,
          );

        return {
          message:
            "A verification code was sent to your email address",

          requiresEmailTwoFactor:
            true,

          challengeToken,

          user:
            this.publicUser(
              user,
            ),
        };
      }
    }

    await this.usersService.markLastLogin(
      user.id,
    );

    return this.createAuthenticatedSession(
      user,
      requestInfo,
      "Login successful",
    );
  }

  /* =========================================================
     ADMIN EMAIL 2FA
  ========================================================= */

  private getAdminEmailOtpSecret() {
    const secret =
      process.env.EMAIL_OTP_SECRET ||
      process.env.JWT_SECRET;

    if (!secret) {
      throw new ServiceUnavailableException(
        "Email verification is not configured",
      );
    }

    return secret;
  }

  private hashAdminEmailCode(
    code: string,
    nonce: string,
  ) {
    return createHmac(
      "sha256",
      this.getAdminEmailOtpSecret(),
    )
      .update(
        `${nonce}:${code}`,
      )
      .digest(
        "hex",
      );
  }

  private parseAdminEmailChallenge(
    value: string | null | undefined,
  ): AdminEmailChallenge | null {
    if (!value) {
      return null;
    }

    try {
      const parsed =
        JSON.parse(
          value,
        ) as Partial<AdminEmailChallenge>;

      if (
        parsed.type !==
          "admin-email-otp" ||
        typeof parsed.nonce !==
          "string" ||
        typeof parsed.codeHash !==
          "string" ||
        typeof parsed.expiresAt !==
          "number" ||
        typeof parsed.attempts !==
          "number"
      ) {
        return null;
      }

      return {
        type:
          "admin-email-otp",
        nonce:
          parsed.nonce,
        codeHash:
          parsed.codeHash,
        expiresAt:
          parsed.expiresAt,
        attempts:
          parsed.attempts,
      };
    } catch {
      return null;
    }
  }

  private hashesMatch(
    expectedHash: string,
    actualHash: string,
  ) {
    try {
      const expected =
        Buffer.from(
          expectedHash,
          "hex",
        );

      const actual =
        Buffer.from(
          actualHash,
          "hex",
        );

      return (
        expected.length ===
          actual.length &&
        timingSafeEqual(
          expected,
          actual,
        )
      );
    } catch {
      return false;
    }
  }

  private async clearAdminEmailChallenge(
    userId: number,
  ) {
    await db.orm.public.User
      .where({
        id:
          userId,
      })
      .update({
        twoFactorSecret:
          null,
      });
  }

  private async startAdminEmailChallenge(
    user: any,
  ) {
    const code =
      randomInt(
        0,
        1_000_000,
      )
        .toString()
        .padStart(
          6,
          "0",
        );

    const nonce =
      randomBytes(
        16,
      ).toString(
        "hex",
      );

    const challenge: AdminEmailChallenge = {
      type:
        "admin-email-otp",
      nonce,
      codeHash:
        this.hashAdminEmailCode(
          code,
          nonce,
        ),
      expiresAt:
        Date.now() +
        this.adminEmailCodeMinutes *
          60_000,
      attempts:
        0,
    };

    const challengeToken =
      await this.jwtService.signAsync(
        {
          sub:
            user.id,
          email:
            user.email,
          purpose:
            "admin-email-2fa",
          nonce,
        },
        {
          expiresIn:
            `${this.adminEmailCodeMinutes}m`,
        },
      );

    await db.orm.public.User
      .where({
        id:
          user.id,
      })
      .update({
        twoFactorEnabled:
          true,
        twoFactorSecret:
          JSON.stringify(
            challenge,
          ),
        twoFactorRecoveryCodes:
          [],
      });

    try {
      const result =
        await this.emailService.sendAdminLoginCodeEmail(
          user.email,
          code,
          this.adminEmailCodeMinutes,
        );

      if (
        result.message !==
        "Email sent successfully"
      ) {
        throw new Error(
          result.message,
        );
      }
    } catch (error) {
      await this.clearAdminEmailChallenge(
        user.id,
      );

      console.error(
        "Failed to send admin verification code:",
        error,
      );

      throw new ServiceUnavailableException(
        "Admin email verification is temporarily unavailable",
      );
    }

    return challengeToken;
  }

  private async verifyAdminEmailChallengeToken(
    challengeToken: string,
  ) {
    let payload: {
      sub: number;
      email: string;
      purpose: string;
      nonce: string;
    };

    try {
      payload =
        await this.jwtService.verifyAsync(
          challengeToken,
        );
    } catch {
      throw new UnauthorizedException(
        "Verification session is invalid or has expired. Sign in again.",
      );
    }

    if (
      payload.purpose !==
        "admin-email-2fa" ||
      !payload.nonce
    ) {
      throw new UnauthorizedException(
        "Invalid verification session",
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

    if (
      !user ||
      user.email !==
        payload.email
    ) {
      throw new UnauthorizedException(
        "Invalid verification session",
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
      user.role === "admin" ||
      Boolean(
        user.adminRole,
      );

    if (!isAdmin) {
      throw new UnauthorizedException(
        "This account does not have Admin Console access",
      );
    }

    return {
      user,
      nonce:
        payload.nonce,
    };
  }

  async verifyAdminEmailTwoFactor(
    challengeToken: string,
    code: string,
    requestInfo: {
      userAgent?: string;
      ipAddress?: string;
    },
  ) {
    if (
      !/^\d{6}$/.test(
        code,
      )
    ) {
      throw new BadRequestException(
        "Enter the 6-digit verification code",
      );
    }

    const {
      user,
      nonce,
    } =
      await this.verifyAdminEmailChallengeToken(
        challengeToken,
      );

    const challenge =
      this.parseAdminEmailChallenge(
        user.twoFactorSecret,
      );

    if (
      !challenge ||
      challenge.nonce !==
        nonce
    ) {
      throw new UnauthorizedException(
        "This verification code is no longer valid. Sign in again.",
      );
    }

    if (
      Date.now() >
      challenge.expiresAt
    ) {
      await this.clearAdminEmailChallenge(
        user.id,
      );

      throw new UnauthorizedException(
        "Verification code has expired. Sign in again.",
      );
    }

    if (
      challenge.attempts >=
      this.adminEmailCodeMaxAttempts
    ) {
      await this.clearAdminEmailChallenge(
        user.id,
      );

      throw new UnauthorizedException(
        "Too many invalid verification attempts. Sign in again.",
      );
    }

    const submittedHash =
      this.hashAdminEmailCode(
        code,
        nonce,
      );

    if (
      !this.hashesMatch(
        challenge.codeHash,
        submittedHash,
      )
    ) {
      const attempts =
        challenge.attempts +
        1;

      await db.orm.public.User
        .where({
          id:
            user.id,
        })
        .update({
          twoFactorSecret:
            attempts >=
            this.adminEmailCodeMaxAttempts
              ? null
              : JSON.stringify({
                  ...challenge,
                  attempts,
                }),
        });

      throw new UnauthorizedException(
        attempts >=
          this.adminEmailCodeMaxAttempts
          ? "Too many invalid verification attempts. Sign in again."
          : "Invalid verification code",
      );
    }

    await this.clearAdminEmailChallenge(
      user.id,
    );

    await this.usersService.markLastLogin(
      user.id,
    );

    return this.createAuthenticatedSession(
      user,
      requestInfo,
      "Login successful",
    );
  }

  async resendAdminEmailTwoFactor(
    challengeToken: string,
  ) {
    const {
      user,
    } =
      await this.verifyAdminEmailChallengeToken(
        challengeToken,
      );

    const newChallengeToken =
      await this.startAdminEmailChallenge(
        user,
      );

    return {
      message:
        "A new verification code was sent to your email address",
      challengeToken:
        newChallengeToken,
    };
  }

  /* =========================================================
     SESSION HELPERS
  ========================================================= */

  private publicUser(
    user: any,
  ) {
    const adminRole =
      user.role === "owner"
        ? "super-admin"
        : user.adminRole ??
          null;

    return {
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
    };
  }

  private async createAuthenticatedSession(
    user: any,
    requestInfo: {
      userAgent?: string;
      ipAddress?: string;
    },
    message: string,
  ) {
    const publicUser =
      this.publicUser(
        user,
      );

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
        adminRole:
          publicUser.adminRole,
        accountStatus:
          user.accountStatus,
        sessionId:
          session.id,
      });

    return {
      message,
      token,
      user:
        publicUser,
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
        process.env.FRONTEND_URL ||
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

  async resetPassword(
    token: string,
    newPassword: string,
  ) {
    if (
      !newPassword ||
      newPassword.length <
        8
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
