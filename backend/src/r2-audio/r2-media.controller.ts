
import {
  Body,
  Controller,
  Get,
  Header,
  ParseIntPipe,
  Post,
  Query,
  Redirect,
  UseGuards,
} from "@nestjs/common";

import { Type } from "class-transformer";

import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";

import {
  AdminPermissionGuard,
  RequireAdminPermission,
} from "../auth/admin-permission.guard";

import { AdminIpAllowListGuard } from "../admin/admin-ip-allow-list.guard";

import {
  R2MediaService,
  type R2MediaKind,
} from "./r2-media.service";

class BulkKindDto {
  @IsIn(["nuggets", "image"])
  kind!: R2MediaKind;
}

class MatchItemDto {
  @IsString()
  @MaxLength(150)
  @Matches(/^[-a-zA-Z0-9_]+$/)
  id!: string;

  @IsString()
  @MaxLength(2200)
  value!: string;
}

class ApplyMediaMatchesDto extends BulkKindDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => MatchItemDto)
  matches!: MatchItemDto[];
}

@Controller("admin/r2-media")
@UseGuards(
  JwtAuthGuard,
  AdminGuard,
  AdminPermissionGuard,
  AdminIpAllowListGuard,
)
@RequireAdminPermission("manageNuggets")
export class R2MediaController {
  constructor(
    private readonly media: R2MediaService,
  ) {}

  @Get("files")
  files(
    @Query("kind") kind: R2MediaKind,
    @Query("continuationToken") token?: string,
  ) {
    return this.media.listFiles(kind, token);
  }

  @Get("match")
  match(
    @Query("kind") kind: R2MediaKind,
    @Query("number", ParseIntPipe) number: number,
  ) {
    return this.media.matchByNumber(kind, number);
  }

  @Post("bulk/preview")
  preview(@Body() input: BulkKindDto) {
    return this.media.preview(input.kind);
  }

  @Post("bulk/apply")
  apply(@Body() input: ApplyMediaMatchesDto) {
    return this.media.apply(
      input.kind,
      input.matches,
    );
  }
}

// Public, read-only image delivery.
// The actual R2 bucket remains private.
@Controller("r2-image")
export class R2ImageController {
  constructor(
    private readonly media: R2MediaService,
  ) {}

  @Get()
  @Header("Cache-Control", "no-store, max-age=0")
  @Redirect(undefined, 302)
  async image(@Query("key") key: string) {
    return {
      url: await this.media.signedImageUrl(key),
      statusCode: 302,
    };
  }
}
