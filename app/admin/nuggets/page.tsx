"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import { API_URL } from "@/lib/api";

import type { Nugget } from "@/types/nugget";

type AdminNugget = Omit<
  Nugget,
  "publishedAt"
> & {
  publishedAt:
    | string
    | null;

  status:
    | "draft"
    | "published";

  featured?: boolean;

  audioUrl?:
    | string
    | null;

  createdAt?: string;
  updatedAt?: string;
};

const PAGE_SIZE = 8;

export default function AdminNuggetsPage() {
  const [nuggets, setNuggets] =
    useState<AdminNugget[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    topicFilter,
    setTopicFilter,
  ] = useState("all");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    sortOrder,
    setSortOrder,
  ] = useState<
    "newest" | "oldest"
  >("newest");

  const [
    activeTab,
    setActiveTab,
  ] = useState<
    "all" | "published" | "draft"
  >("all");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    menuOpen,
    setMenuOpen,
  ] = useState<
    string | null
  >(null);

  const [
    deletingId,
    setDeletingId,
  ] = useState<
    string | null
  >(null);

  /* =========================================
     LOAD NUGGETS
  ========================================= */

  useEffect(() => {
    loadNuggets();
  }, []);

  async function loadNuggets() {
    const token =
      localStorage.getItem(
        "adminToken",
      ) ||
      sessionStorage.getItem(
        "adminToken",
      );

    if (!token) {
      return;
    }

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
            "Could not load Nuggets.",
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

  /* =========================================
     DELETE
  ========================================= */

  async function deleteNugget(
    nugget: AdminNugget,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${nugget.title}"? This cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    const token =
      localStorage.getItem(
        "adminToken",
      ) ||
      sessionStorage.getItem(
        "adminToken",
      );

    if (!token) return;

    setDeletingId(
      nugget.id,
    );

    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/nuggets/${encodeURIComponent(
            nugget.id,
          )}`,
          {
            method:
              "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ||
            "Could not delete Nugget.",
        );

        return;
      }

      setNuggets(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              nugget.id,
          ),
      );

      setMenuOpen(null);
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setDeletingId(
        null,
      );
    }
  }

  /* =========================================
     COUNTS
  ========================================= */

  const counts =
    useMemo(() => {
      return {
        all:
          nuggets.length,

        published:
          nuggets.filter(
            (nugget) =>
              nugget.status ===
              "published",
          ).length,

        draft:
          nuggets.filter(
            (nugget) =>
              nugget.status ===
              "draft",
          ).length,
      };
    }, [nuggets]);

  /* =========================================
     TOPICS
  ========================================= */

  const topics =
    useMemo(() => {
      return [
        ...new Set(
          nuggets
            .map(
              (nugget) =>
                nugget.topic,
            )
            .filter(Boolean),
        ),
      ].sort();
    }, [nuggets]);

  /* =========================================
     FILTER
  ========================================= */

  const filteredNuggets =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      const result =
        nuggets.filter(
          (nugget) => {
            const matchesTab =
              activeTab ===
                "all" ||
              nugget.status ===
                activeTab;

            const matchesStatus =
              statusFilter ===
                "all" ||
              nugget.status ===
                statusFilter;

            const matchesTopic =
              topicFilter ===
                "all" ||
              nugget.topic ===
                topicFilter;

            const matchesSearch =
              !query ||
              nugget.title
                .toLowerCase()
                .includes(
                  query,
                ) ||
              nugget.topic
                .toLowerCase()
                .includes(
                  query,
                ) ||
              nugget.scriptureRef
                .toLowerCase()
                .includes(
                  query,
                ) ||
              nugget.tag
                .toLowerCase()
                .includes(
                  query,
                );

            return (
              matchesTab &&
              matchesStatus &&
              matchesTopic &&
              matchesSearch
            );
          },
        );

      result.sort(
        (a, b) => {
          const aTime =
            new Date(
              a.updatedAt ||
                a.publishedAt ||
                a.createdAt ||
                0,
            ).getTime();

          const bTime =
            new Date(
              b.updatedAt ||
                b.publishedAt ||
                b.createdAt ||
                0,
            ).getTime();

          if (
            aTime === bTime
          ) {
            return sortOrder ===
              "newest"
              ? b.number -
                  a.number
              : a.number -
                  b.number;
          }

          return sortOrder ===
            "newest"
            ? bTime -
                aTime
            : aTime -
                bTime;
        },
      );

      return result;
    }, [
      nuggets,
      activeTab,
      statusFilter,
      topicFilter,
      searchQuery,
      sortOrder,
    ]);

  /* =========================================
     PAGINATION
  ========================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredNuggets.length /
          PAGE_SIZE,
      ),
    );

  const safePage =
    Math.min(
      currentPage,
      totalPages,
    );

  const startIndex =
    (safePage - 1) *
    PAGE_SIZE;

  const paginatedNuggets =
    filteredNuggets.slice(
      startIndex,
      startIndex +
        PAGE_SIZE,
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    topicFilter,
    statusFilter,
    activeTab,
    sortOrder,
  ]);

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {/* =================================
            HEADER
        ================================= */}

        <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[32px] leading-tight">
              Nuggets
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Create, edit and publish
              biblical business wisdom.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled
              title="Bulk import is not connected to the backend yet."
              className="min-h-9 rounded-md border border-white/10 px-4 text-[9px] text-white/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Import
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
        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
            <p className="text-[10px] text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* =================================
            FILTERS
        ================================= */}

        <section className="mt-6 flex flex-col gap-3 lg:flex-row">
          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
            />

            <input
              type="text"
              value={
                searchQuery
              }
              onChange={(
                event,
              ) =>
                setSearchQuery(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Search nuggets..."
              className="h-10 w-full rounded-md border border-white/10 bg-[#111111] pl-9 pr-4 text-[10px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
            />
          </div>

          {/* TOPIC */}

          <select
            value={
              topicFilter
            }
            onChange={(
              event,
            ) =>
              setTopicFilter(
                event
                  .target
                  .value,
              )
            }
            className="h-10 min-w-[150px] rounded-md border border-white/10 bg-[#111111] px-3 text-[9px] text-white/55 outline-none"
          >
            <option value="all">
              All Topics
            </option>

            {topics.map(
              (topic) => (
                <option
                  key={
                    topic
                  }
                  value={
                    topic
                  }
                >
                  {topic}
                </option>
              ),
            )}
          </select>

          {/* STATUS */}

          <select
            value={
              statusFilter
            }
            onChange={(
              event,
            ) =>
              setStatusFilter(
                event
                  .target
                  .value,
              )
            }
            className="h-10 min-w-[140px] rounded-md border border-white/10 bg-[#111111] px-3 text-[9px] text-white/55 outline-none"
          >
            <option value="all">
              All Status
            </option>

            <option value="published">
              Published
            </option>

            <option value="draft">
              Draft
            </option>
          </select>

          {/* SORT */}

          <select
            value={
              sortOrder
            }
            onChange={(
              event,
            ) =>
              setSortOrder(
                event
                  .target
                  .value as
                  | "newest"
                  | "oldest",
              )
            }
            className="h-10 min-w-[145px] rounded-md border border-white/10 bg-[#111111] px-3 text-[9px] text-white/55 outline-none"
          >
            <option value="newest">
              Newest First
            </option>

            <option value="oldest">
              Oldest First
            </option>
          </select>
        </section>

        {/* =================================
            STATUS TABS
        ================================= */}

        <section className="mt-5 flex gap-6 overflow-x-auto border-b border-white/[0.07]">
          <TabButton
            label={`All (${counts.all})`}
            active={
              activeTab ===
              "all"
            }
            onClick={() =>
              setActiveTab(
                "all",
              )
            }
          />

          <TabButton
            label={`Published (${counts.published})`}
            active={
              activeTab ===
              "published"
            }
            onClick={() =>
              setActiveTab(
                "published",
              )
            }
          />

          <TabButton
            label={`Drafts (${counts.draft})`}
            active={
              activeTab ===
              "draft"
            }
            onClick={() =>
              setActiveTab(
                "draft",
              )
            }
          />
        </section>

        {/* =================================
            TABLE
        ================================= */}

        <section className="mt-3 overflow-visible rounded-[10px] border border-white/10 bg-[#111111]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-white/[0.07] text-[7px] uppercase tracking-[0.07em] text-white/25">
                  <th className="px-5 py-3 font-medium">
                    Title
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Topic
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Scripture
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Date
                  </th>

                  <th className="w-[50px] px-4 py-3" />
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({
                    length: 5,
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
                            6
                          }
                          className="px-5 py-4"
                        >
                          <div className="h-5 animate-pulse rounded bg-white/[0.04]" />
                        </td>
                      </tr>
                    ),
                  )
                ) : paginatedNuggets.length >
                  0 ? (
                  paginatedNuggets.map(
                    (
                      nugget,
                    ) => (
                      <tr
                        key={
                          nugget.id
                        }
                        className="border-b border-white/[0.05] last:border-0"
                      >
                        {/* TITLE */}

                        <td className="max-w-[310px] px-5 py-4">
                          <Link
                            href={`/admin/nuggets/${nugget.id}/edit`}
                            className="block truncate text-[9px] text-white/70 transition hover:text-[#C8A35A]"
                          >
                            {
                              nugget.title
                            }
                          </Link>

                          {nugget.isGold && (
                            <span className="mt-1 inline-block text-[7px] font-semibold uppercase tracking-[0.06em] text-[#C8A35A]">
                              Gold
                            </span>
                          )}
                        </td>

                        {/* TOPIC */}

                        <td className="px-4 py-4 text-[8px] text-white/40">
                          {
                            nugget.topic
                          }
                        </td>

                        {/* SCRIPTURE */}

                        <td className="px-4 py-4 text-[8px] text-white/40">
                          {
                            nugget.scriptureRef
                          }
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={
                              nugget.status
                            }
                          />
                        </td>

                        {/* DATE */}

                        <td className="px-4 py-4 text-[8px] text-white/35">
                          {formatDate(
                            nugget.publishedAt ||
                              nugget.updatedAt ||
                              nugget.createdAt,
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td className="relative px-4 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuOpen(
                                (
                                  current,
                                ) =>
                                  current ===
                                  nugget.id
                                    ? null
                                    : nugget.id,
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded text-white/30 transition hover:bg-white/[0.05] hover:text-white"
                          >
                            <MoreHorizontal
                              size={
                                15
                              }
                            />
                          </button>

                          {menuOpen ===
                            nugget.id && (
                            <div className="absolute right-4 top-[45px] z-30 w-[150px] overflow-hidden rounded-md border border-white/10 bg-[#181818] shadow-2xl">
                              <Link
                                href={`/admin/nuggets/${nugget.id}/edit`}
                                className="flex items-center gap-3 px-4 py-3 text-[9px] text-white/60 transition hover:bg-white/[0.04] hover:text-white"
                              >
                                <Pencil
                                  size={
                                    12
                                  }
                                />

                                Edit
                              </Link>

                              <Link
                                href={`/nugget/${nugget.slug}`}
                                target="_blank"
                                className="flex items-center gap-3 px-4 py-3 text-[9px] text-white/60 transition hover:bg-white/[0.04] hover:text-white"
                              >
                                <Eye
                                  size={
                                    12
                                  }
                                />

                                View
                              </Link>

                              <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  nugget.id
                                }
                                onClick={() =>
                                  deleteNugget(
                                    nugget,
                                  )
                                }
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[9px] text-red-400 transition hover:bg-red-500/[0.06] disabled:opacity-40"
                              >
                                <Trash2
                                  size={
                                    12
                                  }
                                />

                                {deletingId ===
                                nugget.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ),
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-14 text-center"
                    >
                      <p className="text-[11px] text-white/35">
                        No Nuggets
                        match your
                        current
                        filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* =================================
              FOOTER / PAGINATION
          ================================= */}

          <div className="flex flex-col gap-4 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[8px] text-white/25">
              {filteredNuggets.length ===
              0
                ? "Showing 0 results"
                : `Showing ${
                    startIndex +
                    1
                  }–${Math.min(
                    startIndex +
                      PAGE_SIZE,
                    filteredNuggets.length,
                  )} of ${
                    filteredNuggets.length
                  }`}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  safePage <= 1
                }
                onClick={() =>
                  setCurrentPage(
                    (
                      current,
                    ) =>
                      Math.max(
                        1,
                        current -
                          1,
                      ),
                  )
                }
                className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/35 transition hover:border-[#C8A35A]/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              >
                <ChevronLeft
                  size={12}
                />
              </button>

              {Array.from({
                length:
                  totalPages,
              })
                .slice(0, 5)
                .map(
                  (
                    _,
                    index,
                  ) => {
                    const page =
                      index +
                      1;

                    return (
                      <button
                        key={
                          page
                        }
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            page,
                          )
                        }
                        className={`flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-[8px] transition ${
                          safePage ===
                          page
                            ? "border-[#C8A35A]/40 bg-[#C8A35A]/15 text-[#E0C48A]"
                            : "border-white/10 text-white/35 hover:text-white"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  },
                )}

              <button
                type="button"
                disabled={
                  safePage >=
                  totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (
                      current,
                    ) =>
                      Math.min(
                        totalPages,
                        current +
                          1,
                      ),
                  )
                }
                className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/35 transition hover:border-[#C8A35A]/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              >
                <ChevronRight
                  size={12}
                />
              </button>
            </div>
          </div>
        </section>
      </main>
    </AdminShell>
  );
}

/* =========================================
   STATUS TAB
========================================= */

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 pb-3 text-[9px] transition ${
        active
          ? "text-[#C8A35A]"
          : "text-white/35 hover:text-white"
      }`}
    >
      {label}

      {active && (
        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#C8A35A]" />
      )}
    </button>
  );
}

/* =========================================
   STATUS BADGE
========================================= */

function StatusBadge({
  status,
}: {
  status:
    | "draft"
    | "published";
}) {
  if (
    status ===
    "published"
  ) {
    return (
      <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[7px] font-medium text-emerald-400">
        Published
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-[#C8A35A]/20 bg-[#C8A35A]/10 px-2.5 py-1 text-[7px] font-medium text-[#E0C48A]">
      Draft
    </span>
  );
}

/* =========================================
   DATE FORMAT
========================================= */

function formatDate(
  value?:
    | string
    | null,
) {
  if (!value) {
    return "—";
  }

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
      month: "short",
      day: "2-digit",
    },
  ).format(date);
}