"use client";

import { useEffect } from "react";

type Props = {
  nuggetId: string;
};

export default function TrackNuggetHistory({ nuggetId }: Props) {
  useEffect(() => {
    async function trackHistory() {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        await fetch("http://localhost:3001/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nuggetId,
            progress: 0,
          }),
        });
      } catch {
        // Don't block the page if history tracking fails
      }
    }

    trackHistory();
  }, [nuggetId]);

  return null;
}