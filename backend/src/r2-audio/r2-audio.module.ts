
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { R2AudioController } from './r2-audio.controller';
import { R2AudioService } from './r2-audio.service';

@Module({
  imports: [AuthModule],
  controllers: [R2AudioController],
  providers: [R2AudioService],
  exports: [R2AudioService],
})
export class R2AudioModule {}
