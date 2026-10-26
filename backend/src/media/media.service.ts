import { BadRequestException } from '@nestjs/common';
import { basename } from 'path';
import {
  MEDIA_FORMATS,
  mediaLimit,
  normalizeMime,
  resourceType,
} from './media-types';
import { SaveMediaUrlDto, SignMediaUploadDto } from './dto/media-input.dto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { existsSync, unlinkSync } from 'fs';

import { join } from 'path';

import { randomUUID } from 'crypto';

import { db } from '../prisma/db';

import { CloudinaryStorageService } from './cloudinary-storage.service';

@Injectable()
export class MediaService {
  private readonly uploadDirectory = join(process.cwd(), 'uploads', 'media');

  constructor(private readonly cloudinaryStorage: CloudinaryStorageService) {}

  /* =========================================
     LIBRARY
  ========================================= */

  async getLibrary() {
    const assets = await db.orm.public.MediaAsset.all();

    const folders = await db.orm.public.MediaFolder.all();

    const usedBytes = assets.reduce((total, asset) => total + asset.size, 0);

    const limitBytes =
      Number(process.env.MEDIA_STORAGE_LIMIT_BYTES) || 20 * 1024 * 1024 * 1024;

    const sortedAssets = [...assets].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      assets: sortedAssets.map((asset) => ({
        ...asset,
        url:
          this.isCloudinaryAsset(asset.url) &&
          asset.filename.startsWith('business-nuggets/media/')
            ? `/media/cloudinary/${asset.id}`
            : asset.url,
      })),

      folders: [...folders].sort((a, b) => a.name.localeCompare(b.name)),

      storage: {
        usedBytes,
        limitBytes,
        ...this.cloudinaryStorage.getPublicStatus(),
      },
    };
  }

  /* =========================================
     CREATE FOLDER
  ========================================= */

  async createFolder(name: string) {
    const cleanName = name.trim();

    if (!cleanName) {
      throw new ConflictException('Folder name is required');
    }

    const existing = await db.orm.public.MediaFolder.where({
      name: cleanName,
    }).first();

    if (existing) {
      throw new ConflictException('Folder already exists');
    }

    return db.orm.public.MediaFolder.create({
      name: cleanName,
    });
  }

  /* =========================================
     UPLOAD TO CLOUDINARY + CREATE RECORD
  ========================================= */

  async uploadAsset(file: Express.Multer.File, folderId?: number | null) {
    if (folderId) {
      const folder = await db.orm.public.MediaFolder.where({
        id: folderId,
      }).first();

      if (!folder) {
        throw new NotFoundException('Media folder not found');
      }
    }

    await this.checkCapacity(file.size);
    const publicId = `business-nuggets/media/${randomUUID()}`;

    const uploaded = await this.cloudinaryStorage.uploadMedia(file, publicId);

    try {
      return await db.orm.public.MediaAsset.create({
        filename: uploaded.publicId,

        originalName: file.originalname,

        mimeType: file.mimetype,

        size: uploaded.bytes,

        width: uploaded.width,

        height: uploaded.height,

        folderId: folderId ?? null,

        url: uploaded.secureUrl,
      });
    } catch (error) {
      try {
        await this.cloudinaryStorage.deleteMedia(
          uploaded.publicId,
          resourceType(file.mimetype),
        );
      } catch (cleanupError) {
        console.error(
          'Could not clean up Cloudinary asset after database failure:',
          cleanupError,
        );
      }

      throw error;
    }
  }

  /* =========================================
     DELETE ASSET
  ========================================= */

  async deleteAsset(id: number) {
    const asset = await this.findById(id);

    if (!asset) {
      throw new NotFoundException('Media asset not found');
    }

    if (
      this.isCloudinaryAsset(asset.url) &&
      asset.filename.startsWith('business-nuggets/media/')
    ) {
      await this.cloudinaryStorage.deleteMedia(
        asset.filename,
        resourceType(asset.mimeType),
      );
    } else if (
      asset.url.startsWith('/media/') &&
      basename(asset.filename) === asset.filename
    ) {
      const filePath = join(this.uploadDirectory, asset.filename);

      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }

    await db.orm.public.MediaAsset.where({ id }).delete();

    return {
      message: 'Media deleted successfully',
    };
  }

  private async checkFolder(folderId: number | null) {
    if (
      folderId &&
      !(await db.orm.public.MediaFolder.where({ id: folderId }).first())
    )
      throw new NotFoundException('Media folder not found');
  }

  private async checkCapacity(bytes: number) {
    const assets = await db.orm.public.MediaAsset.all();
    const used = assets.reduce((sum, asset) => sum + asset.size, 0);
    const limit =
      Number(process.env.MEDIA_STORAGE_LIMIT_BYTES) || 20 * 1024 * 1024 * 1024;
    if (used + bytes > limit)
      throw new BadRequestException('Media storage limit exceeded');
  }

  async signUpload(input: SignMediaUploadDto) {
    const mimeType = normalizeMime(input.mimeType);
    if (!MEDIA_FORMATS[mimeType] || input.size > mediaLimit(mimeType))
      throw new BadRequestException(
        'Images must be 10 MB or smaller; audio must be 50 MB or smaller',
      );
    await this.checkFolder(input.folderId ?? null);
    await this.checkCapacity(input.size);
    return this.cloudinaryStorage.createUploadSignature({
      publicId: `business-nuggets/media/${randomUUID()}`,
      mimeType,
      originalName: input.originalName,
      folderId: input.folderId ?? null,
    });
  }

  async completeUpload(token: string) {
    const session = this.cloudinaryStorage.verifyUploadToken(token);
    const existing = await db.orm.public.MediaAsset.where({
      filename: session.publicId,
    }).first();
    if (existing) return existing;
    const uploaded = await this.cloudinaryStorage.inspectUploadedMedia(
      session.publicId,
      session.mimeType,
    );
    if (uploaded.bytes > mediaLimit(session.mimeType)) {
      await this.cloudinaryStorage.deleteMedia(
        session.publicId,
        resourceType(session.mimeType),
      );
      throw new BadRequestException('Uploaded media exceeds its size limit');
    }
    try {
      await this.checkFolder(session.folderId);
      await this.checkCapacity(uploaded.bytes);
      return await db.orm.public.MediaAsset.create({
        filename: session.publicId,
        originalName: session.originalName,
        mimeType: session.mimeType,
        size: uploaded.bytes,
        width: session.mimeType.startsWith('audio/') ? null : uploaded.width,
        height: session.mimeType.startsWith('audio/') ? null : uploaded.height,
        folderId: session.folderId,
        url: uploaded.secureUrl,
      });
    } catch (error) {
      // A concurrent retry may already have saved this unique public ID.
      const saved = await db.orm.public.MediaAsset.where({
        filename: session.publicId,
      }).first();
      if (saved) return saved;
      await this.cloudinaryStorage
        .deleteMedia(session.publicId, resourceType(session.mimeType))
        .catch((cleanupError) =>
          console.error(
            'Could not clean up incomplete media upload',
            cleanupError,
          ),
        );
      throw error;
    }
  }

  async saveUrl(input: SaveMediaUrlDto) {
    // Store the URL only: never fetch user-provided destinations on the server.
    const url = new URL(input.url);
    if (url.protocol !== 'https:' || url.username || url.password)
      throw new BadRequestException(
        'Use a public HTTPS media URL without credentials',
      );
    await this.checkFolder(input.folderId ?? null);
    return db.orm.public.MediaAsset.create({
      filename: `external:${randomUUID()}`,
      originalName: input.name.trim(),
      mimeType: input.mimeType,
      size: 0,
      width: null,
      height: null,
      folderId: input.folderId ?? null,
      url: url.href,
    });
  }

  /* =========================================
     FIND ASSETS
  ========================================= */

  async findById(id: number) {
    return db.orm.public.MediaAsset.where({ id }).first();
  }

  async findByFilename(filename: string) {
    return db.orm.public.MediaAsset.where({
      filename,
    }).first();
  }

  isCloudinaryAsset(url: string) {
    return /^https:\/\/res\.cloudinary\.com\//i.test(url);
  }
}
