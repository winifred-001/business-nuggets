import { Injectable } from "@nestjs/common";

import { db } from "../prisma/db";

@Injectable()
export class DiscoveryService {
  async getPopularNuggets(requestedLimit = 5, requestedDays = 30) {
    const limit = Math.min(Math.max(requestedLimit || 5, 1), 20);
    const days = Math.min(Math.max(requestedDays || 30, 1), 90);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [events, nuggets] = await Promise.all([
      db.orm.public.AnalyticsEvent.all(),
      db.orm.public.Nugget.where({ status: "published" }).all(),
    ]);

    const publishedIds = new Set(nuggets.map((nugget) => nugget.id));
    const views = new Map<string, number>();

    for (const event of events) {
      if (
        event.eventType !== "view" ||
        !event.nuggetId ||
        !publishedIds.has(event.nuggetId) ||
        new Date(event.createdAt) < since
      ) {
        continue;
      }

      views.set(event.nuggetId, (views.get(event.nuggetId) ?? 0) + 1);
    }

    const ranked = [...views.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([nuggetId, viewCount]) => {
        const nugget = nuggets.find((item) => item.id === nuggetId);
        return {
          nuggetId,
          slug: nugget?.slug ?? "",
          title: nugget?.title ?? "",
          topic: nugget?.topic ?? "",
          viewCount,
        };
      });

    return {
      days,
      data: ranked,
    };
  }
}
