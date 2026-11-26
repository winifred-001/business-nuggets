import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TopUpsService } from "./topups.service";

@Controller("topups")
export class TopUpsController {
  constructor(private readonly topups: TopUpsService) {}

  @Get("bundles")
  listBundles() { return this.topups.listBundles(); }

  @Get("wallet")
  @UseGuards(JwtAuthGuard)
  getWallet(@Request() req: any) { return this.topups.getWallet(Number(req.user.sub)); }
}
