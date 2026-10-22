import {
  Controller,
  Get,
  Param,
  Query,
} from "@nestjs/common";

import {
  NuggetsService,
} from "./nuggets.service";

@Controller("nuggets")
export class NuggetsController {
  constructor(
    private readonly nuggetsService:
      NuggetsService,
  ) {}

  @Get()
  getPublishedNuggets(
    @Query("search")
    search?: string,

    @Query("topic")
    topic?: string,

    @Query("book")
    book?: string,

    @Query("bibleSection")
    bibleSection?: string,

    @Query("gold")
    gold?: string,

    @Query("featured")
    featured?: string,

    @Query("sort")
    sort?: string,

    @Query("page")
    page?: string,

    @Query("limit")
    limit?: string,
  ) {
    return this.nuggetsService.getPublishedNuggets(
      {
        search,
        topic,
        book,
        bibleSection,
        gold,
        featured,
        sort,
        page,
        limit,
      },
    );
  }

  @Get(":slug")
  getNuggetBySlug(
    @Param("slug")
    slug: string,
  ) {
    return this.nuggetsService.getNuggetBySlug(
      slug,
    );
  }
}