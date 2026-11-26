import { Controller, Get } from '@nestjs/common';
import { TopicsService } from './topics.service';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topics: TopicsService) {}

  @Get('catalog')
  getCatalog() {
    return this.topics.getPublicCatalog();
  }
}
