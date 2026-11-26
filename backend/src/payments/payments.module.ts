import {
  Module,
} from "@nestjs/common";
import { TopUpsModule } from "../topups/topups.module";

import { AuthModule } from "../auth/auth.module";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { PaymentsController } from "./payments.controller";
import { PaystackCallbackController } from "./paystack-callback.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [
    AuthModule,
    SubscriptionsModule,
    TopUpsModule,
  ],

  controllers: [
    PaymentsController,
    PaystackCallbackController,
  ],

  providers: [
    PaymentsService,
  ],
})
export class PaymentsModule {}
