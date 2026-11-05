import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Request,
  UseGuards,
} from "@nestjs/common";

import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { DeleteAccountDto } from "./dto/delete-account.dto";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { SessionsService } from "../auth/sessions.service";
import { EmailService } from "../email/email.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly emailService: EmailService,
  ) {}

  @Get("me")
  getMe(@Request() req: any) {
    return this.usersService.findById(
      req.user.sub,
    );
  }

  @Patch("me")
  updateProfile(
    @Request() req: any,
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      req.user.sub,
      body,
    );
  }

  @Patch("me/password")
  async changePassword(
    @Request()
    req: any,

    @Body()
    body: ChangePasswordDto,
  ) {
    const user =
      await this.usersService.findById(
        req.user.sub,
      );

    await this.usersService.changePassword(
      req.user.sub,
      body.currentPassword,
      body.newPassword,
    );

    await this.sessionsService.revokeAllSessions(
      req.user.sub,
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
        "Password changed successfully. Please log in again.",
    };
  }

  @Delete("me")
  deleteAccount(
    @Request() req: any,
    @Body() body: DeleteAccountDto,
  ) {
    return this.usersService.deleteAccount(
      req.user.sub,
      body.password,
    );
  }

  @Get("me/preferences")
  getPreferences(
    @Request() req: any,
  ) {
    return this.usersService.getPreferences(
      req.user.sub,
    );
  }

  @Patch("me/preferences")
  updatePreferences(
    @Request() req: any,
    @Body() body: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(
      req.user.sub,
      body,
    );
  }
}
