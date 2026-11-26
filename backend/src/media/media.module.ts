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
  ProfileImageController,
} from "./profile-image.controller";

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
    ProfileImageController,
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
