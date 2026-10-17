import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AuthModule } from "../auth/auth.module";
import { NuggetsModule } from "../nuggets/nuggets.module";

@Module({
  imports: [AuthModule, NuggetsModule],
  controllers: [AdminController],
})
export class AdminModule {}