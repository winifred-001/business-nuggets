"use client";

import { useEffect, useRef, useState } from "react";
import { adminApiFetch } from "@/lib/admin-api";
import { readMediaResponse } from "@/lib/media-library";

export type R2MediaKind = "nuggets" | "images";
export type MediaMatchStatus = "idle" | "searching" | "matched" | "not_found" | "multiple" | "error";

type MatchResponse = {
  status: "matched" | "not_found" | "multiple";
  reference?: string;
};

export function useR2MediaAutoMatch(
  kind: R2MediaKind,
  number: number | string | undefined | null,
  currentUrl: string,
  onMatched: (reference: string) => void,
) {
  const [status, setStatus] = useState<MediaMatchStatus>("idle");
  const callback = useRef(onMatched);
  useEffect(() => { callback.current = onMatched; }, [onMatched]);

  useEffect(() => {
    const numericNumber = Number(number);
    if (!number || !Number.isSafeInteger(numericNumber) || numericNumber < 1 || currentUrl.trim()) {
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    setStatus("searching");
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = await adminApiFetch(
            `/r2-audio/match-media?kind=${encodeURIComponent(kind)}&number=${numericNumber}`,
            { cache: "no-store", signal: controller.signal },
          );
          const data = (await readMediaResponse(response)) as MatchResponse;
          if (controller.signal.aborted) return;
          if (data.status === "matched" && typeof data.reference === "string" &&
              (kind === "nuggets"
                ? data.reference.startsWith("r2://nuggets/")
                : data.reference.startsWith("/api/r2-image?key="))) {
            callback.current(data.reference);
            setStatus("matched");
          } else {
            setStatus(data.status);
          }
        } catch {
          if (!controller.signal.aborted) setStatus("error");
        }
      })();
    }, 500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [kind, number, currentUrl]);

  return status;
}
