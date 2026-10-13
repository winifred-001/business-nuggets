"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw, Trash2 } from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { nuggets } from "@/lib/nuggets";

type HistoryItem = {
  id: number;
  nuggetId: string;
  progress: number;
  lastOpenedAt: string;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHistory() {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in to view your history.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Could not load history.");
        return;
      }

      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function removeFromHistory(nuggetId: string) {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:3001/history/${nuggetId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setHistory((current) =>
          current.filter((item) => item.nuggetId !== nuggetId)
        );
      }
    } catch {
      setError("Could not remove history item.");
    }
  }

  async function clearHistory() {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      await Promise.all(
        history.map((item) =>
          fetch(`http://localhost:3001/history/${item.nuggetId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      setHistory([]);
    } catch {
      setError("Could not clear history.");
    }
  }

  const historyNuggets = useMemo(() => {
    return history
      .map((item) => {
        const nugget = nuggets.find(
          (nugget) => nugget.id === item.nuggetId
        );

        if (!nugget) return null;

        return {
          ...item,
          nugget,
        };
      })
      .filter(Boolean);
  }, [history]);

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
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:py-14">
        {/* HEADER */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl">
              Listening Activity & Logs
            </h1>

            <p className="mt-2 text-xs text-gray-500 sm:text-sm">
              Track your deep study history and review recently discovered
              scripts.
            </p>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="flex w-fit items-center gap-2 rounded-md border border-red-900/60 px-4 py-2 text-xs text-red-400 transition hover:bg-red-950/20"
            >
              <Trash2 size={13} />
              Clear History
            </button>
          )}
        </div>

        {loading && (
          <p className="mt-10 text-sm text-gray-500">
            Loading history...
          </p>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && historyNuggets.length === 0 && (
          <div className="mt-10 rounded-xl border border-white/10 bg-[#101010] p-10 text-center">
            <h2 className="font-serif text-xl">
              No listening history yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Nuggets you open will appear here.
            </p>

            <Link
              href="/library"
              className="mt-5 inline-block rounded-md bg-amber-300 px-4 py-2.5 text-sm font-semibold text-black"
            >
              Explore Nuggets
            </Link>
          </div>
        )}

        {!loading && !error && historyNuggets.length > 0 && (
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
            {/* LEFT */}
            <section>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-300">
                  Listening History
                </h2>

                <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] text-gray-500">
                  {historyNuggets.length} sessions
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {historyNuggets.map((item: any) => {
                  const completed = item.progress >= 100;

                  return (
                    <article
                      key={item.id}
                      className="rounded-xl border border-white/10 bg-[#111] p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-wider">
                            <span className="text-amber-300">
                              {item.nugget.topic}
                            </span>

                            <span className="text-gray-700">•</span>

                            <span className="text-gray-500">
                              {formatDate(item.lastOpenedAt)}
                            </span>
                          </div>

                          <h3 className="mt-3 font-serif text-xl text-white">
                            {item.nugget.title}
                          </h3>

                          <p className="mt-2 font-serif text-xs italic text-gray-500">
                            {item.nugget.scriptureRef}
                          </p>
                        </div>

                        <div
                          className={`shrink-0 text-[10px] ${
                            completed
                              ? "text-emerald-400"
                              : "text-amber-300"
                          }`}
                        >
                          {completed ? "● Completed" : "In Progress"}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center gap-4">
                        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full bg-amber-300"
                            style={{
                              width: `${Math.min(
                                Math.max(item.progress || 0, 0),
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        <span className="w-8 text-right text-[10px] text-gray-500">
                          {item.progress || 0}%
                        </span>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            removeFromHistory(item.nuggetId)
                          }
                          className="text-[10px] text-gray-600 hover:text-red-400"
                        >
                          Remove
                        </button>

                        <Link
                          href={`/nugget/${item.nugget.slug}/reader`}
                          className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-[10px] text-white transition hover:border-white/20"
                        >
                          <RotateCcw size={12} />
                          {completed ? "Replay" : "Resume"}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* RIGHT */}
            <aside>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-300">
                Recently Viewed Pages
              </h2>

              <div className="mt-4 space-y-4">
                {recentPages.map((item: any, index) => (
                  <Link
                    key={item.id}
                    href={`/nugget/${item.nugget.slug}`}
                    className="block rounded-xl border border-white/10 bg-[#111] p-4 transition hover:border-white/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded bg-amber-300/10 px-2 py-1 text-[8px] uppercase tracking-wider text-amber-300">
                        {index === 0
                          ? "Commentary Page"
                          : "Topic Hub"}
                      </span>

                      <span className="text-[9px] text-gray-600">
                        {formatDate(item.lastOpenedAt)}
                      </span>
                    </div>

                    <h3 className="mt-4 font-serif text-base leading-snug">
                      {item.nugget.title}
                    </h3>

                    <p className="mt-2 text-[10px] text-gray-500">
                      {index === 0
                        ? item.nugget.scriptureRef
                        : `In ${item.nugget.topic}`}
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
  );
}