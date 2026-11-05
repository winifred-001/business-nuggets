"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  API_URL,
} from "@/lib/api";

const VISITOR_KEY =
  "businessNuggetsVisitorId";

function getVisitorId() {
  let visitorId =
    localStorage.getItem(
      VISITOR_KEY,
    );

  if (!visitorId) {
    visitorId =
      typeof crypto !==
        "undefined" &&
      "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    localStorage.setItem(
      VISITOR_KEY,
      visitorId,
    );
  }

  return visitorId;
}

export async function trackAnalyticsEvent(
  data: {
    eventType:
      | "view"
      | "read"
      | "share";

    nuggetId: string;

    durationSeconds?: number;

    platform?: string;
  },
) {
  try {
    const visitorId =
      getVisitorId();

    await fetch(
      `${API_URL}/analytics/events`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            visitorId,

            eventType:
              data.eventType,

            nuggetId:
              data.nuggetId,

            durationSeconds:
              data.durationSeconds,

            platform:
              data.platform ??
              "web",
          }),

        keepalive: true,
      },
    );
  } catch {
    // Analytics should never
    // break the page.
  }
}

export default function NuggetAnalyticsTracker({
  nuggetId,
}: {
  nuggetId: string;
}) {
  const startedAt =
    useRef<number>(
      Date.now(),
    );

  const sentRead =
    useRef(false);

  useEffect(() => {
    trackAnalyticsEvent({
      eventType: "view",
      nuggetId,
    });

    const sendRead =
      () => {
        if (
          sentRead.current
        ) {
          return;
        }

        sentRead.current =
          true;

        const seconds =
          Math.max(
            1,
            Math.round(
              (Date.now() -
                startedAt.current) /
                1000,
            ),
          );

        trackAnalyticsEvent({
          eventType:
            "read",

          nuggetId,

          durationSeconds:
            seconds,
        });
      };

    window.addEventListener(
      "pagehide",
      sendRead,
    );

    return () => {
      window.removeEventListener(
        "pagehide",
        sendRead,
      );

      sendRead();
    };
  }, [nuggetId]);

  return null;
}