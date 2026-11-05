import {
  Module,
  forwardRef,
} from "@nestjs/common";

import {
  JwtModule,
} from "@nestjs/jwt";

import {
  AuthController,
} from "./auth.controller";

import {
  AuthService,
} from "./auth.service";

import {
  UsersModule,
} from "../users/users.module";

import {
  JwtAuthGuard,
} from "./jwt-auth.guard";

import {
  OptionalJwtAuthGuard,
} from "./optional-jwt-auth.guard";

import {
  AdminGuard,
} from "./admin.guard";

import {
  AdminPermissionGuard,
} from "./admin-permission.guard";

import {
  SessionsService,
} from "./sessions.service";

import {
  TwoFactorService,
} from "./two-factor.service";

import { EmailModule } from "../email/email.module";

@Module({
  imports: [
    EmailModule,
    forwardRef(
      () =>
        UsersModule,
    ),

    JwtModule.register({
      secret:
        process.env
          .JWT_SECRET,

      signOptions: {
        expiresIn:
          "7d",
      },
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    AdminGuard,
    AdminPermissionGuard,
    SessionsService,
    TwoFactorService,
  ],

  exports: [
    JwtModule,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    AdminGuard,
    AdminPermissionGuard,
    SessionsService,
    TwoFactorService,
  ],
})
export class AuthModule {}