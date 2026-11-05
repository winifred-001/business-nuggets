import { Module } from "@nestjs/common";
import { SavedNuggetsController } from "./saved-nuggets.controller";
import { SavedNuggetsService } from "./saved-nuggets.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [SavedNuggetsController],
  providers: [SavedNuggetsService],
})
export class SavedNuggetsModule {}