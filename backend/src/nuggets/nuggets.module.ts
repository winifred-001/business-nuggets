
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { R2AudioModule } from "../r2-audio/r2-audio.module";
import { NuggetsController } from "./nuggets.controller";
import { NuggetsService } from "./nuggets.service";

@Module({
  imports: [
    AuthModule,
    R2AudioModule,
  ],
  controllers: [NuggetsController],
  providers: [NuggetsService],
  exports: [NuggetsService],
})
export class NuggetsModule {}
