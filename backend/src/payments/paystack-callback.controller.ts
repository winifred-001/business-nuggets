import {
  Controller,
  Get,
  Query,
  Res,
} from "@nestjs/common";

@Controller("callback")
export class PaystackCallbackController {
  @Get("paystack")
  handlePaystackCallback(
    @Query("reference")
    reference: string | undefined,

    @Query("trxref")
    trxref: string | undefined,

    @Res()
    res: any,
  ) {
    const frontendUrl =
      (
        process.env.FRONTEND_URL ||
        "https://business-nuggets-theta.vercel.app"
      ).replace(/\/$/, "");

    const paymentReference =
      reference || trxref;

    const callbackUrl =
      paymentReference
        ? `${frontendUrl}/payment/callback?reference=${encodeURIComponent(
            paymentReference,
          )}`
        : `${frontendUrl}/payment/callback`;

    return res.redirect(
      302,
      callbackUrl,
    );
  }
}
