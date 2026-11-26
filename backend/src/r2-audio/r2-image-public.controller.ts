import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { R2AudioService } from './r2-audio.service';

// Images used as published covers are public. R2 credentials remain on the API.
@Controller('r2-images')
export class R2ImagePublicController {
  constructor(private readonly storage: R2AudioService) {}

  @Get('cover')
  async cover(@Query('key') key: string, @Res() response: Response) {
    const image = await this.storage.getCoverImage(key);
    response.setHeader('Content-Type', image.mimeType);
    response.setHeader('Content-Length', String(image.bytes.length));
    response.setHeader('Cache-Control', 'public, max-age=3600');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    response.status(200).send(image.bytes);
  }
}
