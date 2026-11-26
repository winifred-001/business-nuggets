import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { R2AudioService } from '../r2-audio/r2-audio.service';
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
    private readonly r2Audio: R2AudioService,
  ) {}

  @Get()
  async getPublishedNuggets(
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
    const result = await this.nuggetsService.getPublishedNuggets(
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
      req.user?.sub ? Number(req.user.sub) : undefined,
    );

    return {
      ...result,
      data: await Promise.all(
        result.data.map(async (nugget) => ({
          ...nugget,
          audioUrl: await this.r2Audio.resolvePlaybackUrl(
            nugget.audioUrl,
          ),
          nuggetAudioUrl: await this.r2Audio.resolvePlaybackUrl(
            nugget.nuggetAudioUrl,
          ),
        })),
      ),
    };

  }

  @Get(":slug")
  async getNuggetBySlug(
    @Request()
    req: any,

    @Param("slug")
    slug: string,
  ) {
    const nugget = await this.nuggetsService.getNuggetBySlug(
      slug,
      req.user?.sub ? Number(req.user.sub) : undefined
    );
    return {
      ...nugget,
      audioUrl: await this.r2Audio.resolvePlaybackUrl(
        nugget.audioUrl,
      ),
      nuggetAudioUrl: await this.r2Audio.resolvePlaybackUrl(
        nugget.nuggetAudioUrl,
      ),
    };
  }
}