import { Controller, Get, Param } from "@nestjs/common";
import { NuggetsService } from "./nuggets.service";

@Controller("nuggets")
export class NuggetsController {
  constructor(private readonly nuggetsService: NuggetsService) {}

  @Get()
  getPublishedNuggets() {
    return this.nuggetsService.getPublishedNuggets();
  }

  @Get(":slug")
  getNuggetBySlug(@Param("slug") slug: string) {
    return this.nuggetsService.getNuggetBySlug(slug);
  }
}