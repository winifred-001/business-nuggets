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
  AdminPermissionGuard,
  RequireAdminPermission,
} from "../auth/admin-permission.guard";

import {
  MediaService,
} from "./media.service";
import {
  CreateMediaFolderDto,
} from "./dto/create-media-folder.dto";

const legacyUploadDirectory =
  join(
    process.cwd(),
    "uploads",
    "media",
  );

const allowedImageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

function detectImageMimeType(
  buffer: Buffer,
): (typeof allowedImageMimeTypes)[number] | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
      ]),
    )
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 6
  ) {
    const header =
      buffer.subarray(0, 6).toString("ascii");

    if (
      header === "GIF87a" ||
      header === "GIF89a"
    ) {
      return "image/gif";
    }
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

@Controller("admin/media")
@UseGuards(
  JwtAuthGuard,
  AdminGuard,
  AdminPermissionGuard,
)
@RequireAdminPermission(
  "manageNuggets",
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
    body: CreateMediaFolderDto,
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
          if (
            !allowedImageMimeTypes.includes(
              file.mimetype as (typeof allowedImageMimeTypes)[number],
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

    const detectedMimeType =
      detectImageMimeType(
        file.buffer,
      );

    if (
      !detectedMimeType ||
      detectedMimeType !== file.mimetype
    ) {
      throw new BadRequestException(
        "Uploaded file content does not match an allowed image type",
      );
    }

    const folderId =
      body.folderId
        ? Number(
            body.folderId,
          )
        : null;

    if (
      folderId !== null &&
      (!Number.isInteger(
        folderId,
      ) ||
        folderId <= 0)
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
   PUBLIC MEDIA DELIVERY
========================================= */

@Controller("media")
export class MediaController {
  constructor(
    private readonly mediaService:
      MediaService,
  ) {}

  @Get("cloudinary/:id")
  async getCloudinaryAsset(
    @Param("id")
    id: string,

    @Res()
    response: Response,
  ) {
    response.setHeader(
      "Cross-Origin-Resource-Policy",
      "cross-origin",
    );

    const asset =
      await this.mediaService.findById(
        Number(id),
      );

    if (
      !asset ||
      !this.mediaService.isCloudinaryAsset(
        asset.url,
      )
    ) {
      response
        .status(404)
        .send(
          "File not found",
        );

      return;
    }

    response.redirect(
      302,
      asset.url,
    );
  }

  @Get(":filename")
  async getFile(
    @Param("filename")
    filename: string,

    @Res()
    response: Response,
  ) {
    response.setHeader(
      "Cross-Origin-Resource-Policy",
      "cross-origin",
    );

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
