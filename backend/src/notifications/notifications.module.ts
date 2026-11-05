import {
  Module,
} from "@nestjs/common";

import {
  NotificationsService,
} from "./notifications.service";

import {
  UserNotificationsModule,
} from "../user-notifications/user-notifications.module";

@Module({
  imports: [
    UserNotificationsModule,
  ],

  providers: [
    NotificationsService,
  ],

  exports: [
    NotificationsService,
  ],
})
export class NotificationsModule {}