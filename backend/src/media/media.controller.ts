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
} from "@nestjs/common";

import {
  FileInterceptor,
} from "@nestjs/platform-express";

import {
  memoryStorage,
} from "multer";

import {
  join,
  basename,
} from "path";

import type {
  Response,
} from "express";

import {
  JwtAuthGuard,
} from "../auth/jwt-auth.guard";

import {
  AdminGuard,
} from "../auth/admin.guard";

import {
  MediaService,
} from "./media.service";

const legacyUploadDirectory =
  join(
    process.cwd(),
    "uploads",
    "media",
  );

@Controller("admin/media")
@UseGuards(
  JwtAuthGuard,
  AdminGuard,
)
export class AdminMediaController {
  constructor(
    private readonly mediaService:
      MediaService,
  ) {}

  @Get()
  getLibrary() {
    return this.mediaService.getLibrary();
  }

  @Post("folders")
  createFolder(
    @Body()
    body: {
      name: string;
    },
  ) {
    return this.mediaService.createFolder(
      body.name,
    );
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor(
      "file",
      {
        storage:
          memoryStorage(),

        limits: {
          fileSize:
            10 *
            1024 *
            1024,
        },

        fileFilter: (
          _request,
          file,
          callback,
        ) => {
          const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ];

          if (
            !allowed.includes(
              file.mimetype,
            )
          ) {
            callback(
              new BadRequestException(
                "Only JPG, PNG, WEBP and GIF images are allowed",
              ),
              false,
            );

            return;
          }

          callback(
            null,
            true,
          );
        },
      },
    ),
  )
  async uploadFile(
    @UploadedFile()
    file:
      | Express.Multer.File
      | undefined,

    @Body()
    body: {
      folderId?: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException(
        "Choose an image to upload",
      );
    }

    const folderId =
      body.folderId
        ? Number(
            body.folderId,
          )
        : null;

    if (
      body.folderId &&
      (!Number.isInteger(
        folderId,
      ) ||
        Number(folderId) <= 0)
    ) {
      throw new BadRequestException(
        "Invalid media folder",
      );
    }

    return this.mediaService.uploadAsset(
      file,
      folderId,
    );
  }

  @Delete(":id")
  deleteAsset(
    @Param("id")
    id: string,
  ) {
    return this.mediaService.deleteAsset(
      Number(id),
    );
  }
}

/* =========================================
   LEGACY PUBLIC MEDIA FILES
   New uploads use Cloudinary secure URLs.
========================================= */

@Controller("media")
export class MediaController {
  constructor(
    private readonly mediaService:
      MediaService,
  ) {}

  @Get(":filename")
  async getFile(
    @Param("filename")
    filename: string,

    @Res()
    response: Response,
  ) {
    const safeFilename =
      basename(
        filename,
      );

    const asset =
      await this.mediaService.findByFilename(
        safeFilename,
      );

    if (!asset) {
      response
        .status(404)
        .send(
          "File not found",
        );

      return;
    }

    response.sendFile(
      safeFilename,
      {
        root:
          legacyUploadDirectory,
      },
    );
  }
}
