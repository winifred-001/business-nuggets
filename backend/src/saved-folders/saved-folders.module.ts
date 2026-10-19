import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { SavedFoldersController } from "./saved-folders.controller";
import { SavedFoldersService } from "./saved-folders.service";

@Module({
  imports: [AuthModule],
  controllers: [SavedFoldersController],
  providers: [SavedFoldersService],
})
export class SavedFoldersModule {}