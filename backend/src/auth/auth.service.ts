import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import * as bcrypt from "bcrypt";
import { createHash } from "crypto";
import { JwtService } from "@nestjs/jwt";

import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /* =========================================================
     REGISTER
  ========================================================= */

  async register(dto: RegisterDto) {
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

    const adminRole =
      user.role === "owner"
        ? "super-admin"
        : user.adminRole ?? null;

    const token =
      await this.jwtService.signAsync({
        sub: user.id,

        email: user.email,

        role: user.role,

        adminRole,

        accountStatus:
          user.accountStatus,
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
  ) {
    const user =
      await this.usersService.findByEmail(
        email,
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

    await this.usersService.markLastLogin(
      user.id,
    );

    const adminRole =
      user.role === "owner"
        ? "super-admin"
        : user.adminRole ?? null;

    const token =
      await this.jwtService.signAsync({
        sub: user.id,

        email: user.email,

        role: user.role,

        adminRole,

        accountStatus:
          user.accountStatus,
      });

    return {
      message:
        "Login successful",

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
     PASSWORD RESET HELPERS
  ========================================================= */

  private passwordFingerprint(
    passwordHash: string,
  ) {
    return createHash("sha256")
      .update(passwordHash)
      .digest("hex");
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
     * Always return the same response
     * so the endpoint does not expose
     * whether an account exists.
     */
    if (!user) {
      return {
        message,
      };
    }

    const token =
      await this.jwtService.signAsync(
        {
          sub: user.id,

          email: user.email,

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

    /*
     * LOCAL DEVELOPMENT ONLY.
     *
     * Until an email provider is
     * connected, the reset URL is
     * printed in the backend terminal.
     */
    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      console.log(
        "\nPASSWORD RESET LINK:",
        resetUrl,
        "\n",
      );
    }

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

    /*
     * Makes an old reset token invalid
     * after the password has already
     * been changed.
     */
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

    return {
      message:
        "Password reset successfully",
    };
  }
}