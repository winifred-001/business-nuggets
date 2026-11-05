import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import * as bcrypt from "bcrypt";

import { db } from "../prisma/db";

@Injectable()
export class UsersService {
  /* =========================================================
     SAFE USER SERIALIZATION

     Never return raw User rows from public/admin response paths.
     This allow-list intentionally excludes passwordHash,
     twoFactorSecret and twoFactorRecoveryCodes.
  ========================================================= */

  private toSafeUser(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      adminRole: user.adminRole,
      membershipTier: user.membershipTier,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      accountStatus: user.accountStatus,
      interests: user.interests ?? [],
      wisdomNeeds: user.wisdomNeeds ?? [],
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /* =========================================================
     FIND USER BY EMAIL

     Internal authentication lookup. This intentionally returns
     the raw row because auth needs passwordHash/2FA fields.
  ========================================================= */

  async findByEmail(email: string) {
    return db.orm.public.User
      .where({
        email,
      })
      .first();
  }

  /* =========================================================
     CREATE USER
  ========================================================= */

  async createUser(
    name: string,
    email: string,
    passwordHash: string,
  ) {
    return db.orm.public.User.create({
      name,
      email,
      passwordHash,
    });
  }

  /* =========================================================
     FIND SAFE USER BY ID
  ========================================================= */

  async findById(userId: number) {
    const user =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .first();

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    return this.toSafeUser(user);
  }

  /* =========================================================
     FIND AUTH USER BY ID

     Unlike findById(), this intentionally returns the raw row.
     It is for internal authentication/password-reset logic only.
  ========================================================= */

  async findAuthUserById(
    userId: number,
  ) {
    return db.orm.public.User
      .where({
        id: userId,
      })
      .first();
  }

  /* =========================================================
     UPDATE PROFILE
  ========================================================= */

  async updateProfile(
    userId: number,
    data: {
      name?: string;
      email?: string;
    },
  ) {
    const user =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .first();

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    if (
      data.email &&
      data.email !== user.email
    ) {
      const existingEmail =
        await db.orm.public.User
          .where({
            email: data.email,
          })
          .first();

      if (existingEmail) {
        throw new ConflictException(
          "Email is already in use",
        );
      }
    }

    const updatedUser =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .update({
          ...(data.name !== undefined && {
            name: data.name,
          }),
          ...(data.email !== undefined && {
            email: data.email,
          }),
        });

    if (!updatedUser) {
      throw new NotFoundException(
        "User not found",
      );
    }

    return this.toSafeUser(updatedUser);
  }

  /* =========================================================
     CHANGE PASSWORD WHILE LOGGED IN
  ========================================================= */

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .first();

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );

    if (!passwordMatches) {
      throw new BadRequestException(
        "Current password is incorrect",
      );
    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        10,
      );

    await db.orm.public.User
      .where({
        id: userId,
      })
      .update({
        passwordHash,
      });

