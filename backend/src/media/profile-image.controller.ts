import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { detectMediaMime, normalizeMime } from './media-types';
import { MediaService } from './media.service';

const PROFILE_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

@Controller('users/me/profile-image')
@UseGuards(JwtAuthGuard)
export class ProfileImageController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  getProfileImage(@Request() request: any) {
    return this.mediaService.getProfileImage(request.user.sub);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: PROFILE_IMAGE_MAX_BYTES,
      },
      fileFilter: (_request, file, callback) => {
        if (!PROFILE_IMAGE_MIME_TYPES.has(normalizeMime(file.mimetype))) {
          callback(
            new BadRequestException(
              'Choose a JPG, PNG or WEBP image that is 5 MB or smaller',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  async uploadProfileImage(
    @Request() request: any,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Choose a profile image to upload');
    }

    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      throw new BadRequestException(
        'Profile images must be 5 MB or smaller',
      );
    }

    const detectedMimeType = detectMediaMime(file.buffer);
    const suppliedMimeType = normalizeMime(file.mimetype);

    if (
      !detectedMimeType ||
      detectedMimeType !== suppliedMimeType ||
      !PROFILE_IMAGE_MIME_TYPES.has(detectedMimeType)
    ) {
      throw new BadRequestException(
        'Uploaded file content does not match a supported profile image type',
      );
    }

    file.mimetype = detectedMimeType;

    return this.mediaService.uploadProfileImage(request.user.sub, file);
  }

  @Delete()
  deleteProfileImage(@Request() request: any) {
    return this.mediaService.deleteProfileImage(request.user.sub);
  }
}
