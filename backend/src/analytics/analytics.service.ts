import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";

import { db } from "../prisma/db";

type AnalyticsEventType =
  | "view"
  | "read"
  | "share";

@Injectable()
export class AnalyticsService {
  async recordEvent(data: {
    visitorId: string;
    eventType: AnalyticsEventType;
    nuggetId?: string;
    platform?: string;
    durationSeconds?: number;
    country?: string;
  }) {
    const visitorId =
      data.visitorId?.trim();

    if (!visitorId) {
      throw new BadRequestException(
        "Visitor ID is required",
      );
    }

    const allowedEvents = [
      "view",
      "read",
      "share",
    ];

    if (
      !allowedEvents.includes(
        data.eventType,
      )
    ) {
      throw new BadRequestException(
        "Invalid analytics event",
      );
    }

    const allowedPlatforms = [
      "web",
      "ios",
      "android",
    ];

    const platform =
      allowedPlatforms.includes(
        data.platform ?? "",
      )
        ? data.platform!
        : "web";

    let durationSeconds:
      | number
      | null = null;

    if (
      data.durationSeconds !==
      undefined
    ) {
      durationSeconds =
        Math.max(
          0,
          Math.min(
            Math.round(
              data.durationSeconds,
            ),
            14400,
          ),
        );
    }

    const event =
      await db.orm.public.AnalyticsEvent.create({
        visitorId,

        eventType:
          data.eventType,

        nuggetId:
          data.nuggetId ??
          null,

        platform,

        durationSeconds,

        country:
          data.country
            ?.trim() ||
          null,
      });

    if (!event) {
      throw new BadRequestException(
        "Could not record analytics event",
      );
    }

    return {
      recorded: true,
    };
  }

