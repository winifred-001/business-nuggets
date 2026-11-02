"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw, Trash2 } from "lucide-react";

import AuthRouteGuard from "@/components/AuthRouteGuard";
import Footer from "@/components/Footer";
import Navbar from "@/components/navbar";
import { getPublishedNuggets } from "@/lib/nuggets-api";
import type { Nugget } from "@/types/nugget";

type HistoryItem = {
  id: number;
  nuggetId: string;
  progress: number;
  lastOpenedAt: string;
};

type HistoryNugget = HistoryItem & {
  nugget: Nugget;
};

type ApiMessage = {
  message?: string | string[];
};

function responseMessage(data: ApiMessage, fallback: string) {
  if (Array.isArray(data.message)) return data.message.join(", ");
  return data.message || fallback;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [apiNuggets, setApiNuggets] = useState<Nugget[]>([]);

  async function loadHistory() {
    setLoading(true);
    setError("");

    try {
      const [response, publishedNuggets] = await Promise.all([
        fetch("/api/member/proxy/history", {
          cache: "no-store",
        }),
        getPublishedNuggets(),
      ]);

      const data = (await response.json().catch(() => ({}))) as
        | HistoryItem[]
        | ApiMessage;

      if (!response.ok) {
        setError(
          response.status === 401
            ? "Please log in to view your history."
            : responseMessage(
                data as ApiMessage,
                "Could not load history.",
              ),
        );
        return;
      }

      setHistory(Array.isArray(data) ? data : []);
      setApiNuggets(publishedNuggets);
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  async function removeFromHistory(nuggetId: string) {
    setRemovingId(nuggetId);
    setError("");

    try {
      const response = await fetch(
        `/api/member/proxy/history/${encodeURIComponent(nuggetId)}`,
        {
          method: "DELETE",
        },
      );

      const data = (await response.json().catch(() => ({}))) as ApiMessage;

      if (!response.ok) {
        setError(
          response.status === 401
            ? "Your session has expired. Please log in again."
            : responseMessage(data, "Could not remove history item."),
        );
        return;
      }

      setHistory((current) =>
        current.filter((item) => item.nuggetId !== nuggetId),
      );
    } catch {
      setError("Could not remove history item.");
    } finally {
      setRemovingId(null);
    }
  }

  async function clearHistory() {
    if (history.length === 0 || clearing) return;

    setClearing(true);
    setError("");

    try {
      const responses = await Promise.all(
        history.map((item) =>
          fetch(
            `/api/member/proxy/history/${encodeURIComponent(item.nuggetId)}`,
            {
              method: "DELETE",
            },
          ),
        ),
      );

      const failedResponse = responses.find((response) => !response.ok);

      if (failedResponse) {
        const data = (await failedResponse
          .json()
          .catch(() => ({}))) as ApiMessage;

        setError(
          failedResponse.status === 401
            ? "Your session has expired. Please log in again."
            : responseMessage(data, "Could not clear history."),
        );

        await loadHistory();
        return;
      }

      setHistory([]);
    } catch {
      setError("Could not clear history.");
    } finally {
      setClearing(false);
    }
  }

  const historyNuggets = useMemo<HistoryNugget[]>(() => {
    return history
      .map((item) => {
        const nugget = apiNuggets.find(
          (candidate) => candidate.id === item.nuggetId,
        );

        if (!nugget) return null;

        return {
          ...item,
          nugget,
        };
      })
      .filter((item): item is HistoryNugget => Boolean(item));
  }, [history, apiNuggets]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);

    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const recentPages = historyNuggets.slice(0, 2);

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-black text-white">
        <Navbar />

        <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <Link
            href="/workspace"
            className="text-[14px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
          >
            ← My Wisdom Workspace
          </Link>

          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="bn-hero-title font-serif text-[45px] leading-tight">
                Listening Activity &amp; Logs
              </h1>

              <p className="mt-3 max-w-[720px] text-[14px] leading-6 text-white/40">
                Track your study history, resume unfinished Nuggets and revisit
                recently viewed teachings.
              </p>
            </div>

            {history.length > 0 && (
              <button
                type="button"
                disabled={clearing}
                onClick={() => void clearHistory()}
                className="flex w-fit items-center gap-2 rounded-md border border-red-900/60 px-4 py-2.5 text-[14px] text-red-400 transition hover:bg-red-950/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={15} />
                {clearing ? "Clearing..." : "Clear History"}
              </button>
            )}
          </div>

          {loading && (
            <p className="mt-10 text-[14px] text-white/40">
              Loading history...
            </p>
          )}

          {!loading && error && (
            <div className="mt-8 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-[14px] text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && historyNuggets.length === 0 && (
            <div className="mt-10 rounded-xl border border-white/10 bg-[#101010] p-10 text-center">
              <h2 className="font-serif text-[20px] leading-tight">
                No listening history yet
              </h2>

              <p className="mt-3 text-[14px] leading-6 text-white/40">
                Nuggets you open will appear here so you can return to them later.
              </p>

              <Link
                href="/library"
                className="bn-button mt-5 inline-block rounded-md bg-[#C8A35A] px-4 py-2.5 text-[14px] font-semibold text-black"
              >
                Explore Nuggets
              </Link>
            </div>
          )}

          {!loading && !error && historyNuggets.length > 0 && (
            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
              <section>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-serif text-[20px] leading-tight text-white/90">
                    Listening History
                  </h2>

                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[14px] text-white/40">
                    {historyNuggets.length} sessions
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {historyNuggets.map((item) => {
                    const completed = item.progress >= 100;

                    return (
                      <article
                        key={item.id}
                        className="rounded-xl border border-white/10 bg-[#111] p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-[14px]">
                              <span className="text-[#C8A35A]">
                                {item.nugget.topic}
                              </span>

                              <span className="text-white/20">•</span>

                              <span className="text-white/35">
                                {formatDate(item.lastOpenedAt)}
                              </span>
                            </div>

                            <h3 className="mt-3 font-serif text-[20px] leading-tight text-white">
                              {item.nugget.title}
                            </h3>

                            <p className="mt-2 text-[14px] italic text-white/40">
                              {item.nugget.scriptureRef}
                            </p>
                          </div>

                          <div
                            className={`shrink-0 text-[14px] ${
                              completed ? "text-emerald-400" : "text-[#C8A35A]"
                            }`}
                          >
                            {completed ? "Completed" : "In Progress"}
                          </div>
                        </div>

                        <div className="mt-6 flex items-center gap-4">
                          <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full bg-[#C8A35A]"
                              style={{
                                width: `${Math.min(
                                  Math.max(item.progress || 0, 0),
                                  100,
                                )}%`,
                              }}
                            />
                          </div>

                          <span className="w-12 text-right text-[14px] text-white/40">
                            {item.progress || 0}%
                          </span>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                          <button
                            type="button"
                            disabled={removingId === item.nuggetId}
                            onClick={() => void removeFromHistory(item.nuggetId)}
                            className="text-[14px] text-white/40 transition hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {removingId === item.nuggetId ? "Removing..." : "Remove"}
                          </button>

                          <Link
                            href={`/nugget/${item.nugget.slug}/reader`}
                            className="bn-button flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-[14px] text-white transition hover:border-[#C8A35A]/35"
                          >
                            <RotateCcw size={14} />
                            {completed ? "Replay" : "Resume"}
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <aside>
                <h2 className="font-serif text-[20px] leading-tight text-white/90">
                  Recently Viewed Pages
                </h2>

                <div className="mt-5 space-y-4">
                  {recentPages.map((item) => (
                    <Link
                      key={item.id}
                      href={`/nugget/${item.nugget.slug}`}
                      className="block rounded-xl border border-white/10 bg-[#111] p-4 transition hover:border-[#C8A35A]/35"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]">
                        <span className="text-[#C8A35A]">
                          {item.nugget.topic}
                        </span>

                        <span className="text-white/35">
                          {formatDate(item.lastOpenedAt)}
                        </span>
                      </div>

                      <h3 className="mt-4 font-serif text-[20px] leading-tight text-white/90">
                        {item.nugget.title}
                      </h3>

                      <p className="mt-2 text-[14px] text-white/40">
                        {item.nugget.scriptureRef}
                      </p>
                    </Link>
                  ))}
                </div>
              </aside>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}
