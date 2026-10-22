"use client";

import {
  useEffect,
  useState,
} from "react";

import AdminShell from "@/components/admin/AdminShell";
import { API_URL } from "@/lib/api";

type AuditLog = {
  id: number;

  adminId:
    | number
    | null;

  adminEmail:
    | string
    | null;

  adminName: string;

  action: string;

  target:
    | string
    | null;

  method: string;
  path: string;

  result: string;

  createdAt: string;
};

export default function AdminAuditLogsPage() {
  const [
    logs,
    setLogs,
  ] =
    useState<
      AuditLog[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

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
    loadLogs();
  }, []);

  async function loadLogs() {
    const token =
      getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/audit-logs`,
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
          .catch(
            () => [],
          );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not load audit logs.",
        );
      }

      setLogs(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }

  function exportLogs() {
    if (
      logs.length ===
      0
    ) {
      return;
    }

    const rows = [
      [
        "Time",
        "Admin",
        "Email",
        "Action",
        "Target",
        "Result",
        "Method",
        "Path",
      ],

      ...logs.map(
        (log) => [
          formatCsvDate(
            log.createdAt,
          ),

          log.adminName,

          log.adminEmail ??
            "",

          log.action,

          log.target ??
            "",

          log.result,

          log.method,

          log.path,
        ],
      ),
    ];

    const csv =
      rows
        .map((row) =>
          row
            .map(
              escapeCsv,
            )
            .join(","),
        )
        .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8",
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
      `business-nuggets-audit-logs-${new Date()
        .toISOString()
        .slice(
          0,
          10,
        )}.csv`;

    document.body.appendChild(
      link,
    );

    link.click();

    link.remove();

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
              Audit Logs
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              A full record of
              admin activity.
            </p>
          </div>

          <button
            type="button"
            onClick={
              exportLogs
            }
            disabled={
              logs.length ===
              0
            }
            className="h-9 w-fit rounded-md border border-white/10 px-5 text-[8px] text-white/50 transition hover:border-[#C8A35A]/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Export Logs
          </button>
        </section>

        {error && (
          <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[10px] text-red-400">
            {error}
          </div>
        )}

        {/* TABLE */}

        <section className="mt-6 overflow-hidden rounded-[10px] border border-white/10 bg-[#111111]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-white/[0.07] text-[7px] uppercase tracking-[0.06em] text-white/25">
                  <th className="px-5 py-4 font-medium">
                    Time
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Admin
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Action
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Target
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Result
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({
                    length: 8,
                  }).map(
                    (
                      _,
                      index,
                    ) => (
                      <tr
                        key={
                          index
                        }
                        className="border-b border-white/[0.05]"
                      >
                        <td
                          colSpan={
                            5
                          }
                          className="px-5 py-4"
                        >
                          <div className="h-4 animate-pulse rounded bg-white/[0.04]" />
                        </td>
                      </tr>
                    ),
                  )
                ) : logs.length >
                  0 ? (
                  logs.map(
                    (log) => (
                      <tr
                        key={
                          log.id
                        }
                        className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.015]"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-[8px] text-white/40">
                          {formatDate(
                            log.createdAt,
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-[8px] text-white/55">
                            {
                              log.adminName
                            }
                          </p>

                          {log.adminEmail && (
                            <p className="mt-1 text-[6px] text-white/20">
                              {
                                log.adminEmail
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 text-[8px] text-white/45">
                          {
                            log.action
                          }
                        </td>

                        <td className="max-w-[220px] truncate px-4 py-4 text-[8px] text-white/35">
                          {log.target ||
                            "—"}
                        </td>

                        <td className="px-4 py-4">
                          <ResultBadge
                            result={
                              log.result
                            }
                          />
                        </td>
                      </tr>
                    ),
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={
                        5
                      }
                      className="px-5 py-16 text-center"
                    >
                      <p className="text-[10px] text-white/30">
                        No admin
                        activity has
                        been recorded
                        yet.
                      </p>

                      <p className="mt-2 text-[8px] text-white/20">
                        New admin
                        changes will
                        appear here
                        automatically.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AdminShell>
  );
}

function ResultBadge({
  result,
}: {
  result: string;
}) {
  const success =
    result.toLowerCase() ===
    "success";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[6px] capitalize ${
        success
          ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400"
          : "border-red-500/20 bg-red-500/[0.08] text-red-400"
      }`}
    >
      {result}
    </span>
  );
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      month:
        "short",

      day:
        "2-digit",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,
    },
  ).format(date);
}

function formatCsvDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toISOString();
}

function escapeCsv(
  value: string,
) {
  const text =
    String(
      value ?? "",
    );

  return `"${text.replace(
    /"/g,
    '""',
  )}"`;
}