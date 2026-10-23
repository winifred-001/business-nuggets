import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import * as bcrypt from "bcrypt";

import { db } from "../prisma/db";

import {
  AdminPermission,
  AdminRole,
  getAdminPermissionMatrix,
  isAdminPermission,
  isAdminRole,
  setAdminRolePermission,
} from "../auth/admin-permissions";

@Injectable()
export class RolesAccessService {
  private readonly allowedRoles: AdminRole[] = [
    "super-admin",
    "editor",
    "moderator",
    "support",
  ];

  /* =========================================
     ADMIN TEAM
  ========================================= */

  async getAdminTeam() {
    const users =
      await db.orm.public.User.all();

    const admins =
      users
        .filter(
          (user) =>
            user.role === "admin" ||
            user.role === "owner",
        )
        .map((user) => {
          const {
            passwordHash:
              _passwordHash,
            ...safeUser
          } = user;

          return {
            ...safeUser,

            adminRole:
              user.role === "owner"
                ? "super-admin"
                : user.adminRole ??
                  "editor",
          };
        })
        .sort(
          (a, b) =>
            new Date(
              a.createdAt,
            ).getTime() -
            new Date(
              b.createdAt,
            ).getTime(),
        );

    return {
      admins,

      permissions:
        await getAdminPermissionMatrix(),
    };
  }

  /* =========================================
     UPDATE ROLE PERMISSION
  ========================================= */

  async updateRolePermission(
    data: {
      role: AdminRole;
      permission: AdminPermission;
      enabled: boolean;
    },
  ) {
    if (
      !isAdminRole(
        data.role,
      )
    ) {
      throw new BadRequestException(
        "Invalid admin role",
      );
    }

    if (
      !isAdminPermission(
        data.permission,
      )
    ) {
      throw new BadRequestException(
        "Invalid admin permission",
      );
    }

    if (
      typeof data.enabled !==
      "boolean"
    ) {
      throw new BadRequestException(
        "Permission value must be true or false",
      );
    }

    if (
      data.role ===
      "super-admin"
    ) {
      throw new BadRequestException(
        "Super Admin permissions cannot be changed",
      );
    }

    try {
      const permissions =
        await setAdminRolePermission(
          data.role,
          data.permission,
          data.enabled,
        );

      return {
        message:
          "Role permission updated",
        permissions,
      };
    } catch (error) {
      console.error(
        "Could not update admin role permission:",
        error,
      );

      throw new BadRequestException(
        "Could not update role permission",
      );
    }
  }

  /* =========================================
     ADD ADMIN
  ========================================= */

  async createAdmin(
    data: {
      name: string;
      email: string;
      password: string;
      adminRole: AdminRole;
    },
  ) {
    const name =
      data.name.trim();

    const email =
      data.email
        .trim()
        .toLowerCase();

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

    if (
      !this.allowedRoles.includes(
        data.adminRole,
      )
    ) {
      throw new BadRequestException(
        "Invalid admin role",
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

    const created =
      await db.orm.public.User.create({
        name,

        email,

        passwordHash,

        role: "admin",

        adminRole:
          data.adminRole,

        accountStatus:
          "active",

        membershipTier:
          "free",
      });

    if (!created) {
      throw new BadRequestException(
        "Could not create admin",
      );
    }

    const {
      passwordHash:
        _passwordHash,
      ...safeAdmin
    } = created;

    return safeAdmin;
  }

  /* =========================================
     UPDATE ADMIN
  ========================================= */

  async updateAdmin(
    id: number,
    data: {
      adminRole?: AdminRole;

      accountStatus?:
        | "active"
        | "suspended";
    },
  ) {
    const user =
      await db.orm.public.User
        .where({
          id,
        })
        .first();

    if (!user) {
      throw new NotFoundException(
        "Admin not found",
      );
    }

    if (
      user.role !== "admin" &&
      user.role !== "owner"
    ) {
      throw new BadRequestException(
        "User is not an admin",
      );
    }

    if (
      user.role === "owner"
    ) {
      throw new BadRequestException(
        "The owner account cannot be modified here",
      );
    }

    if (
      data.adminRole &&
      !this.allowedRoles.includes(
        data.adminRole,
      )
    ) {
      throw new BadRequestException(
        "Invalid admin role",
      );
    }

    if (
      data.accountStatus &&
      ![
        "active",
        "suspended",
      ].includes(
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
          id,
        })
        .update({
          ...(data.adminRole !==
            undefined && {
            adminRole:
              data.adminRole,
          }),

          ...(data.accountStatus !==
            undefined && {
            accountStatus:
              data.accountStatus,
          }),
        });

    if (!updated) {
      throw new NotFoundException(
        "Admin not found",
      );
    }

    const {
      passwordHash:
        _passwordHash,
      ...safeAdmin
    } = updated;

    return safeAdmin;
  }
}
