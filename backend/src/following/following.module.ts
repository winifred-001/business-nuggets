import { Module } from '@nestjs/common';
import { FollowingService } from './following.service';
import { FollowingController } from './following.controller';
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  providers: [FollowingService],
  controllers: [FollowingController]
})
export class FollowingModule {}