    return {
      message:
        "Password changed successfully",
    };
  }

  /* =========================================================
     UPDATE PASSWORD HASH

     Used by forgot/reset password flow.
  ========================================================= */

  async updatePasswordHash(
    userId: number,
    passwordHash: string,
  ) {
    const user =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .first();

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    return db.orm.public.User
      .where({
        id: userId,
      })
      .update({
        passwordHash,
      });
  }

  /* =========================================================
     DELETE ACCOUNT
  ========================================================= */

  async deleteAccount(
    userId: number,
    password: string,
  ) {
    const user =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .first();

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.passwordHash,
      );

    if (!passwordMatches) {
      throw new BadRequestException(
        "Password is incorrect",
      );
    }

    await db.orm.public.User
      .where({
        id: userId,
      })
      .delete();

    return {
      message:
        "Account deleted successfully",
    };
  }

  async getPreferences(
    userId: number,
  ) {
    const user =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .first();

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    return {
      interests: user.interests ?? [],
      wisdomNeeds: user.wisdomNeeds ?? [],
    };
  }

  async updatePreferences(
    userId: number,
    data: {
      interests?: string[];
      wisdomNeeds?: string[];
    },
  ) {
    const user =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .first();

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    const interests = [
      ...new Set(
        (data.interests ?? [])
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];

    const wisdomNeeds = [
      ...new Set(
        (data.wisdomNeeds ?? [])
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];

    await db.orm.public.User
      .where({
        id: userId,
      })
      .update({
        interests,
        wisdomNeeds,
      });

    return {
      message:
        "Preferences updated successfully",
      interests,
      wisdomNeeds,
    };
  }

  async getAllUsersForAdmin() {
    const users =
      await db.orm.public.User.all();

    return users
      .map((user) =>
        this.toSafeUser(user),
      )
      .sort(
        (a, b) =>
          new Date(
            b.createdAt,
          ).getTime() -
          new Date(
            a.createdAt,
          ).getTime(),
      );
  }

  async updateUserForAdmin(
    userId: number,
    data: {
      name?: string;
      email?: string;
      role?: string;
      membershipTier?: string;
      accountStatus?: string;
    },
  ) {
    const user =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .first();

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    if (
      data.email &&
      data.email.trim().toLowerCase() !==
        user.email.trim().toLowerCase()
    ) {
      const existing =
        await db.orm.public.User
          .where({
            email:
              data.email.trim().toLowerCase(),
          })
          .first();

      if (
        existing &&
        existing.id !== userId
      ) {
        throw new ConflictException(
          "Email is already in use",
        );
      }
    }

    const allowedRoles = [
      "user",
      "admin",
    ];

    const allowedMemberships = [
      "free",
      "premium",
    ];

    const allowedStatuses = [
      "active",
      "overdue",
      "suspended",
    ];

    if (
      data.role &&
      !allowedRoles.includes(
        data.role,
      )
    ) {
      throw new BadRequestException(
        "Invalid role",
      );
    }

    if (
      data.membershipTier &&
      !allowedMemberships.includes(
        data.membershipTier,
      )
    ) {
      throw new BadRequestException(
        "Invalid membership tier",
      );
    }

    if (
      data.accountStatus &&
      !allowedStatuses.includes(
        data.accountStatus,
      )
    ) {
      throw new BadRequestException(
        "Invalid account status",
      );
    }

    const updated =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .update({
          ...(data.name !== undefined && {
            name: data.name.trim(),
          }),
          ...(data.email !== undefined && {
            email:
              data.email.trim().toLowerCase(),
          }),
          ...(data.role !== undefined && {
            role: data.role,
          }),
          ...(data.membershipTier !== undefined && {
            membershipTier:
              data.membershipTier,
          }),
          ...(data.accountStatus !== undefined && {
            accountStatus:
              data.accountStatus,
          }),
        });

    if (!updated) {
      throw new NotFoundException(
        "User not found",
      );
    }

    return this.toSafeUser(updated);
  }

  async createUserForAdmin(
    data: {
      name: string;
      email: string;
      password: string;
      membershipTier?: string;
      accountStatus?: string;
    },
  ) {
    const name =
      data.name.trim();

    const email =
      data.email.trim().toLowerCase();

    if (
      !name ||
      !email ||
      !data.password
    ) {
      throw new BadRequestException(
        "Name, email and initial password are required",
      );
    }

    if (
      data.password.length < 8
    ) {
      throw new BadRequestException(
        "Initial password must be at least 8 characters",
      );
    }

    const allowedMemberships = [
      "free",
      "premium",
    ];

    const allowedStatuses = [
      "active",
      "overdue",
      "suspended",
    ];

    if (
      data.membershipTier &&
      !allowedMemberships.includes(
        data.membershipTier,
      )
    ) {
      throw new BadRequestException(
        "Invalid membership tier",
      );
    }

    if (
      data.accountStatus &&
      !allowedStatuses.includes(
        data.accountStatus,
      )
    ) {
      throw new BadRequestException(
        "Invalid account status",
      );
    }

    const existing =
      await db.orm.public.User
        .where({
          email,
        })
        .first();

    if (existing) {
      throw new ConflictException(
        "Email is already registered",
      );
    }

    const passwordHash =
      await bcrypt.hash(
        data.password,
        10,
      );

    const createdUser =
      await db.orm.public.User.create({
        name,
        email,
        passwordHash,
        role: "user",
        membershipTier:
          data.membershipTier ?? "free",
        accountStatus:
          data.accountStatus ?? "active",
      });

    if (!createdUser) {
      throw new BadRequestException(
        "Could not create user",
      );
    }

    return this.toSafeUser(createdUser);
  }

  async markLastLogin(
    userId: number,
  ) {
    return db.orm.public.User
      .where({
        id: userId,
      })
      .update({
        lastLoginAt:
          new Date().toISOString(),
      });
  }
}
