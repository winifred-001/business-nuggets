
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsInt, IsString, Matches, Max, Min } from 'class-validator';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import {
  AdminPermissionGuard,
  RequireAdminPermission,
} from '../auth/admin-permission.guard';
import { AdminIpAllowListGuard } from '../admin/admin-ip-allow-list.guard';
import type { R2AudioService, R2AudioKind } from './r2-audio.service';

class SignR2UploadDto {
  @IsIn(['song', 'nuggets'])
  kind: R2AudioKind;

  @IsString()
  @Matches(/\.mp3$/i)
  filename: string;

  @IsInt()
  @Min(1)
  @Max(50 * 1024 * 1024)
  size: number;
}

class CompleteR2UploadDto {
  @IsString()
  reference: string;
}

@Controller('admin/r2-audio')
@UseGuards(
  JwtAuthGuard,
  AdminGuard,
  AdminPermissionGuard,
  AdminIpAllowListGuard,
)
@RequireAdminPermission('manageNuggets')
export class R2AudioController {
  constructor(private readonly storage: R2AudioService) {}

  @Post('sign-upload')
  signUpload(@Body() input: SignR2UploadDto) {
    return this.storage.signUpload(
      input.kind,
      input.filename,
      input.size,
    );
  }

  @Post('complete-upload')
  completeUpload(@Body() input: CompleteR2UploadDto) {
    return this.storage.completeUpload(input.reference);
  }

  @Get('preview')
  async preview(@Query('reference') reference: string) {
    if (!reference?.startsWith('r2://')) {
      throw new BadRequestException('Invalid audio reference');
    }

    return {
      url: await this.storage.resolvePlaybackUrl(reference),
    };
  }
}
