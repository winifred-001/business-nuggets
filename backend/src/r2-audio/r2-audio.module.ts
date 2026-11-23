import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AppSettingsModule } from '../app-settings/app-settings.module';
import { R2AudioController } from './r2-audio.controller';
import { R2AudioService } from './r2-audio.service';
import { R2BulkSongMatchService } from './r2-bulk-song-match.service';
import { R2BulkMediaMatchService } from './r2-bulk-media-match.service';
import { R2ImagePublicController } from './r2-image-public.controller';

@Module({
  imports: [AuthModule, AppSettingsModule],
  controllers: [R2AudioController, R2ImagePublicController],
  providers: [R2AudioService, R2BulkSongMatchService, R2BulkMediaMatchService],
  exports: [R2AudioService],
})
export class R2AudioModule {}
