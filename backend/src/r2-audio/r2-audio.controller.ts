import {
  BadRequestException,
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
  Max,
  Min,
} from 'class-validator';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import {
  AdminPermissionGuard,
  RequireAdminPermission,
} from '../auth/admin-permission.guard';
import { AdminIpAllowListGuard } from '../admin/admin-ip-allow-list.guard';
import { R2AudioService } from './r2-audio.service';
import type { R2AudioKind, R2ListKind } from './r2-audio.service';
import { R2BulkMediaMatchService } from './r2-bulk-media-match.service';
import type { R2MediaKind } from './r2-bulk-media-match.service';
import { R2BulkSongMatchService } from './r2-bulk-song-match.service';
import { Type } from 'class-transformer';

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

class ApplyR2MatchItemDto {
  @IsString()
  @MaxLength(150)
  @Matches(/^[-a-zA-Z0-9_]+$/)
  id!: string;

  @IsString()
  @MaxLength(1200)
  @Matches(/^r2:\/\/song\/.+\.mp3$/i)
  reference!: string;
}

class ApplyR2MatchesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ApplyR2MatchItemDto)
  matches!: ApplyR2MatchItemDto[];
}

class R2MediaKindDto {
  @IsIn(['nuggets', 'images'])
  kind!: R2MediaKind;
}

class ApplyR2MediaItemDto {
  @IsString()
  @MaxLength(150)
  @Matches(/^[-a-zA-Z0-9_]+$/)
  id!: string;

  @IsString()
  @MaxLength(1400)
  reference!: string;
}

class ApplyR2MediaMatchesDto extends R2MediaKindDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ApplyR2MediaItemDto)
  matches!: ApplyR2MediaItemDto[];
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
  constructor(
    private readonly storage: R2AudioService,
    private readonly bulkMatcher: R2BulkSongMatchService,
    private readonly mediaMatcher: R2BulkMediaMatchService,
  ) {}

  @Get('files')
  listFiles(
    @Query('kind') kind: R2ListKind,
    @Query('continuationToken') continuationToken?: string,
  ) {
    return this.storage.listFiles(kind, continuationToken);
  }

  @Get('match-song')
  matchSong(@Query('number', ParseIntPipe) number: number) {
    return this.storage.matchSongByNumber(number);
  }

  @Get('match-media')
  matchMedia(
    @Query('kind') kind: R2MediaKind,
    @Query('number', ParseIntPipe) number: number,
  ) {
    return this.mediaMatcher.matchByNumber(kind, number);
  }

  @Post('bulk-media-match/preview')
  previewBulkMedia(@Body() input: R2MediaKindDto) {
    return this.mediaMatcher.preview(input.kind);
  }

  @Post('bulk-media-match/apply')
  applyBulkMedia(@Body() input: ApplyR2MediaMatchesDto) {
    return this.mediaMatcher.apply(input.kind, input.matches);
  }

  @Post('bulk-match/preview')
  previewBulkSongMatches() {
    return this.bulkMatcher.preview();
  }

  @Post('bulk-match/apply')
  applyBulkSongMatches(@Body() input: ApplyR2MatchesDto) {
    return this.bulkMatcher.apply(input.matches);
  }

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
