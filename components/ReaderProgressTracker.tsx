"use client";

import { useEffect, useRef } from "react";

type Props = {
  nuggetId: string;
};

export default function ReaderProgressTracker({
  nuggetId,
}: Props) {
  const lastSavedProgress = useRef(-1);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    let timeout: ReturnType<typeof setTimeout> | null = null;

    async function saveProgress(progress: number) {
      if (!token) return;

      // Avoid sending the exact same progress repeatedly
      if (progress === lastSavedProgress.current) return;

      try {
        await fetch("http://localhost:3001/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nuggetId,
            progress,
          }),
        });

        lastSavedProgress.current = progress;
      } catch {
        // Don't interrupt reading if progress tracking fails
      }
    }

    function calculateProgress() {
      const scrollTop =
        window.scrollY || document.documentElement.scrollTop;

      const documentHeight =
        document.documentElement.scrollHeight -
        window.innerHeight;

      if (documentHeight <= 0) {
        saveProgress(100);
        return;
      }

      let progress = Math.round(
        (scrollTop / documentHeight) * 100
      );

      progress = Math.min(
        Math.max(progress, 0),
        100
      );

      /*
        Save in roughly 5% steps so we don't hit
        the backend every single pixel of scrolling.
      */
      const roundedProgress =
        progress >= 98
          ? 100
          : Math.floor(progress / 5) * 5;

      if (
        roundedProgress ===
        lastSavedProgress.current
      ) {
        return;
      }

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        saveProgress(roundedProgress);
      }, 400);
    }

    // Record that the reader was opened
    saveProgress(0);

    window.addEventListener(
      "scroll",
      calculateProgress,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      calculateProgress
    );

    calculateProgress();

    return () => {
      window.removeEventListener(
        "scroll",
        calculateProgress
      );

      window.removeEventListener(
        "resize",
        calculateProgress
      );

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [nuggetId]);

  return null;
}