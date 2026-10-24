import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  existsSync,
  unlinkSync,
} from "fs";

import {
  join,
} from "path";

import {
  randomUUID,
} from "crypto";

import { db } from "../prisma/db";

import {
  CloudinaryStorageService,
} from "./cloudinary-storage.service";

@Injectable()
export class MediaService {
  private readonly uploadDirectory =
    join(
      process.cwd(),
      "uploads",
      "media",
    );

  constructor(
    private readonly cloudinaryStorage:
      CloudinaryStorageService,
  ) {}

  /* =========================================
     LIBRARY
  ========================================= */

  async getLibrary() {
    const assets =
      await db.orm.public.MediaAsset.all();

    const folders =
      await db.orm.public.MediaFolder.all();

    const usedBytes =
      assets.reduce(
        (
          total,
          asset,
        ) =>
          total +
          asset.size,
        0,
      );

    const limitBytes =
      Number(
        process.env
          .MEDIA_STORAGE_LIMIT_BYTES,
      ) ||
      20 *
        1024 *
        1024 *
        1024;

    const sortedAssets =
      [...assets].sort(
        (
          a,
          b,
        ) =>
          new Date(
            b.createdAt,
          ).getTime() -
          new Date(
            a.createdAt,
          ).getTime(),
      );

    return {
      assets:
        sortedAssets.map(
          (asset) => ({
            ...asset,
            url:
              this.isCloudinaryAsset(
                asset.url,
              )
                ? `/media/cloudinary/${asset.id}`
                : asset.url,
          }),

      folders: [...folders].sort(
        (
          a,
          b,
        ) =>
          a.name.localeCompare(
            b.name,
          ),
      ),

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

  async createFolder(
    name: string,
  ) {
    const cleanName =
      name.trim();

    if (!cleanName) {
      throw new ConflictException(
        "Folder name is required",
      );
    }

    const existing =
      await db.orm.public.MediaFolder
        .where({
          name: cleanName,
        })
        .first();

    if (existing) {
      throw new ConflictException(
        "Folder already exists",
      );
    }

    return db.orm.public.MediaFolder.create({
      name: cleanName,
    });
  }

  /* =========================================
     UPLOAD TO CLOUDINARY + CREATE RECORD
  ========================================= */

  async uploadAsset(
    file: Express.Multer.File,
    folderId?: number | null,
  ) {
    if (folderId) {
      const folder =
        await db.orm.public.MediaFolder
          .where({
            id: folderId,
          })
          .first();

      if (!folder) {
        throw new NotFoundException(
          "Media folder not found",
        );
      }
    }

    const publicId =
      `business-nuggets/media/${randomUUID()}`;

    const uploaded =
      await this.cloudinaryStorage.uploadImage(
        file,
        publicId,
      );

    try {
      return await db.orm.public.MediaAsset.create({
        filename:
          uploaded.publicId,

        originalName:
          file.originalname,

        mimeType:
          file.mimetype,

        size:
          uploaded.bytes,

        width:
          uploaded.width,

        height:
          uploaded.height,

        folderId:
          folderId ?? null,

        url:
          uploaded.secureUrl,
      });
    } catch (error) {
      try {
        await this.cloudinaryStorage.deleteImage(
          uploaded.publicId,
        );
      } catch (cleanupError) {
        console.error(
          "Could not clean up Cloudinary asset after database failure:",
          cleanupError,
        );
      }

      throw error;
    }
  }

  /* =========================================
     DELETE ASSET
  ========================================= */

  async deleteAsset(
    id: number,
  ) {
    const asset =
      await this.findById(
        id,
      );

    if (!asset) {
      throw new NotFoundException(
        "Media asset not found",
      );
    }

    if (
      this.isCloudinaryAsset(
        asset.url,
      )
    ) {
      await this.cloudinaryStorage.deleteImage(
        asset.filename,
      );
    } else {
      const filePath =
        join(
          this.uploadDirectory,
          asset.filename,
        );

      if (
        existsSync(
          filePath,
        )
      ) {
        unlinkSync(
          filePath,
        );
      }
    }

    await db.orm.public.MediaAsset
      .where({ id })
      .delete();

    return {
      message:
        "Media deleted successfully",
    };
  }

  /* =========================================
     FIND ASSETS
  ========================================= */

  async findById(
    id: number,
  ) {
    return db.orm.public.MediaAsset
      .where({ id })
      .first();
  }

  async findByFilename(
    filename: string,
  ) {
    return db.orm.public.MediaAsset
      .where({
        filename,
      })
      .first();
  }

  isCloudinaryAsset(
    url: string,
  ) {
    return /^https:\/\/res\.cloudinary\.com\//i.test(
      url,
    );
  }
}
