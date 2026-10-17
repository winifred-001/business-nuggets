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
  async findByEmail(email: string) {
    return db.orm.public.User
      .where({ email })
      .first();
  }

  async createUser(
    name: string,
    email: string,
    passwordHash: string
  ) {
    return db.orm.public.User.create({
      name,
      email,
      passwordHash,
    });
  }

  async findById(userId: number) {
    const user = await db.orm.public.User
      .where({ id: userId })
      .first();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const { passwordHash, ...safeUser } = user;

    return safeUser;
  }

  async updateProfile(
    userId: number,
    data: {
      name?: string;
      email?: string;
    }
  ) {
    const user = await db.orm.public.User
      .where({ id: userId })
      .first();

    if (!user) {
      throw new NotFoundException("User not found");
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
          "Email is already in use"
        );
      }
    }

    const updatedUser =
      await db.orm.public.User
        .where({ id: userId })
        .update({
          ...(data.name !== undefined && {
            name: data.name,
          }),

          ...(data.email !== undefined && {
            email: data.email,
          }),
        });

    if (!updatedUser) {
      throw new NotFoundException("User not found");
    }

    const {
      passwordHash,
      ...safeUser
    } = updatedUser;

    return safeUser;
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await db.orm.public.User
      .where({ id: userId })
      .first();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );

    if (!passwordMatches) {
      throw new BadRequestException(
        "Current password is incorrect"
      );
    }

    const passwordHash = await bcrypt.hash(
      newPassword,
      10
    );

    await db.orm.public.User
      .where({ id: userId })
      .update({
        passwordHash,
      });

    return {
      message: "Password changed successfully",
    };
  }

  async deleteAccount(
    userId: number,
    password: string
  ) {
    const user = await db.orm.public.User
      .where({ id: userId })
      .first();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordMatches) {
      throw new BadRequestException(
        "Password is incorrect"
      );
    }

    await db.orm.public.User
      .where({ id: userId })
      .delete();

    return {
      message: "Account deleted successfully",
    };
  }
}