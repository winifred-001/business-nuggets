"use client";

import { useEffect, useRef, useState } from "react";
import { adminApiFetch } from "@/lib/admin-api";
import { readMediaResponse } from "@/lib/media-library";

type MatchStatus =
  | "idle"
  | "searching"
  | "matched"
  | "not_found"
  | "multiple"
  | "error";

type MatchResponse = {
  status: "matched" | "not_found" | "multiple";
  reference?: string;
};

export function useR2SongAutoMatch(
  number: number | string | null | undefined,
  songUrl: string,
  onMatched: (reference: string) => void,
) {
  const [status, setStatus] = useState<MatchStatus>("idle");
  const onMatchedRef = useRef(onMatched);

  useEffect(() => {
    onMatchedRef.current = onMatched;
  }, [onMatched]);

  useEffect(() => {
    const value = Number(number);

    if (
      number === undefined ||
      number === null ||
      number === "" ||
      !Number.isSafeInteger(value) ||
      value < 1 ||
      songUrl.trim()
    ) {
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    setStatus("searching");

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = await adminApiFetch(
            `/r2-audio/match-song?number=${value}`,
            {
              cache: "no-store",
              signal: controller.signal,
            },
          );

          const data = (await readMediaResponse(response)) as MatchResponse;
          if (controller.signal.aborted) return;

          if (
            data.status === "matched" &&
            typeof data.reference === "string" &&
            data.reference.startsWith("r2://song/")
          ) {
            onMatchedRef.current(data.reference);
            setStatus("matched");
            return;
          }

          setStatus(data.status);
        } catch {
          if (!controller.signal.aborted) setStatus("error");
        }
      })();
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [number, songUrl]);

  return status;
}
