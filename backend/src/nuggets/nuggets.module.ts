import { Module } from "@nestjs/common";
import { NuggetsController } from "./nuggets.controller";
import { NuggetsService } from "./nuggets.service";

@Module({
  controllers: [NuggetsController],
  providers: [NuggetsService],
  exports: [NuggetsService],
})
export class NuggetsModule {}