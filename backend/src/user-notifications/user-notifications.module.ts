import {
  Module,
} from "@nestjs/common";

import {
  AuthModule,
} from "../auth/auth.module";

import {
  UserNotificationsController,
} from "./user-notifications.controller";

import {
  UserNotificationsService,
} from "./user-notifications.service";

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    UserNotificationsController,
  ],

  providers: [
    UserNotificationsService,
  ],

  exports: [
    UserNotificationsService,
  ],
})
export class UserNotificationsModule {}