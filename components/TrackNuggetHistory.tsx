"use client";

import { useEffect } from "react";
import { API_URL } from "@/lib/api";

type Props = {
  nuggetId: string;
};

export default function TrackNuggetHistory({ nuggetId }: Props) {
  useEffect(() => {
    async function trackHistory() {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        await fetch(`${API_URL}/history`, {
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