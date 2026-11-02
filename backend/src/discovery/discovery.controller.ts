import { Controller, Get, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { DiscoveryService } from "./discovery.service";

@Controller("discovery")
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get("popular-nuggets")
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  getPopularNuggets(
    @Query("limit") limit?: string,
    @Query("days") days?: string,
  ) {
    return this.discoveryService.getPopularNuggets(
      Number.parseInt(limit ?? "5", 10),
      Number.parseInt(days ?? "30", 10),
    );
  }
}
