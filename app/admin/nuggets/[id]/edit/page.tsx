"use client";

import { BIBLE_BOOKS } from "@/lib/bible-books";

import AudioMediaInput from "@/components/AudioMediaInput";

import Image from "next/image";
import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

import {
  CheckCircle2,
  Eye,
  ImageIcon,
  Save,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import { API_URL } from "@/lib/api";

import type {
  BibleSection,
  Nugget,
} from "@/types/nugget";

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

  nuggetAudioUrl?: string | null;

  audioUrl?:
    | string
    | null;

  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
  title: string;
  slug: string;
  topic: string;
  tag: string;

  scriptureRef: string;
  scriptureText: string;

  image: string;

  keyPrinciple: string;
  details: string;

  marketplaceApplication: string;

  practicalActionPlan: string;

  duration: string;

  isGold: boolean;
  featured: boolean;

  book: string;

  bibleSection:
    BibleSection;

  challenges: string;

  audioUrl: string;
  nuggetAudioUrl: string;

  status:
    | "draft"
    | "published";
};

const bibleSections: BibleSection[] =
  [
    "The Pentateuch",
    "History & Leadership",
    "Wisdom Literature",
    "The Prophets",
    "New Testament",
  ];

export default function EditNuggetPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const id =
    typeof params.id ===
    "string"
      ? params.id
      : "";

  const [
    originalNugget,
    setOriginalNugget,
  ] =
    useState<AdminNugget | null>(
      null,
    );

  const [form, setForm] =
    useState<FormState>({
      title: "",
      slug: "",
      topic: "",
      tag: "",

      scriptureRef: "",
      scriptureText: "",

      image: "",

      keyPrinciple: "",
      details: "",

      marketplaceApplication:
        "",

      practicalActionPlan:
        "",

      duration: "",

      isGold: false,
      featured: false,

      book: "",

      bibleSection:
        "Wisdom Literature",

      challenges: "",

      audioUrl: "",
      nuggetAudioUrl: "",

      status: "draft",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =========================================
     LOAD NUGGET
  ========================================= */

  useEffect(() => {
    async function loadNugget() {
      if (!id) {
        return;
      }

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
              "Could not load Nugget.",
          );

          return;
        }

        const nuggets:
          AdminNugget[] =
          Array.isArray(data)
            ? data
            : [];

        const nugget =
          nuggets.find(
            (item) =>
              item.id === id,
          );

        if (!nugget) {
          setError(
            "Nugget not found.",
          );

          return;
        }

        setOriginalNugget(
          nugget,
        );

        setForm({
          title:
            nugget.title ||
            "",

          slug:
            nugget.slug ||
            "",

          topic:
            nugget.topic ||
            "",

          tag:
            nugget.tag ||
            "",

          scriptureRef:
            nugget.scriptureRef ||
            "",

          scriptureText:
            nugget.scriptureText ||
            "",

          image:
            nugget.image ||
            "",

          keyPrinciple:
            nugget.keyPrinciple ||
            "",

          details: nugget.details || "",

          marketplaceApplication:
            nugget.marketplaceApplication ||
            "",

          practicalActionPlan:
            Array.isArray(
              nugget.practicalActionPlan,
            )
              ? nugget.practicalActionPlan.join(
                  "\n",
                )
              : "",

          duration:
            nugget.duration ||
            "",

          isGold:
            Boolean(
              nugget.isGold,
            ),

          featured:
            Boolean(
              nugget.featured,
            ),

          book:
            nugget.book ||
            "",

          bibleSection:
            nugget.bibleSection ||
            "Wisdom Literature",

          challenges:
            Array.isArray(
              nugget.challenges,
            )
              ? nugget.challenges.join(
                  ", ",
                )
              : "",

          audioUrl:
            nugget.audioUrl ||
            "",
          nuggetAudioUrl: nugget.nuggetAudioUrl || "",

          status:
            nugget.status ||
            "draft",
        });
      } catch {
        setError(
          "Could not connect to the server.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadNugget();
  }, [id]);

  /* =========================================
     UPDATE FIELD
  ========================================= */

  function updateField<
    K extends keyof FormState,
  >(
    key: K,
    value: FormState[K],
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );

    setSuccess("");
    setError("");
  }

  /* =========================================
     SAVE
  ========================================= */

  async function saveNugget(
    status:
      | "draft"
      | "published",
  ) {
    if (!id) return;

    if (
      !form.title.trim() ||
      !form.slug.trim() ||
      !form.topic.trim() ||
      !form.scriptureRef.trim()
    ) {
      setError(
        "Title, slug, topic and Scripture reference are required.",
      );

      return;
    }

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

    setSaving(true);
    setError("");
    setSuccess("");

    const practicalActionPlan =
      form.practicalActionPlan
        .split("\n")
        .map(
          (item) =>
            item.trim(),
        )
        .filter(Boolean);

    const challenges =
      form.challenges
        .split(",")
        .map(
          (item) =>
            item.trim(),
        )
        .filter(Boolean);

    try {
      const response =
        await fetch(
          `${API_URL}/admin/nuggets/${encodeURIComponent(
            id,
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              slug:
                form.slug.trim(),

              title:
                form.title.trim(),

              topic:
                form.topic.trim(),

              tag:
                form.tag.trim(),

              scriptureRef:
                form.scriptureRef.trim(),

              scriptureText:
                form.scriptureText.trim(),

              image:
                form.image.trim(),

              keyPrinciple:
                form.keyPrinciple.trim(),

              details: form.details.trim(),

              marketplaceApplication:
                form.marketplaceApplication.trim(),

              practicalActionPlan,

              duration:
                form.duration.trim(),

              isGold:
                form.isGold,

              featured:
                form.featured,

              book:
                form.book.trim(),

              bibleSection:
                form.bibleSection,

              challenges,

              status,

              audioUrl:
                form.audioUrl.trim(),
              nuggetAudioUrl: form.nuggetAudioUrl.trim(),
            }),
          },
        );

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
                "Could not update Nugget.",
        );

        return;
      }

      setForm(
        (current) => ({
          ...current,
          status,
        }),
      );

      setSuccess(
        status ===
          "published"
          ? "Nugget published successfully."
          : "Draft saved successfully.",
      );

      setOriginalNugget(
        data,
      );
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     PREVIEW
  ========================================= */

  function previewNugget() {
    if (
      form.status !==
      "published"
    ) {
      setError(
        "Publish this Nugget before opening the public preview.",
      );

      return;
    }

    window.open(
      `/nugget/${form.slug}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  if (loading) {
    return (
      <AdminShell>
        <main className="px-4 py-10 sm:px-6 lg:px-7">
          <p className="text-[11px] text-white/30">
            Loading Nugget...
          </p>
        </main>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {/* =================================
            HEADER
        ================================= */}

        <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[32px] leading-tight">
              Edit Nugget
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Nugget #
              {originalNugget?.number ??
                "—"}
              {" · "}
              {originalNugget?.title ||
                "Business Nugget"}
            </p>
          </div>

          <Link
            href="/admin/nuggets"
            className="bn-button inline-flex min-h-9 w-fit items-center justify-center rounded-md border border-white/10 px-4 text-[9px] text-white/55 transition hover:border-[#C8A35A]/30 hover:text-white"
          >
            Discard
          </Link>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
            <p className="text-[10px] text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mt-5 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3">
            <CheckCircle2
              size={13}
              className="text-emerald-400"
            />

            <p className="text-[10px] text-emerald-400">
              {success}
            </p>
          </div>
        )}

        {/* =================================
            EDITOR GRID
        ================================= */}

        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
          {/* =================================
              LEFT
          ================================= */}

          <div className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
            {/* TITLE */}

            <FieldLabel>
              Title
            </FieldLabel>

            <input
              value={
                form.title
              }
              onChange={(
                event,
              ) =>
                updateField(
                  "title",
                  event.target
                    .value,
                )
              }
              className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none focus:border-[#C8A35A]/40"
            />

            {/* SLUG */}

            <div className="mt-4">
              <FieldLabel>
                Slug
              </FieldLabel>

              <input
                value={
                  form.slug
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "slug",
                    event
                      .target
                      .value,
                  )
                }
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none focus:border-[#C8A35A]/40"
              />
            </div>

            {/* SCRIPTURE + TOPIC */}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>
                  Scripture
                  Reference
                </FieldLabel>

                <input
                  value={
                    form.scriptureRef
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "scriptureRef",
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Proverbs 11:1"
                  className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
                />
              </div>

              <div>
                <FieldLabel>
                  Topic
                </FieldLabel>

                <input
                  value={
                    form.topic
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "topic",
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Negotiation & Justice"
                  className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
                />
              </div>
            </div>

            {/* SCRIPTURE TEXT */}

            <div className="mt-4">
              <FieldLabel>
                Scripture Text
              </FieldLabel>

              <textarea
                value={
                  form.scriptureText
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "scriptureText",
                    event
                      .target
                      .value,
                  )
                }
                rows={4}
                className="mt-2 w-full resize-y rounded-md border border-white/10 bg-[#080808] px-3 py-3 text-[10px] leading-5 text-white outline-none focus:border-[#C8A35A]/40"
              />
            </div>

            {/* KEY PRINCIPLE */}

            <div className="mt-4">
              <FieldLabel>
                Key Principle
              </FieldLabel>

              <textarea
                value={
                  form.keyPrinciple
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "keyPrinciple",
                    event
                      .target
                      .value,
                  )
                }
                rows={6}
                placeholder="Main biblical-business principle..."
                className="mt-2 w-full resize-y rounded-md border border-white/10 bg-[#080808] px-3 py-3 text-[10px] leading-5 text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
              />
            </div>

            <div className="mt-4">
              <FieldLabel>Details</FieldLabel>
              <textarea
                aria-label="Details"
                value={form.details}
                onChange={(event) => updateField("details", event.target.value)}
                rows={8}
                placeholder="Add the full explanation and supporting details..."
                className="mt-2 w-full resize-y rounded-md border border-white/10 bg-[#080808] px-3 py-3 text-[10px] leading-5 text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
              />
              <p className="mt-2 text-[12px] text-white/45">Press Enter for a new line, or leave a blank line between paragraphs. Use **bold text** or &lt;strong&gt;bold text&lt;/strong&gt; for bold, and ## Heading text on its own line for a heading. Basic &lt;br&gt; and &lt;p&gt; tags are also supported.</p>
            </div>

            {/* MARKETPLACE */}

            <div className="mt-4">
              <FieldLabel>
                Marketplace
                Application
              </FieldLabel>

              <textarea
                value={
                  form.marketplaceApplication
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "marketplaceApplication",
                    event
                      .target
                      .value,
                  )
                }
                rows={5}
                placeholder="How this principle applies in business..."
                className="mt-2 w-full resize-y rounded-md border border-white/10 bg-[#080808] px-3 py-3 text-[10px] leading-5 text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
              />
            </div>

            {/* ACTION PLAN */}

            <div className="mt-4">
              <FieldLabel>
                Practical Action
                Plan
              </FieldLabel>

              <textarea
                value={
                  form.practicalActionPlan
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "practicalActionPlan",
                    event
                      .target
                      .value,
                  )
                }
                rows={5}
                placeholder={
                  "Enter one action per line\nReview your contracts\nAudit pricing practices"
                }
                className="mt-2 w-full resize-y rounded-md border border-white/10 bg-[#080808] px-3 py-3 text-[10px] leading-5 text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
              />

              <p className="mt-2 text-[8px] text-white/25">
                Enter one action
                per line.
              </p>
            </div>

            {/* TAG + DURATION */}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>
                  Tag
                </FieldLabel>

                <input
                  value={
                    form.tag
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "tag",
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Integrity & Character"
                  className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
                />
              </div>

              <div>
                <FieldLabel>
                  Duration
                </FieldLabel>

                <input
                  value={
                    form.duration
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "duration",
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="6 min"
                  className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
                />
              </div>
            </div>

            {/* BOOK + BIBLE SECTION */}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>
                  Bible Book
                </FieldLabel>

                <select
                  aria-label="Bible Book"
                  value={form.book}
                  onChange={(event) => updateField("book", event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none focus:border-[#C8A35A]/40"
                >
                  <option value="">Select a book</option>
                  {form.book && !BIBLE_BOOKS.includes(form.book) && (
                    <option value={form.book}>{form.book} (current value)</option>
                  )}
                  {BIBLE_BOOKS.map((book) => (
                    <option key={book} value={book}>{book}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>
                  Bible Section
                </FieldLabel>

                <select
                  value={
                    form.bibleSection
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "bibleSection",
                      event
                        .target
                        .value as BibleSection,
                    )
                  }
                  className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white/70 outline-none"
                >
                  {bibleSections.map(
                    (
                      section,
                    ) => (
                      <option
                        key={
                          section
                        }
                        value={
                          section
                        }
                      >
                        {
                          section
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            {/* CHALLENGES */}

            <div className="mt-4">
              <FieldLabel>
                Challenges
              </FieldLabel>

              <input
                value={
                  form.challenges
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "challenges",
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Negotiation, Ethics, Pricing"
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
              />

              <p className="mt-2 text-[8px] text-white/25">
                Separate
                challenges with
                commas.
              </p>
            </div>

            {/* AUDIO */}

            <div className="mt-4">
              <FieldLabel>
                Song URL
              </FieldLabel>

              <AudioMediaInput label="Song URL" value={form.audioUrl} onChange={value => updateField("audioUrl", value)} />
            </div>

            <div className="mt-4">
              <FieldLabel>Nugget URL</FieldLabel>
              <AudioMediaInput label="Nugget URL" value={form.nuggetAudioUrl} onChange={value => updateField("nuggetAudioUrl", value)} />
            </div>

            {/* BOTTOM BUTTONS */}

            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-5">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  saveNugget(
                    "draft",
                  )
                }
                className="inline-flex min-h-9 items-center gap-2 rounded-md border border-white/10 bg-[#080808] px-4 text-[9px] text-white/60 transition hover:border-[#C8A35A]/30 hover:text-white disabled:opacity-40"
              >
                <Save
                  size={12}
                />

                {saving
                  ? "Saving..."
                  : "Save Draft"}
              </button>

              <button
                type="button"
                onClick={
                  previewNugget
                }
                className="inline-flex min-h-9 items-center gap-2 rounded-md border border-white/10 bg-[#080808] px-4 text-[9px] text-white/60 transition hover:border-[#C8A35A]/30 hover:text-white"
              >
                <Eye
                  size={12}
                />

                Preview
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  saveNugget(
                    "published",
                  )
                }
                className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-md bg-[#C8A35A] px-5 text-[9px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:opacity-40"
              >
                {saving
                  ? "Publishing..."
                  : "Publish Nugget"}
              </button>
            </div>
          </div>

          {/* =================================
              RIGHT SIDEBAR
          ================================= */}

          <aside className="space-y-4">
            {/* COVER */}

            <section className="rounded-[10px] border border-white/10 bg-[#111111] p-4">
              <h2 className="font-serif text-[17px]">
                Cover Image
              </h2>

              <div className="relative mt-4 flex min-h-[150px] items-center justify-center overflow-hidden rounded-md border border-white/10 bg-[#080808]">
                {form.image ? (
                  <Image
                    src={
                      form.image
                    }
                    alt=""
                    fill
                    sizes="280px"
                    className="object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon
                      size={20}
                      className="mx-auto text-white/20"
                    />

                    <p className="mt-2 text-[8px] text-white/25">
                      No cover image
                    </p>
                  </div>
                )}
              </div>

              <FieldLabel>
                Image URL
              </FieldLabel>

              <input
                value={
                  form.image
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "image",
                    event
                      .target
                      .value,
                  )
                }
                placeholder="/images/nugget.jpg"
                className="mt-2 h-9 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[9px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
              />

              <button
                type="button"
                disabled
                title="The Admin Media Library will be connected when we build that screen."
                className="mt-2 h-9 w-full rounded-md border border-white/10 text-[8px] text-white/30 disabled:cursor-not-allowed"
              >
                Choose from Library
              </button>
            </section>

            {/* PUBLISHING */}

            <section className="rounded-[10px] border border-white/10 bg-[#111111] p-4">
              <h2 className="font-serif text-[17px]">
                Publishing
              </h2>

              <div className="mt-4">
                <FieldLabel>
                  Status
                </FieldLabel>

                <div className="mt-2 rounded-md border border-white/10 bg-[#080808] px-3 py-3">
                  <StatusBadge
                    status={
                      form.status
                    }
                  />
                </div>
              </div>

              {originalNugget?.publishedAt && (
                <div className="mt-4">
                  <FieldLabel>
                    Published
                  </FieldLabel>

                  <p className="mt-2 text-[9px] text-white/45">
                    {new Date(
                      originalNugget.publishedAt,
                    ).toLocaleString()}
                  </p>
                </div>
              )}
            </section>

            {/* GOLD + FEATURED */}

            <section className="rounded-[10px] border border-[#C8A35A]/30 bg-[#111111] p-4">
              <h2 className="font-serif text-[17px]">
                Visibility
              </h2>

              <label className="mt-4 flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] text-white/65">
                    GOLD Teaching
                  </p>

                  <p className="mt-1 text-[8px] text-white/25">
                    Mark as
                    premium content.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    form.isGold
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "isGold",
                      event
                        .target
                        .checked,
                    )
                  }
                  className="h-4 w-4 accent-[#C8A35A]"
                />
              </label>

              <div className="my-4 border-t border-white/[0.06]" />

              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] text-white/65">
                    Featured
                  </p>

                  <p className="mt-1 text-[8px] text-white/25">
                    Highlight this
                    Nugget.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    form.featured
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "featured",
                      event
                        .target
                        .checked,
                    )
                  }
                  className="h-4 w-4 accent-[#C8A35A]"
                />
              </label>
            </section>

            {/* SEO */}

            <section className="rounded-[10px] border border-white/10 bg-[#111111] p-4">
              <h2 className="font-serif text-[17px]">
                Tags &amp; SEO
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {form.tag && (
                  <span className="rounded-full bg-[#C8A35A]/15 px-2.5 py-1 text-[7px] text-[#C8A35A]">
                    {
                      form.tag
                    }
                  </span>
                )}

                {form.topic && (
                  <span className="rounded-full bg-[#C8A35A]/15 px-2.5 py-1 text-[7px] text-[#C8A35A]">
                    {
                      form.topic
                    }
                  </span>
                )}
              </div>

              <p className="mt-4 text-[8px] leading-4 text-white/25">
                Search metadata is
                currently derived
                from the Nugget
                title, topic, tag,
                Scripture and body
                content.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </AdminShell>
  );
}

function FieldLabel({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <label className="block text-[8px] font-medium text-white/35">
      {children}
    </label>
  );
}

function StatusBadge({
  status,
}: {
  status:
    | "draft"
    | "published";
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[7px] font-medium ${
        status ===
        "published"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-[#C8A35A]/20 bg-[#C8A35A]/10 text-[#E0C48A]"
      }`}
    >
      {status ===
      "published"
        ? "Published"
        : "Draft"}
    </span>
  );
}