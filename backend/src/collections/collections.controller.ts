import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}
  @Get() list() { return this.collections.publicList(); }
  @Get(':slug') async get(@Param('slug') slug: string) {
    const item = (await this.collections.publicList()).find(collection => collection.slug === slug);
    if (!item) throw new NotFoundException('Collection not found.');
    return item;
  }
}
