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

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService
  ) {}

  @Get("me")
  getMe(@Request() req: any) {
    return this.usersService.findById(
      req.user.sub
    );
  }

  @Patch("me")
  updateProfile(
    @Request() req: any,
    @Body() body: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(
      req.user.sub,
      body
    );
  }

  @Patch("me/password")
  changePassword(
    @Request() req: any,
    @Body() body: ChangePasswordDto
  ) {
    return this.usersService.changePassword(
      req.user.sub,
      body.currentPassword,
      body.newPassword
    );
  }

  @Delete("me")
  deleteAccount(
    @Request() req: any,
    @Body() body: DeleteAccountDto
  ) {
    return this.usersService.deleteAccount(
      req.user.sub,
      body.password
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

  @Body()
  body: {
    interests?: string[];
    wisdomNeeds?: string[];
  },
) {
  return this.usersService.updatePreferences(
    req.user.sub,
    body,
  );
}
}