"use client";

import { API_URL } from "@/lib/api";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  Play,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type HistoryItem = {
  nuggetId: string;
  progress: number;
};

export default function CollectionProgressActions({
  collectionSlug,
  nuggetIds,
  firstNuggetSlug,
}: {
  collectionSlug: string;
  nuggetIds: string[];
  firstNuggetSlug: string | null;
}) {
  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [bookmarked, setBookmarked] =
    useState(false);

  /*
   * LOAD REAL READING PROGRESS
   * FROM YOUR EXISTING BACKEND.
   */
  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    async function loadHistory() {
      try {
        const response = await fetch(
          `${API_URL}/history`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            "Could not load history",
          );
        }

        const data =
          await response.json();

        setHistory(
          Array.isArray(data)
            ? data
            : [],
        );
      } catch (error) {
        console.error(
          "Collection history error:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  /*
   * BOOKMARK COLLECTION
   *
   * Temporary browser persistence because
   * Collections do not yet have their own
   * backend table.
   */
  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(
          "bookmarkedCollections",
        ) ?? "[]",
      ) as string[];

      setBookmarked(
        stored.includes(
          collectionSlug,
        ),
      );
    } catch {
      setBookmarked(false);
    }
  }, [collectionSlug]);

  function toggleBookmark() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(
          "bookmarkedCollections",
        ) ?? "[]",
      ) as string[];

      const updated =
        stored.includes(
          collectionSlug,
        )
          ? stored.filter(
              (item) =>
                item !==
                collectionSlug,
            )
          : [
              ...stored,
              collectionSlug,
            ];

      localStorage.setItem(
        "bookmarkedCollections",
        JSON.stringify(updated),
      );

      setBookmarked(
        updated.includes(
          collectionSlug,
        ),
      );
    } catch {
      setBookmarked(
        (current) => !current,
      );
    }
  }

  /*
   * A unit counts as complete when
   * ReaderProgressTracker has stored 100%.
   */
  const completed = useMemo(() => {
    return nuggetIds.filter(
      (nuggetId) => {
        const record =
          history.find(
            (item) =>
              item.nuggetId ===
              nuggetId,
          );

        return (
          Number(
            record?.progress ??
              0,
          ) >= 100
        );
      },
    ).length;
  }, [history, nuggetIds]);

  const percentComplete =
    nuggetIds.length > 0
      ? Math.round(
          (completed /
            nuggetIds.length) *
            100,
        )
      : 0;

  return (
    <>
      {/* PROGRESS */}
      <div className="mt-6 max-w-[650px]">
        <div className="flex items-center justify-between gap-5 text-[13px]">
          <span className="text-white/45">
            {loading
              ? "Loading progress..."
              : `${completed} / ${nuggetIds.length} Completed`}
          </span>

          <span className="font-medium text-[#E28906]">
            {loading
              ? "—"
              : `${percentComplete}% Complete`}
          </span>
        </div>

        <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#E28906] transition-[width] duration-500"
            style={{
              width: `${percentComplete}%`,
            }}
          />
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex flex-wrap gap-3">
        {firstNuggetSlug ? (
          <Link
            href={`/nugget/${firstNuggetSlug}/reader`}
            className="bn-button inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#E28906] px-5 text-[13px] font-semibold text-[#080808] transition hover:bg-[#E28906]"
          >
            <Play
              size={14}
              fill="currentColor"
            />

            Start Reading Series
          </Link>
        ) : (
          <button
            disabled
            type="button"
            className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-lg bg-[#E28906]/40 px-5 text-[13px] font-semibold text-[#080808]/60"
          >
            <Play size={14} />

            Start Reading Series
          </button>
        )}

        <button
          type="button"
          onClick={toggleBookmark}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-5 text-[13px] font-medium transition ${
            bookmarked
              ? "border-[#E28906] bg-[#E28906]/10 text-[#E28906]"
              : "border-white/15 text-white/65 hover:border-[#E28906]/50 hover:text-white"
          }`}
        >
          {bookmarked ? (
            <BookmarkCheck
              size={15}
            />
          ) : (
            <Bookmark size={15} />
          )}

          {bookmarked
            ? "Path Bookmarked"
            : "Bookmark Path"}
        </button>
      </div>
    </>
  );
}