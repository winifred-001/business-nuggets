import {
  Module,
} from "@nestjs/common";

import {
  RolesAccessService,
} from "./roles-access.service";

@Module({
  providers: [
    RolesAccessService,
  ],

  exports: [
    RolesAccessService,
  ],
})
export class RolesAccessModule {}