  async getAdminAnalytics(
    requestedDays = 30,
  ) {
    const days =
      [7, 30, 90].includes(
        requestedDays,
      )
        ? requestedDays
        : 30;

    const [
      events,
      nuggets,
    ] =
      await Promise.all([
        db.orm.public.AnalyticsEvent.all(),

        db.orm.public.Nugget.all(),
      ]);

    const now =
      new Date();

    const currentStart =
      new Date(now);

    currentStart.setDate(
      currentStart.getDate() -
        days +
        1,
    );

    currentStart.setHours(
      0,
      0,
      0,
      0,
    );

    const previousStart =
      new Date(
        currentStart,
      );

    previousStart.setDate(
      previousStart.getDate() -
        days,
    );

    const currentEvents =
      events.filter(
        (event) => {
          const created =
            new Date(
              event.createdAt,
            );

          return (
            created >=
              currentStart &&
            created <= now
          );
        },
      );

    const previousEvents =
      events.filter(
        (event) => {
          const created =
            new Date(
              event.createdAt,
            );

          return (
            created >=
              previousStart &&
            created <
              currentStart
          );
        },
      );

    const currentViews =
      currentEvents.filter(
        (event) =>
          event.eventType ===
          "view",
      );

    const previousViews =
      previousEvents.filter(
        (event) =>
          event.eventType ===
          "view",
      );

    const currentShares =
      currentEvents.filter(
        (event) =>
          event.eventType ===
          "share",
      );

    const previousShares =
      previousEvents.filter(
        (event) =>
          event.eventType ===
          "share",
      );

    const currentReads =
      currentEvents.filter(
        (event) =>
          event.eventType ===
            "read" &&
          typeof event.durationSeconds ===
            "number",
      );

    const previousReads =
      previousEvents.filter(
        (event) =>
          event.eventType ===
            "read" &&
          typeof event.durationSeconds ===
            "number",
      );

    const averageReadTime =
      this.average(
        currentReads.map(
          (event) =>
            event.durationSeconds ??
            0,
        ),
      );

    const previousAverageReadTime =
      this.average(
        previousReads.map(
          (event) =>
            event.durationSeconds ??
            0,
        ),
      );

    const retention =
      this.calculateRetention(
        currentViews,
      );

    const previousRetention =
      this.calculateRetention(
        previousViews,
      );

    /* =====================================
       DAILY WEB VS MOBILE
    ===================================== */

    const traffic =
      Array.from({
        length: days,
      }).map(
        (_, index) => {
          const date =
            new Date(
              currentStart,
            );

          date.setDate(
            currentStart.getDate() +
              index,
          );

          const dateKey =
            this.dateKey(
              date,
            );

          const dayEvents =
            currentViews.filter(
              (event) =>
                this.dateKey(
                  new Date(
                    event.createdAt,
                  ),
                ) ===
                dateKey,
            );

          return {
            date:
              dateKey,

            web:
              dayEvents.filter(
                (event) =>
                  event.platform ===
                  "web",
              ).length,

            mobile:
              dayEvents.filter(
                (event) =>
                  event.platform ===
                    "ios" ||
                  event.platform ===
                    "android",
              ).length,
          };
        },
      );

    /* =====================================
       TOP NUGGETS
    ===================================== */

    const nuggetViews =
      new Map<
        string,
        number
      >();

    for (
      const event of
      currentViews
    ) {
      if (
        !event.nuggetId
      ) {
        continue;
      }

      nuggetViews.set(
        event.nuggetId,
        (nuggetViews.get(
          event.nuggetId,
        ) ?? 0) + 1,
      );
    }

    const topNuggets =
      [...nuggetViews.entries()]
        .map(
          ([
            nuggetId,
            views,
          ]) => {
            const nugget =
              nuggets.find(
                (item) =>
                  item.id ===
                  nuggetId,
              );

            return {
              nuggetId,

              title:
                nugget?.title ??
                "Unknown Nugget",

              slug:
                nugget?.slug ??
                "",

              views,
            };
          },
        )
        .sort(
          (a, b) =>
            b.views -
            a.views,
        )
        .slice(0, 5);

    /* =====================================
       AUDIENCE COUNTRY
    ===================================== */

    const countries =
      new Map<
        string,
        number
      >();

    for (
      const event of
      currentViews
    ) {
      const country =
        event.country?.trim();

      if (!country) {
        continue;
      }

      countries.set(
        country,
        (countries.get(
          country,
        ) ?? 0) + 1,
      );
    }

    const countryTotal =
      [...countries.values()]
        .reduce(
          (
            total,
            value,
          ) =>
            total +
            value,
          0,
        );

    const audience =
      [...countries.entries()]
        .map(
          ([
            country,
            count,
          ]) => ({
            country,

            count,

            percentage:
              countryTotal >
              0
                ? Math.round(
                    (count /
                      countryTotal) *
                      100,
                  )
                : 0,
          }),
        )
        .sort(
          (a, b) =>
            b.count -
            a.count,
        )
        .slice(0, 5);

    return {
      days,

      metrics: {
        pageViews: {
          value:
            currentViews.length,

          change:
            this.change(
              currentViews.length,
              previousViews.length,
            ),
        },

        averageReadTime: {
          value:
            averageReadTime,

          change:
            this.change(
              averageReadTime,
              previousAverageReadTime,
            ),
        },

        nuggetShares: {
          value:
            currentShares.length,

          change:
            this.change(
              currentShares.length,
              previousShares.length,
            ),
        },

        retention: {
          value:
            retention,

          change:
            this.change(
              retention,
              previousRetention,
            ),
        },
      },

      traffic,

      topNuggets,

      audience,
    };
  }

  private average(
    values: number[],
  ) {
    if (
      values.length ===
      0
    ) {
      return 0;
    }

    return Math.round(
      values.reduce(
        (
          total,
          value,
        ) =>
          total +
          value,
        0,
      ) /
        values.length,
    );
  }

  private calculateRetention(
    views: {
      visitorId: string;
      createdAt: string;
    }[],
  ) {
    if (
      views.length ===
      0
    ) {
      return 0;
    }

    const visitorDays =
      new Map<
        string,
        Set<string>
      >();

    for (
      const view of views
    ) {
      if (
        !visitorDays.has(
          view.visitorId,
        )
      ) {
        visitorDays.set(
          view.visitorId,
          new Set(),
        );
      }

      visitorDays
        .get(
          view.visitorId,
        )!
        .add(
          this.dateKey(
            new Date(
              view.createdAt,
            ),
          ),
        );
    }

    const returning =
      [...visitorDays.values()]
        .filter(
          (days) =>
            days.size >= 2,
        ).length;

    return Math.round(
      (returning /
        visitorDays.size) *
        100,
    );
  }

  private change(
    current: number,
    previous: number,
  ) {
    if (
      previous === 0
    ) {
      return current === 0
        ? 0
        : null;
    }

    return Math.round(
      ((current -
        previous) /
        previous) *
        100,
    );
  }

  private dateKey(
    date: Date,
  ) {
    return [
      date.getFullYear(),

      String(
        date.getMonth() +
          1,
      ).padStart(
        2,
        "0",
      ),

      String(
        date.getDate(),
      ).padStart(
        2,
        "0",
      ),
    ].join("-");
  }
}