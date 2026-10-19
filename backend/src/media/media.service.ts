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

import { db } from "../prisma/db";

@Injectable()
export class MediaService {
  private readonly uploadDirectory =
    join(
      process.cwd(),
      "uploads",
      "media",
    );

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

    return {
      assets: [...assets].sort(
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
      ),

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
     CREATE FILE RECORD
  ========================================= */

  async createAsset(
    data: {
      filename: string;

      originalName: string;

      mimeType: string;

      size: number;

      width?: number | null;

      height?: number | null;

      folderId?: number | null;
    },
  ) {
    if (data.folderId) {
      const folder =
        await db.orm.public.MediaFolder
          .where({
            id: data.folderId,
          })
          .first();

      if (!folder) {
        throw new NotFoundException(
          "Media folder not found",
        );
      }
    }

    return db.orm.public.MediaAsset.create({
      filename:
        data.filename,

      originalName:
        data.originalName,

      mimeType:
        data.mimeType,

      size:
        data.size,

      width:
        data.width ??
        null,

      height:
        data.height ??
        null,

      folderId:
        data.folderId ??
        null,

      url:
        `/media/${data.filename}`,
    });
  }

  /* =========================================
     DELETE ASSET
  ========================================= */

  async deleteAsset(
    id: number,
  ) {
    const asset =
      await db.orm.public.MediaAsset
        .where({ id })
        .first();

    if (!asset) {
      throw new NotFoundException(
        "Media asset not found",
      );
    }

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

    await db.orm.public.MediaAsset
      .where({ id })
      .delete();

    return {
      message:
        "Media deleted successfully",
    };
  }

  /* =========================================
     FIND PUBLIC FILE
  ========================================= */

  async findByFilename(
    filename: string,
  ) {
    return db.orm.public.MediaAsset
      .where({
        filename,
      })
      .first();
  }
}