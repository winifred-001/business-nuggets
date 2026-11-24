import { Module } from "@nestjs/common";
import { TopUpsController } from "./topups.controller";
import { AuthModule } from "../auth/auth.module";
import { TopUpsService } from "./topups.service";

@Module({ imports: [AuthModule], controllers: [TopUpsController], providers: [TopUpsService], exports: [TopUpsService] })
export class TopUpsModule {}
