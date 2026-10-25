import {
  Module,
} from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [
    AuthModule,
    SubscriptionsModule,
  ],

  controllers: [
    PaymentsController,
  ],

  providers: [
    PaymentsService,
  ],
})
export class PaymentsModule {}
