import {
  CompleteMediaUploadDto,
  SaveMediaUrlDto,
  SignMediaUploadDto,
} from './dto/media-input.dto';
import {
  detectMediaMime,
  MEDIA_FORMATS,
  mediaLimit,
  normalizeMime,
} from './media-types';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { memoryStorage } from 'multer';

import { join, basename } from 'path';

import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { AdminGuard } from '../auth/admin.guard';

import {
  AdminPermissionGuard,
  RequireAdminPermission,
} from '../auth/admin-permission.guard';

import { MediaService } from './media.service';
import { CreateMediaFolderDto } from './dto/create-media-folder.dto';

const legacyUploadDirectory = join(process.cwd(), 'uploads', 'media');

@Controller('admin/media')
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionGuard)
@RequireAdminPermission('manageNuggets')
export class AdminMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  getLibrary() {
    return this.mediaService.getLibrary();
  }

  @Post('folders')
  createFolder(
    @Body()
    body: CreateMediaFolderDto,
  ) {
    return this.mediaService.createFolder(body.name);
  }

  @Post('sign-upload')
  signUpload(@Body() body: SignMediaUploadDto) {
    return this.mediaService.signUpload(body);
  }

  @Post('complete-upload')
  completeUpload(@Body() body: CompleteMediaUploadDto) {
    return this.mediaService.completeUpload(body.token);
  }

  @Post('urls')
  saveUrl(@Body() body: SaveMediaUrlDto) {
    return this.mediaService.saveUrl(body);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),

      limits: {
        fileSize: 50 * 1024 * 1024,
      },

      fileFilter: (_request, file, callback) => {
        if (!MEDIA_FORMATS[normalizeMime(file.mimetype)]) {
          callback(
            new BadRequestException(
              'Choose a JPG, PNG, WEBP, GIF, MP3 or WAV file',
            ),
            false,
          );

          return;
        }

        callback(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile()
    file: Express.Multer.File | undefined,

    @Body()
    body: {
      folderId?: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('Choose a media file to upload');
    }

    const detectedMimeType = detectMediaMime(file.buffer);

    if (
      !detectedMimeType ||
      detectedMimeType !== normalizeMime(file.mimetype)
    ) {
      throw new BadRequestException(
        'Uploaded file content does not match a supported media type',
      );
    }

    file.mimetype = detectedMimeType;
    if (file.size > mediaLimit(file.mimetype))
      throw new BadRequestException(
        'Images must be 10 MB or smaller; audio must be 50 MB or smaller',
      );

    const folderId = body.folderId ? Number(body.folderId) : null;

    if (folderId !== null && (!Number.isInteger(folderId) || folderId <= 0)) {
      throw new BadRequestException('Invalid media folder');
    }

    return this.mediaService.uploadAsset(file, folderId);
  }

  @Delete(':id')
  deleteAsset(
    @Param('id')
    id: string,
  ) {
    return this.mediaService.deleteAsset(Number(id));
  }
}

/* =========================================
   PUBLIC MEDIA DELIVERY
========================================= */

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('cloudinary/:id')
  async getCloudinaryAsset(
    @Param('id')
    id: string,

    @Res()
    response: Response,
  ) {
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    const asset = await this.mediaService.findById(Number(id));

    if (!asset || !this.mediaService.isCloudinaryAsset(asset.url)) {
      response.status(404).send('File not found');

      return;
    }

    response.redirect(302, asset.url);
  }

  @Get(':filename')
  async getFile(
    @Param('filename')
    filename: string,

    @Res()
    response: Response,
  ) {
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    const safeFilename = basename(filename);

    const asset = await this.mediaService.findByFilename(safeFilename);

    if (!asset) {
      response.status(404).send('File not found');

      return;
    }

    response.sendFile(safeFilename, {
      root: legacyUploadDirectory,
    });
  }
}
