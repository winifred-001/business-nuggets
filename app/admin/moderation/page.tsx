"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
  MessageSquare,
  X,
} from "lucide-react";

import AdminShell from "@/components/AdminShell";
import { API_URL } from "@/lib/api";

type Status =
  | "pending"
  | "approved"
  | "flagged"
  | "rejected";

type CommentItem = {
  id: number;

  nuggetId: string;

  userId:
    | number
    | null;

  authorName: string;

  body: string;

  status: Status;

  reportCount: number;

  adminReply:
    | string
    | null;

  createdAt: string;

  nugget:
    | {
        id: string;
        title: string;
        slug: string;
        number: number;
      }
    | null;
};

type ModerationResponse = {
  comments:
    CommentItem[];

  counts: {
    pending: number;
    approved: number;
    flagged: number;
    rejected: number;
  };
};

const TABS: {
  value: Status;
  label: string;
}[] = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "flagged",
    label: "Flagged",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
];

export default function AdminModerationPage() {
  const [
    comments,
    setComments,
  ] =
    useState<
      CommentItem[]
    >([]);

  const [
    counts,
    setCounts,
  ] = useState({
    pending: 0,
    approved: 0,
    flagged: 0,
    rejected: 0,
  });

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<Status>(
      "pending",
    );

  const [
    selectedIds,
    setSelectedIds,
  ] =
    useState<number[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    bulkOpen,
    setBulkOpen,
  ] = useState(false);

  const [
    replyItem,
    setReplyItem,
  ] =
    useState<CommentItem | null>(
      null,
    );

  const [
    replyText,
    setReplyText,
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
    loadModeration();
  }, []);

  async function loadModeration() {
    const token =
      getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/admin/moderation`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data:
        ModerationResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          "Could not load moderation queue.",
        );
      }

      setComments(
        data.comments ??
          [],
      );

      setCounts(
        data.counts ?? {
          pending: 0,
          approved: 0,
          flagged: 0,
          rejected: 0,
        },
      );
    } catch (
      err
    ) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to server.",
      );
    } finally {
      setLoading(false);
    }
  }

  const visibleComments =
    useMemo(
      () =>
        comments.filter(
          (comment) =>
            comment.status ===
            activeTab,
        ),
      [
        comments,
        activeTab,
      ],
    );

  async function updateStatus(
    comment: CommentItem,
    status: Status,
  ) {
    const token =
      getToken();

    if (!token) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/moderation/${comment.id}/status`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                status,
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (!response.ok) {
        setError(
          data.message ||
            "Could not update comment.",
        );

        return;
      }

      setSuccess(
        status ===
          "approved"
          ? "Comment approved."
          : status ===
              "rejected"
            ? "Comment rejected."
            : "Comment updated.",
      );

      setSelectedIds(
        (current) =>
          current.filter(
            (id) =>
              id !==
              comment.id,
          ),
      );

      await loadModeration();
    } catch {
      setError(
        "Could not connect to server.",
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleSelected(
    id: number,
  ) {
    setSelectedIds(
      (current) =>
        current.includes(
          id,
        )
          ? current.filter(
              (item) =>
                item !== id,
            )
          : [
              ...current,
              id,
            ],
    );
  }

  async function runBulkAction(
    action:
      | "approve"
      | "reject"
      | "pending",
  ) {
    if (
      selectedIds.length ===
      0
    ) {
      setError(
        "Select at least one comment.",
      );

      return;
    }

    const token =
      getToken();

    if (!token) {
      return;
    }

    setSaving(true);
    setBulkOpen(false);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/moderation/bulk`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                ids:
                  selectedIds,

                action,
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (!response.ok) {
        setError(
          data.message ||
            "Bulk action failed.",
        );

        return;
      }

      setSelectedIds(
        [],
      );

      setSuccess(
        "Bulk action completed.",
      );

      await loadModeration();
    } catch {
      setError(
        "Could not connect to server.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openReply(
    comment: CommentItem,
  ) {
    setReplyItem(
      comment,
    );

    setReplyText(
      comment.adminReply ??
        "",
    );
  }

  async function saveReply() {
    if (
      !replyItem ||
      !replyText.trim()
    ) {
      setError(
        "Enter a reply first.",
      );

      return;
    }

    const token =
      getToken();

    if (!token) return;

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/moderation/${replyItem.id}/reply`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                reply:
                  replyText.trim(),
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (!response.ok) {
        setError(
          data.message ||
            "Could not save reply.",
        );

        return;
      }

      setReplyItem(
        null,
      );

      setReplyText(
        "",
      );

      setSuccess(
        "Reply saved.",
      );

      await loadModeration();
    } catch {
      setError(
        "Could not connect to server.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {/* HEADER */}

        <section className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[32px]">
              Moderation
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Review comments and
              reports from web and
              mobile.
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setBulkOpen(
                  (current) =>
                    !current,
                )
              }
              className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-4 text-[9px] text-white/50 hover:border-[#C8A35A]/30 hover:text-white"
            >
              Bulk Actions

              <ChevronDown
                size={11}
              />
            </button>

            {bulkOpen && (
              <div className="absolute right-0 top-11 z-40 w-[150px] rounded-md border border-white/10 bg-[#181818] py-1 shadow-xl">
                <button
                  type="button"
                  onClick={() =>
                    runBulkAction(
                      "approve",
                    )
                  }
                  className="w-full px-4 py-2.5 text-left text-[8px] text-white/55 hover:bg-white/[0.04]"
                >
                  Approve Selected
                </button>

                <button
                  type="button"
                  onClick={() =>
                    runBulkAction(
                      "reject",
                    )
                  }
                  className="w-full px-4 py-2.5 text-left text-[8px] text-white/55 hover:bg-white/[0.04]"
                >
                  Reject Selected
                </button>

                <button
                  type="button"
                  onClick={() =>
                    runBulkAction(
                      "pending",
                    )
                  }
                  className="w-full px-4 py-2.5 text-left text-[8px] text-white/55 hover:bg-white/[0.04]"
                >
                  Move to Pending
                </button>
              </div>
            )}
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[10px] text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3">
            <Check
              size={12}
              className="text-emerald-400"
            />

            <span className="text-[10px] text-emerald-400">
              {success}
            </span>
          </div>
        )}

        {/* TABS */}

        <div className="mt-5 flex flex-wrap gap-5 border-b border-white/[0.07]">
          {TABS.map(
            (tab) => {
              const count =
                counts[
                  tab.value
                ];

              return (
                <button
                  key={
                    tab.value
                  }
                  type="button"
                  onClick={() => {
                    setActiveTab(
                      tab.value,
                    );

                    setSelectedIds(
                      [],
                    );
                  }}
                  className={`border-b-2 pb-3 text-[8px] transition ${
                    activeTab ===
                    tab.value
                      ? "border-[#C8A35A] text-[#C8A35A]"
                      : "border-transparent text-white/35 hover:text-white/60"
                  }`}
                >
                  {tab.label}{" "}
                  ({count})
                </button>
              );
            },
          )}
        </div>

        {/* COMMENTS */}

        <section className="mt-4 space-y-3">
          {loading ? (
            Array.from({
              length: 4,
            }).map(
              (
                _,
                index,
              ) => (
                <div
                  key={
                    index
                  }
                  className="h-[110px] animate-pulse rounded-[8px] border border-white/[0.07] bg-[#111111]"
                />
              ),
            )
          ) : visibleComments.length >
            0 ? (
            visibleComments.map(
              (comment) => (
                <article
                  key={
                    comment.id
                  }
                  className="rounded-[8px] border border-white/[0.07] bg-[#111111] p-4"
                >
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(
                        comment.id,
                      )}
                      onChange={() =>
                        toggleSelected(
                          comment.id,
                        )
                      }
                      className="mt-2 h-3.5 w-3.5 accent-[#C8A35A]"
                    />

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C8A35A]/25 text-[8px] font-semibold text-[#E0C48A]">
                      {comment.authorName
                        .trim()
                        .charAt(
                          0,
                        )
                        .toUpperCase() ||
                        "A"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-medium text-white/75">
                            {
                              comment.authorName
                            }
                          </p>

                          <p className="mt-1 text-[7px] text-white/25">
                            on{" "}
                            {comment
                              .nugget
                              ?.title ||
                              "Unknown Nugget"}
                          </p>
                        </div>

                        {(comment.status ===
                          "flagged" ||
                          comment.reportCount >
                            0) && (
                          <span className="rounded-full border border-red-500/20 bg-red-500/[0.08] px-2 py-1 text-[6px] text-red-400">
                            {comment.reportCount >
                            0
                              ? `${comment.reportCount} report${comment.reportCount === 1 ? "" : "s"}`
                              : "Flagged"}
                          </span>
                        )}

                        {comment.status ===
                          "rejected" && (
                          <span className="rounded-full border border-red-500/20 bg-red-500/[0.08] px-2 py-1 text-[6px] text-red-400">
                            Rejected
                          </span>
                        )}
                      </div>

                      <p className="mt-4 text-[9px] leading-5 text-white/55">
                        {
                          comment.body
                        }
                      </p>

                      {comment.adminReply && (
                        <div className="mt-3 rounded-md border border-[#C8A35A]/15 bg-[#C8A35A]/[0.05] px-3 py-2">
                          <p className="text-[7px] text-[#C8A35A]">
                            Admin Reply
                          </p>

                          <p className="mt-1 text-[8px] leading-4 text-white/45">
                            {
                              comment.adminReply
                            }
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        {comment.status !==
                          "rejected" && (
                          <button
                            type="button"
                            disabled={
                              saving
                            }
                            onClick={() =>
                              updateStatus(
                                comment,
                                "rejected",
                              )
                            }
                            className="h-8 rounded-md border border-white/10 px-4 text-[8px] text-white/45 hover:text-white disabled:opacity-40"
                          >
                            Reject
                          </button>
                        )}

                        {comment.status !==
                          "approved" && (
                          <button
                            type="button"
                            disabled={
                              saving
                            }
                            onClick={() =>
                              updateStatus(
                                comment,
                                "approved",
                              )
                            }
                            className="h-8 rounded-md bg-[#C8A35A] px-4 text-[8px] font-semibold text-[#080808] hover:bg-[#E0C48A] disabled:opacity-40"
                          >
                            Approve
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            openReply(
                              comment,
                            )
                          }
                          className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 px-3 text-[8px] text-white/45 hover:text-white"
                        >
                          <MessageSquare
                            size={
                              10
                            }
                          />

                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ),
            )
          ) : (
            <div className="rounded-[8px] border border-white/[0.07] bg-[#111111] px-5 py-14 text-center">
              <MessageSquare
                size={22}
                className="mx-auto text-white/15"
              />

              <p className="mt-3 text-[10px] text-white/30">
                No{" "}
                {activeTab}{" "}
                comments.
              </p>
            </div>
          )}
        </section>

        {/* REPLY MODAL */}

        {replyItem && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[470px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-[24px]">
                    Reply
                  </h2>

                  <p className="mt-2 text-[8px] text-white/30">
                    Reply to{" "}
                    {
                      replyItem.authorName
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setReplyItem(
                      null,
                    )
                  }
                  className="text-white/30 hover:text-white"
                >
                  <X
                    size={
                      16
                    }
                  />
                </button>
              </div>

              <div className="mt-5 rounded-md border border-white/[0.07] bg-[#080808] p-4">
                <p className="text-[8px] leading-5 text-white/40">
                  {
                    replyItem.body
                  }
                </p>
              </div>

              <label className="mt-5 block text-[8px] text-white/35">
                Response
              </label>

              <textarea
                rows={5}
                value={
                  replyText
                }
                onChange={(
                  event,
                ) =>
                  setReplyText(
                    event
                      .target
                      .value,
                  )
                }
                className="mt-2 w-full resize-none rounded-md border border-white/10 bg-[#080808] px-3 py-3 text-[9px] leading-5 text-white outline-none focus:border-[#C8A35A]/35"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setReplyItem(
                      null,
                    )
                  }
                  className="h-9 rounded-md border border-white/10 px-4 text-[9px] text-white/40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    saveReply
                  }
                  className="h-9 rounded-md bg-[#C8A35A] px-5 text-[9px] font-semibold text-[#080808] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Reply"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}