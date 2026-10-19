"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  X,
} from "lucide-react";

import AdminShell from "@/components/AdminShell";
import { API_URL } from "@/lib/api";

type Topic = {
  id: number;

  name: string;
  slug: string;

  description:
    | string
    | null;

  visible: boolean;

  displayOrder: number;

  nuggetCount: number;

  createdAt?: string;
  updatedAt?: string;
};

export default function AdminTopicsPage() {
  const [topics, setTopics] =
    useState<Topic[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingTopic,
    setEditingTopic,
  ] =
    useState<Topic | null>(
      null,
    );

  const [name, setName] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [visible, setVisible] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  /* =========================================
     TOKEN
  ========================================= */

  function getAdminToken() {
    return (
      localStorage.getItem(
        "adminToken",
      ) ||
      sessionStorage.getItem(
        "adminToken",
      )
    );
  }

  /* =========================================
     LOAD
  ========================================= */

  useEffect(() => {
    loadTopics();
  }, []);

  async function loadTopics() {
    const token =
      getAdminToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/admin/topics`,
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
            "Could not load topics.",
        );

        return;
      }

      setTopics(
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
     OPEN CREATE
  ========================================= */

  function openCreate() {
    setEditingTopic(null);

    setName("");
    setDescription("");
    setVisible(true);

    setError("");
    setSuccess("");

    setModalOpen(true);
  }

  /* =========================================
     OPEN EDIT
  ========================================= */

  function openEdit(
    topic: Topic,
  ) {
    setEditingTopic(
      topic,
    );

    setName(topic.name);

    setDescription(
      topic.description || "",
    );

    setVisible(
      topic.visible,
    );

    setError("");
    setSuccess("");

    setModalOpen(true);
  }

  /* =========================================
     SAVE TOPIC
  ========================================= */

  async function saveTopic() {
    if (!name.trim()) {
      setError(
        "Enter a topic name.",
      );

      return;
    }

    const token =
      getAdminToken();

    if (!token) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const url =
        editingTopic
          ? `${API_URL}/admin/topics/${editingTopic.id}`
          : `${API_URL}/admin/topics`;

      const response =
        await fetch(url, {
          method:
            editingTopic
              ? "PATCH"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body:
            JSON.stringify({
              name:
                name.trim(),

              description:
                description.trim(),

              visible,
            }),
        });

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          Array.isArray(
            data.message,
          )
            ? data.message.join(
                ", ",
              )
            : data.message ||
                "Could not save topic.",
        );

        return;
      }

      setModalOpen(false);

      setSuccess(
        editingTopic
          ? "Topic updated."
          : "Topic created.",
      );

      await loadTopics();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     REORDER
  ========================================= */

  async function moveTopic(
    index: number,
    direction:
      | "up"
      | "down",
  ) {
    const newIndex =
      direction ===
      "up"
        ? index - 1
        : index + 1;

    if (
      newIndex < 0 ||
      newIndex >=
        topics.length
    ) {
      return;
    }

    const reordered =
      [...topics];

    const [
      movedTopic,
    ] =
      reordered.splice(
        index,
        1,
      );

    reordered.splice(
      newIndex,
      0,
      movedTopic,
    );

    setTopics(reordered);

    const token =
      getAdminToken();

    if (!token) return;

    try {
      const response =
        await fetch(
          `${API_URL}/admin/topics/reorder`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                ids:
                  reordered.map(
                    (topic) =>
                      topic.id,
                  ),
              }),
          },
        );

      if (!response.ok) {
        await loadTopics();

        setError(
          "Could not save topic order.",
        );
      }
    } catch {
      await loadTopics();

      setError(
        "Could not save topic order.",
      );
    }
  }

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {/* HEADER */}

        <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[32px] leading-tight">
              Topics &amp;
              Categories
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Organise Nuggets into
              core topics.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreate
            }
            className="inline-flex min-h-9 w-fit items-center gap-2 rounded-md bg-[#C8A35A] px-4 text-[9px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
          >
            <Plus size={12} />

            New Topic
          </button>
        </section>

        {/* MESSAGES */}

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

        {/* TOPIC CARDS */}

        {loading ? (
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({
              length: 6,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-[190px] animate-pulse rounded-[10px] border border-white/10 bg-[#111111]"
                />
              ),
            )}
          </section>
        ) : (
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topics.map(
              (
                topic,
                index,
              ) => (
                <article
                  key={
                    topic.id
                  }
                  className="flex min-h-[190px] flex-col justify-end rounded-[10px] border border-white/10 bg-[#111111] p-5"
                >
                  <h2 className="font-serif text-[18px] leading-tight">
                    {
                      topic.name
                    }
                  </h2>

                  <p className="mt-2 text-[9px] text-white/30">
                    {
                      topic.nuggetCount
                    }{" "}
                    {topic.nuggetCount ===
                    1
                      ? "nugget"
                      : "nuggets"}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[7px] ${
                        topic.visible
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border-white/10 bg-white/[0.04] text-white/35"
                      }`}
                    >
                      {topic.visible
                        ? "Visible"
                        : "Hidden"}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        openEdit(
                          topic,
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-[8px] text-[#C8A35A] transition hover:text-[#E0C48A]"
                    >
                      <Pencil
                        size={
                          10
                        }
                      />

                      Edit
                    </button>
                  </div>

                  {/* ORDER CONTROLS */}

                  <div className="mt-4 flex gap-2 border-t border-white/[0.06] pt-3">
                    <button
                      type="button"
                      disabled={
                        index ===
                        0
                      }
                      onClick={() =>
                        moveTopic(
                          index,
                          "up",
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded border border-white/10 text-white/30 transition hover:text-white disabled:opacity-20"
                      title="Move up"
                    >
                      <ChevronUp
                        size={
                          12
                        }
                      />
                    </button>

                    <button
                      type="button"
                      disabled={
                        index ===
                        topics.length -
                          1
                      }
                      onClick={() =>
                        moveTopic(
                          index,
                          "down",
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded border border-white/10 text-white/30 transition hover:text-white disabled:opacity-20"
                      title="Move down"
                    >
                      <ChevronDown
                        size={
                          12
                        }
                      />
                    </button>
                  </div>
                </article>
              ),
            )}
          </section>
        )}

        {!loading &&
          topics.length ===
            0 && (
            <div className="mt-6 rounded-[10px] border border-white/10 bg-[#111111] px-6 py-12 text-center">
              <p className="text-[10px] text-white/35">
                No topics have
                been created yet.
              </p>
            </div>
          )}

        {/* DISPLAY ORDER */}

        {topics.length >
          0 && (
          <section className="mt-6 rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h2 className="font-serif text-[18px]">
              Display Order
            </h2>

            <p className="mt-2 text-[9px] text-white/30">
              Topics appear in
              this order across
              the website. Use the
              arrows on each card
              to reorder them.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {topics.map(
                (
                  topic,
                  index,
                ) => (
                  <span
                    key={
                      topic.id
                    }
                    className="rounded-md border border-white/10 bg-[#080808] px-3 py-2 text-[8px] text-white/50"
                  >
                    {index +
                      1}
                    .{" "}
                    {
                      topic.name
                    }
                  </span>
                ),
              )}
            </div>
          </section>
        )}

        {/* CREATE / EDIT MODAL */}

        {modalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[460px] rounded-[10px] border border-white/10 bg-[#111111] p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-[24px]">
                    {editingTopic
                      ? "Edit Topic"
                      : "New Topic"}
                  </h2>

                  <p className="mt-2 text-[9px] leading-5 text-white/30">
                    {editingTopic
                      ? "Update this topic and its visibility."
                      : "Add a new category for organising Nuggets."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(
                      false,
                    )
                  }
                  className="text-white/30 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-6">
                <label className="text-[8px] text-white/35">
                  Topic Name
                </label>

                <input
                  value={name}
                  onChange={(
                    event,
                  ) =>
                    setName(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Leadership & Governance"
                  className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
                />
              </div>

              <div className="mt-4">
                <label className="text-[8px] text-white/35">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={
                    description
                  }
                  onChange={(
                    event,
                  ) =>
                    setDescription(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Short description of this topic..."
                  className="mt-2 w-full resize-none rounded-md border border-white/10 bg-[#080808] px-3 py-3 text-[10px] leading-5 text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
                />
              </div>

              <label className="mt-4 flex cursor-pointer items-center justify-between rounded-md border border-white/[0.07] bg-[#080808] px-4 py-3">
                <div>
                  <p className="text-[9px] text-white/60">
                    Visible
                  </p>

                  <p className="mt-1 text-[8px] text-white/25">
                    Show this
                    topic publicly.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    visible
                  }
                  onChange={(
                    event,
                  ) =>
                    setVisible(
                      event
                        .target
                        .checked,
                    )
                  }
                  className="h-4 w-4 accent-[#C8A35A]"
                />
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(
                      false,
                    )
                  }
                  className="h-9 rounded-md border border-white/10 px-4 text-[9px] text-white/45"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    saveTopic
                  }
                  className="h-9 rounded-md bg-[#C8A35A] px-5 text-[9px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingTopic
                      ? "Save Changes"
                      : "Create Topic"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}