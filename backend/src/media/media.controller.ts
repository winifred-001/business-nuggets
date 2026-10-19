import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";

import {
  FileInterceptor,
} from "@nestjs/platform-express";

import {
  diskStorage,
} from "multer";

import {
  randomUUID,
} from "crypto";

import {
  extname,
  join,
  basename,
} from "path";

import {
  mkdirSync,
} from "fs";

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

const uploadDirectory =
  join(
    process.cwd(),
    "uploads",
    "media",
  );

mkdirSync(
  uploadDirectory,
  {
    recursive: true,
  },
);

const storage =
  diskStorage({
    destination:
      uploadDirectory,

    filename: (
      _request,
      file,
      callback,
    ) => {
      const extension =
        extname(
          file.originalname,
        ).toLowerCase();

      callback(
        null,
        `${randomUUID()}${extension}`,
      );
    },
  });

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
        storage,

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
      width?: string;
      height?: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException(
        "Choose an image to upload",
      );
    }

    return this.mediaService.createAsset({
      filename:
        file.filename,

      originalName:
        file.originalname,

      mimeType:
        file.mimetype,

      size:
        file.size,

      folderId:
        body.folderId
          ? Number(
              body.folderId,
            )
          : null,

      width:
        body.width
          ? Number(
              body.width,
            )
          : null,

      height:
        body.height
          ? Number(
              body.height,
            )
          : null,
    });
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
   PUBLIC MEDIA FILES
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
          uploadDirectory,
      },
    );
  }
}