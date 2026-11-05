import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";

import {
  OptionalJwtAuthGuard,
} from "../auth/optional-jwt-auth.guard";

import {
  NuggetsService,
} from "./nuggets.service";

@Controller("nuggets")
@UseGuards(
  OptionalJwtAuthGuard,
)
export class NuggetsController {
  constructor(
    private readonly nuggetsService:
      NuggetsService,
  ) {}

  @Get()
  getPublishedNuggets(
    @Request()
    req: any,

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
      req.user?.sub
        ? Number(req.user.sub)
        : undefined,
    );
  }

  @Get(":slug")
  getNuggetBySlug(
    @Request()
    req: any,

    @Param("slug")
    slug: string,
  ) {
    return this.nuggetsService.getNuggetBySlug(
      slug,
      req.user?.sub
        ? Number(req.user.sub)
        : undefined,
    );
  }
}