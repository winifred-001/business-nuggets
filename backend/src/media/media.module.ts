import {
  Module,
} from "@nestjs/common";

import {
  AuthModule,
} from "../auth/auth.module";

import {
  AdminMediaController,
  MediaController,
} from "./media.controller";

import {
  CloudinaryStorageService,
} from "./cloudinary-storage.service";

import {
  MediaService,
} from "./media.service";

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    AdminMediaController,
    MediaController,
  ],

  providers: [
    MediaService,
    CloudinaryStorageService,
  ],

  exports: [
    MediaService,
  ],
})
export class MediaModule {}
