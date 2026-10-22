"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminShell from "@/components/admin/AdminShell";

import {
  API_URL,
} from "@/lib/api";

type ChangeValue =
  | number
  | null;

type AnalyticsData = {
  days: number;

  metrics: {
    pageViews: {
      value: number;
      change: ChangeValue;
    };

    averageReadTime: {
      value: number;
      change: ChangeValue;
    };

    nuggetShares: {
      value: number;
      change: ChangeValue;
    };

    retention: {
      value: number;
      change: ChangeValue;
    };
  };

  traffic: {
    date: string;
    web: number;
    mobile: number;
  }[];

  topNuggets: {
    nuggetId: string;
    title: string;
    slug: string;
    views: number;
  }[];

  audience: {
    country: string;
    count: number;
    percentage: number;
  }[];
};

export default function AdminAnalyticsPage() {
  const [
    days,
    setDays,
  ] = useState(30);

  const [
    data,
    setData,
  ] =
    useState<AnalyticsData | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  function getToken() {
    return (
      localStorage.getItem(
        "adminToken",
      ) ||
      sessionStorage.getItem(
        "adminToken",
      )
    );
  }

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  async function loadAnalytics() {
    const token =
      getToken();

    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/analytics?days=${days}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const body =
        await response.json();

      if (!response.ok) {
        throw new Error(
          body.message ||
            "Could not load analytics.",
        );
      }

      setData(body);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load analytics.",
      );
    } finally {
      setLoading(false);
    }
  }

  const maxTraffic =
    useMemo(() => {
      if (!data) {
        return 1;
      }

      return Math.max(
        1,
        ...data.traffic.map(
          (item) =>
            item.web +
            item.mobile,
        ),
      );
    }, [data]);

  function exportCsv() {
    if (!data) {
      return;
    }

    const rows = [
      [
        "Date",
        "Web Views",
        "Mobile Views",
      ],

      ...data.traffic.map(
        (item) => [
          item.date,
          String(
            item.web,
          ),
          String(
            item.mobile,
          ),
        ],
      ),
    ];

    const csv =
      rows
        .map(
          (row) =>
            row.join(","),
        )
        .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv",
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const link =
      document.createElement(
        "a",
      );

    link.href =
      url;

    link.download =
      `analytics-${days}-days.csv`;

    link.click();

    URL.revokeObjectURL(
      url,
    );
  }

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {/* HEADER */}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[32px]">
              Analytics
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Performance across
              the website and
              mobile app.
            </p>
          </div>

          <div className="flex gap-3">
            <select
              value={days}
              onChange={(
                event,
              ) =>
                setDays(
                  Number(
                    event
                      .target
                      .value,
                  ),
                )
              }
              className="h-9 rounded-md border border-white/10 bg-[#111111] px-3 text-[8px] text-white/55 outline-none"
            >
              <option value={7}>
                Last 7 Days
              </option>

              <option value={30}>
                Last 30 Days
              </option>

              <option value={90}>
                Last 90 Days
              </option>
            </select>

            <button
              type="button"
              onClick={
                exportCsv
              }
              className="h-9 rounded-md bg-[#C8A35A] px-5 text-[8px] font-semibold text-[#080808]"
            >
              Export
            </button>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[10px] text-red-400">
            {error}
          </div>
        )}

        {/* METRICS */}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Page Views"
            value={
              loading
                ? "—"
                : formatNumber(
                    data?.metrics
                      .pageViews
                      .value ??
                      0,
                  )
            }
            change={
              data?.metrics
                .pageViews
                .change
            }
          />

          <MetricCard
            title="Avg. Read Time"
            value={
              loading
                ? "—"
                : formatDuration(
                    data?.metrics
                      .averageReadTime
                      .value ??
                      0,
                  )
            }
            change={
              data?.metrics
                .averageReadTime
                .change
            }
          />

          <MetricCard
            title="Nugget Shares"
            value={
              loading
                ? "—"
                : formatNumber(
                    data?.metrics
                      .nuggetShares
                      .value ??
                      0,
                  )
            }
            change={
              data?.metrics
                .nuggetShares
                .change
            }
          />

          <MetricCard
            title={`Retention (${days}d)`}
            value={
              loading
                ? "—"
                : `${data?.metrics.retention.value ?? 0}%`
            }
            change={
              data?.metrics
                .retention
                .change
            }
          />
        </section>

        {/* TRAFFIC */}

        <section className="mt-5 rounded-[10px] border border-white/10 bg-[#111111] p-5">
          <h2 className="font-serif text-[18px]">
            Traffic: Web vs Mobile
          </h2>

          <div className="mt-7 flex h-[190px] items-end gap-[5px] overflow-hidden">
            {data?.traffic.map(
              (item) => (
                <div
                  key={
                    item.date
                  }
                  className="flex min-w-0 flex-1 items-end justify-center gap-[2px]"
                  title={`${item.date}: ${item.web} web, ${item.mobile} mobile`}
                >
                  <div
                    className="w-[45%] rounded-t-sm bg-[#C8A35A]"
                    style={{
                      height:
                        `${Math.max(
                          3,
                          (item.web /
                            maxTraffic) *
                            170,
                        )}px`,
                    }}
                  />

                  <div
                    className="w-[45%] rounded-t-sm bg-[#6F5827]"
                    style={{
                      height:
                        `${Math.max(
                          3,
                          (item.mobile /
                            maxTraffic) *
                            170,
                        )}px`,
                    }}
                  />
                </div>
              ),
            )}
          </div>
        </section>

        {/* LOWER */}

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          {/* TOP NUGGETS */}

          <article className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h2 className="font-serif text-[18px]">
              Top Nuggets
            </h2>

            <div className="mt-3">
              {data?.topNuggets.map(
                (nugget) => (
                  <div
                    key={
                      nugget.nuggetId
                    }
                    className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-3 last:border-0"
                  >
                    <p className="truncate text-[8px] text-white/55">
                      {
                        nugget.title
                      }
                    </p>

                    <p className="shrink-0 text-[7px] text-[#C8A35A]">
                      {formatNumber(
                        nugget.views,
                      )}{" "}
                      views
                    </p>
                  </div>
                ),
              )}

              {!loading &&
                data?.topNuggets
                  .length ===
                  0 && (
                  <p className="py-8 text-center text-[9px] text-white/25">
                    No Nugget views
                    recorded yet.
                  </p>
                )}
            </div>
          </article>

          {/* AUDIENCE */}

          <article className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h2 className="font-serif text-[18px]">
              Audience
            </h2>

            <div className="mt-4 space-y-4">
              {data?.audience.map(
                (item) => (
                  <div
                    key={
                      item.country
                    }
                    className="grid grid-cols-[90px_1fr_35px] items-center gap-3"
                  >
                    <span className="truncate text-[8px] text-white/50">
                      {
                        item.country
                      }
                    </span>

                    <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.04]">
                      <div
                        className="h-full rounded-full bg-[#C8A35A]"
                        style={{
                          width:
                            `${item.percentage}%`,
                        }}
                      />
                    </div>

                    <span className="text-right text-[7px] text-white/30">
                      {
                        item.percentage
                      }
                      %
                    </span>
                  </div>
                ),
              )}

              {!loading &&
                data?.audience
                  .length ===
                  0 && (
                  <div className="py-8 text-center">
                    <p className="text-[9px] text-white/30">
                      No country
                      data yet.
                    </p>

                    <p className="mt-2 text-[7px] text-white/20">
                      Location is
                      only shown when
                      a client
                      supplies
                      country-level
                      analytics.
                    </p>
                  </div>
                )}
            </div>
          </article>
        </section>
      </main>
    </AdminShell>
  );
}

function MetricCard({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change?: ChangeValue;
}) {
  return (
    <article className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
      <p className="text-[8px] text-white/30">
        {title}
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-serif text-[25px] text-white/90">
          {value}
        </p>

        <span
          className={`text-[7px] ${
            change === null ||
            change === undefined
              ? "text-white/25"
              : change >= 0
                ? "text-emerald-400"
                : "text-red-400"
          }`}
        >
          {change === null ||
          change === undefined
            ? "New"
            : `${change >= 0 ? "+" : ""}${change}%`}
        </span>
      </div>
    </article>
  );
}

function formatNumber(
  value: number,
) {
  if (value >= 1000000) {
    return `${(
      value / 1000000
    ).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(
      value / 1000
    ).toFixed(1)}K`;
  }

  return String(value);
}

function formatDuration(
  seconds: number,
) {
  const minutes =
    Math.floor(
      seconds / 60,
    );

  const remaining =
    seconds % 60;

  return `${minutes}m ${remaining}s`;
}