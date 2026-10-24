import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NuggetsController } from "./nuggets.controller";
import { NuggetsService } from "./nuggets.service";

@Module({
  imports: [AuthModule],
  controllers: [NuggetsController],
  providers: [NuggetsService],
  exports: [NuggetsService],
})
export class NuggetsModule {}