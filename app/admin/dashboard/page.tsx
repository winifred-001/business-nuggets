"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowUpRight,
  FileText,
  Layers3,
  Plus,
  Sparkles,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import { API_URL } from "@/lib/api";

import type { Nugget } from "@/types/nugget";

type AdminNugget = Nugget & {
  status: "draft" | "published";
  featured?: boolean;
  audioUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  publishedAt: string | null;
};
export default function AdminDashboardPage() {
  const [nuggets, setNuggets] =
    useState<AdminNugget[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      const token =
        localStorage.getItem(
          "adminToken",
        ) ||
        sessionStorage.getItem(
          "adminToken",
        );

      if (!token) return;

      try {
        const response =
          await fetch(
            `${API_URL}/admin/nuggets`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const data =
          await response
            .json()
            .catch(() => []);

        if (!response.ok) {
          setError(
            data.message ||
              "Could not load dashboard.",
          );

          return;
        }

        setNuggets(
          Array.isArray(data)
            ? data
            : [],
        );
      } catch {
        setError(
          "Could not connect to the server.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  /* =========================================
     REAL STATS FROM ADMIN NUGGETS API
  ========================================= */

  const stats =
    useMemo(() => {
      const published =
        nuggets.filter(
          (item) =>
            item.status ===
            "published",
        ).length;

      const drafts =
        nuggets.filter(
          (item) =>
            item.status ===
            "draft",
        ).length;

      const gold =
        nuggets.filter(
          (item) =>
            item.isGold,
        ).length;

      return {
        total:
          nuggets.length,

        published,

        drafts,

        gold,
      };
    }, [nuggets]);

  /* =========================================
     TOP TOPICS
  ========================================= */

  const topTopics =
    useMemo(() => {
      const counts =
        new Map<
          string,
          number
        >();

      for (
        const nugget
        of nuggets
      ) {
        const topic =
          nugget.topic ||
          "Uncategorized";

        counts.set(
          topic,
          (counts.get(
            topic,
          ) ?? 0) + 1,
        );
      }

      return [
        ...counts.entries(),
      ]
        .sort(
          (a, b) =>
            b[1] - a[1],
        )
        .slice(0, 5);
    }, [nuggets]);

  /* =========================================
     RECENT NUGGETS
  ========================================= */

  const recentNuggets =
    useMemo(() => {
      return [...nuggets]
        .sort(
          (a, b) =>
            b.number -
            a.number,
        )
        .slice(0, 4);
    }, [nuggets]);

  const maximumTopicCount =
    topTopics[0]?.[1] ||
    1;

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {/* HEADER */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[32px] leading-tight">
              Dashboard
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Welcome back. Here
              is how Business
              Nuggets content is
              performing.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="min-h-9 rounded-md border border-white/10 px-4 text-[9px] text-white/55 transition hover:border-[#C8A35A]/30 hover:text-white"
            >
              Export Report
            </button>

            <Link
              href="/admin/nuggets/new"
              className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[#C8A35A] px-4 text-[9px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
            >
              <Plus
                size={12}
              />

              New Nugget
            </Link>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[10px] text-red-400">
            {error}
          </div>
        )}

        {/* METRICS */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Nuggets"
            value={
              loading
                ? "..."
                : stats.total.toLocaleString()
            }
            icon={
              FileText
            }
          />

          <MetricCard
            label="Published"
            value={
              loading
                ? "..."
                : stats.published.toLocaleString()
            }
            icon={
              Sparkles
            }
          />

          <MetricCard
            label="Drafts"
            value={
              loading
                ? "..."
                : stats.drafts.toLocaleString()
            }
            icon={
              Layers3
            }
          />

          <MetricCard
            label="GOLD Teachings"
            value={
              loading
                ? "..."
                : stats.gold.toLocaleString()
            }
            icon={
              ArrowUpRight
            }
          />
        </section>

        {/* MAIN GRID */}

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_0.8fr]">
          {/* CONTENT STATUS */}

          <div className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h2 className="font-serif text-[18px]">
              Content Overview
            </h2>

            <p className="mt-2 text-[9px] text-white/30">
              Current Nugget
              publishing status.
            </p>

            <div className="mt-8 space-y-6">
              <ProgressRow
                label="Published"
                value={
                  stats.published
                }
                total={
                  stats.total
                }
              />

              <ProgressRow
                label="Draft"
                value={
                  stats.drafts
                }
                total={
                  stats.total
                }
              />

              <ProgressRow
                label="GOLD"
                value={
                  stats.gold
                }
                total={
                  stats.total
                }
              />
            </div>
          </div>

          {/* TOP TOPICS */}

          <div className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h2 className="font-serif text-[18px]">
              Top Core Topics
            </h2>

            {topTopics.length ===
            0 ? (
              <p className="mt-5 text-[10px] text-white/30">
                No topic data yet.
              </p>
            ) : (
              <div className="mt-5 space-y-5">
                {topTopics.map(
                  ([
                    topic,
                    count,
                  ]) => (
                    <div
                      key={
                        topic
                      }
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-[9px] text-white/60">
                          {topic}
                        </p>

                        <span className="text-[8px] text-white/25">
                          {
                            count
                          }
                        </span>
                      </div>

                      <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-[#C8A35A]"
                          style={{
                            width:
                              `${Math.max(
                                8,
                                (count /
                                  maximumTopicCount) *
                                  100,
                              )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        {/* BOTTOM GRID */}

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_0.8fr]">
          {/* RECENT NUGGETS */}

          <div className="overflow-hidden rounded-[10px] border border-white/10 bg-[#111111]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <h2 className="font-serif text-[18px]">
                Recent Nuggets
              </h2>

              <Link
                href="/admin/nuggets"
                className="text-[8px] text-[#C8A35A]"
              >
                View All →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[7px] uppercase tracking-[0.07em] text-white/25">
                    <th className="px-5 py-3 font-medium">
                      Title
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Topic
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentNuggets.map(
                    (
                      nugget,
                    ) => (
                      <tr
                        key={
                          nugget.id
                        }
                        className="border-b border-white/[0.05] last:border-0"
                      >
                        <td className="px-5 py-4 text-[9px] text-white/65">
                          {
                            nugget.title
                          }
                        </td>

                        <td className="px-4 py-4 text-[8px] text-white/35">
                          {
                            nugget.topic
                          }
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={
                              nugget.status
                            }
                          />
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>

              {!loading &&
                recentNuggets.length ===
                  0 && (
                  <div className="px-5 py-10 text-center text-[10px] text-white/30">
                    No Nuggets
                    have been
                    created yet.
                  </div>
                )}
            </div>
          </div>

          {/* SYSTEM NOTES */}

          <div className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h2 className="font-serif text-[18px]">
              Pending Actions
            </h2>

            <div className="mt-5 space-y-3">
              <ActionRow
                label={`${stats.drafts} draft ${
                  stats.drafts ===
                  1
                    ? "Nugget"
                    : "Nuggets"
                }`}
                action="Review"
                href="/admin/nuggets"
              />

              <ActionRow
                label={`${stats.gold} GOLD ${
                  stats.gold ===
                  1
                    ? "teaching"
                    : "teachings"
                }`}
                action="Library"
                href="/admin/nuggets"
              />
            </div>

            <div className="mt-5 rounded-md border border-white/[0.07] bg-[#080808] p-4">
              <p className="text-[9px] font-medium text-white/55">
                More admin metrics
                will appear here as
                their backend
                systems are added.
              </p>

              <p className="mt-2 text-[8px] leading-4 text-white/25">
                Member activity,
                revenue, app
                installs and
                moderation counts
                are not currently
                stored by the
                backend, so this
                dashboard does not
                invent those
                values.
              </p>
            </div>
          </div>
        </section>
      </main>
    </AdminShell>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-[9px] border border-white/10 bg-[#111111] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[8px] text-white/35">
            {label}
          </p>

          <p className="mt-3 font-serif text-[25px]">
            {value}
          </p>
        </div>

        <Icon
          size={15}
          className="text-[#C8A35A]"
        />
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) *
            100,
        )
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-white/55">
          {label}
        </span>

        <span className="text-[8px] text-white/25">
          {value}
        </span>
      </div>

      <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-[#C8A35A]"
          style={{
            width:
              `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status?.toLowerCase();

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[7px] font-medium capitalize ${
        normalized ===
        "published"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : normalized ===
              "draft"
            ? "border-[#C8A35A]/20 bg-[#C8A35A]/10 text-[#E0C48A]"
            : "border-white/10 bg-white/[0.04] text-white/40"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function ActionRow({
  label,
  action,
  href,
}: {
  label: string;
  action: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-md border border-white/[0.07] bg-[#080808] px-4 py-3 transition hover:border-[#C8A35A]/25"
    >
      <span className="text-[9px] text-white/50">
        {label}
      </span>

      <span className="text-[8px] text-[#C8A35A]">
        {action}
      </span>
    </Link>
  );
}