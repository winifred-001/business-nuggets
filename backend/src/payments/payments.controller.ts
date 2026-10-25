import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly paymentsService:
      PaymentsService,
  ) {}

  @Get("plans")
  getPlans() {
    return this.paymentsService.getPlans();
  }

  @Post("initialize")
  @UseGuards(JwtAuthGuard)
  initializePayment(
    @Request()
    req: any,

    @Body()
    body: {
      planSlug: string;
    },
  ) {
    return this.paymentsService.initializePayment(
      req.user.sub,
      body.planSlug,
    );
  }

  @Get("verify/:reference")
  @UseGuards(JwtAuthGuard)
  verifyPayment(
    @Request()
    req: any,

    @Param("reference")
    reference: string,
  ) {
    return this.paymentsService.verifyPaymentForUser(
      req.user.sub,
      reference,
    );
  }

  @Post("webhook")
  webhook(
    @Request()
    req: any,

    @Headers(
      "x-paystack-signature",
    )
    signature?: string,
  ) {
    const rawBody =
      Buffer.isBuffer(
        req.rawBody,
      )
        ? req.rawBody
        : Buffer.from(
            JSON.stringify(
              req.body ?? {},
            ),
          );

    return this.paymentsService.handleWebhook(
      rawBody,
      signature,
      req.body ?? {},
    );
  }
}
