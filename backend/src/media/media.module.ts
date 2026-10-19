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
  ],

  exports: [
    MediaService,
  ],
})
export class MediaModule {}