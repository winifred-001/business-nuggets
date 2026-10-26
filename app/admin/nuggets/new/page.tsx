"use client";

import AudioMediaInput from "@/components/AudioMediaInput";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  ImageIcon,
  Lightbulb,
  ListChecks,
  Plus,
  Save,
  Send,
  Settings2,
  Target,
  Trash2,
  Upload,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import { API_URL } from "@/lib/api";

const bibleSections = [
  "The Pentateuch",
  "History & Leadership",
  "Wisdom Literature",
  "The Prophets",
  "New Testament",
] as const;

type Topic = {
  id: number;
  name: string;
  visible: boolean;
};

type ScriptureBook = {
  id: number;
  name: string;
  visible: boolean;
};

type ScriptureResponse = {
  books: ScriptureBook[];
};

type FormState = {
  number: string;
  title: string;
  topic: string;
  tag: string;
  scriptureRef: string;
  scriptureText: string;
  image: string;
  keyPrinciple: string;
  marketplaceApplication: string;
  duration: string;
  isGold: boolean;
  book: string;
  bibleSection: string;
  featured: boolean;
  audioUrl: string;
};

const initialForm: FormState = {
  number: "",
  title: "",
  topic: "",
  tag: "",
  scriptureRef: "",
  scriptureText: "",
  image: "",
  keyPrinciple: "",
  marketplaceApplication: "",
  duration: "5 min",
  isGold: false,
  book: "",
  bibleSection: "",
  featured: false,
  audioUrl: "",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewNuggetPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(initialForm);
  const [actionSteps, setActionSteps] = useState(["", "", ""]);
  const [challenges, setChallenges] = useState([""]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [books, setBooks] = useState<ScriptureBook[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState<"draft" | "published" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const slug = slugify(form.title);

  function getToken() {
    return (
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken")
    );
  }

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  useEffect(() => {
    async function loadOptions() {
      const token = getToken();

      if (!token) {
        setLoadingOptions(false);
        return;
      }

      try {
        const [topicsResponse, scriptureResponse] = await Promise.all([
          fetch(`${API_URL}/admin/topics`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/admin/scripture`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const topicsData = await topicsResponse.json().catch(() => []);
        const scriptureData: ScriptureResponse = await scriptureResponse
          .json()
          .catch(() => ({ books: [] }));

        if (topicsResponse.ok) {
          setTopics(Array.isArray(topicsData) ? topicsData : []);
        }

        if (scriptureResponse.ok) {
          setBooks(scriptureData.books || []);
        }
      } catch {
        setError("Could not load Topics and Scripture options.");
      } finally {
        setLoadingOptions(false);
      }
    }

    void loadOptions();
  }, []);

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("The image must be 10MB or smaller.");
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Your admin session has expired. Sign in again.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch(`${API_URL}/admin/media/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Could not upload Nugget image.");
        return;
      }

      if (!data.url) {
        setError("The image uploaded, but no image URL was returned.");
        return;
      }

      updateField("image", data.url);
      setSuccess("Nugget image uploaded successfully.");
    } catch {
      setError("Could not upload Nugget image.");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function updateActionStep(index: number, value: string) {
    setActionSteps((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    );
  }

  function removeActionStep(index: number) {
    setActionSteps((current) => {
      if (current.length === 1) return current;
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function updateChallenge(index: number, value: string) {
    setChallenges((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    );
  }

  function removeChallenge(index: number) {
    setChallenges((current) => {
      if (current.length === 1) return current;
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function validateForm() {
    const number = Number(form.number);
    const cleanActionSteps = actionSteps
      .map((item) => item.trim())
      .filter(Boolean);

    if (!Number.isInteger(number) || number <= 0) {
      return "Enter a valid Nugget number.";
    }

    if (!form.title.trim()) return "Enter the Nugget title.";
    if (!slug) return "The Nugget title must create a valid slug.";
    if (!form.topic.trim()) return "Select a Topic.";
    if (!form.tag.trim()) return "Enter a tag.";
    if (!form.scriptureRef.trim()) return "Enter the Scripture reference.";
    if (!form.scriptureText.trim()) return "Enter the Scripture text.";
    if (!form.book.trim()) return "Select a Bible book.";
    if (!form.bibleSection.trim()) return "Select a Bible section.";
    if (!form.keyPrinciple.trim()) return "Enter the Key Principle.";
    if (!form.marketplaceApplication.trim()) {
      return "Enter the Marketplace Application.";
    }
    if (cleanActionSteps.length === 0) {
      return "Add at least one Practical Action Plan step.";
    }
    if (!form.image.trim()) return "Upload or enter a Nugget image URL.";
    if (!form.duration.trim()) return "Enter the reading/listening duration.";

    return "";
  }

  async function submitNugget(status: "draft" | "published") {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Your admin session has expired. Sign in again.");
      return;
    }

    setSaving(status);
    setError("");
    setSuccess("");

    const payload = {
      number: Number(form.number),
      slug,
      title: form.title.trim(),
      topic: form.topic.trim(),
      tag: form.tag.trim(),
      scriptureRef: form.scriptureRef.trim(),
      scriptureText: form.scriptureText.trim(),
      image: form.image.trim(),
      keyPrinciple: form.keyPrinciple.trim(),
      marketplaceApplication: form.marketplaceApplication.trim(),
      practicalActionPlan: actionSteps
        .map((item) => item.trim())
        .filter(Boolean),
      duration: form.duration.trim(),
      isGold: form.isGold,
      book: form.book.trim(),
      bibleSection: form.bibleSection.trim(),
      challenges: challenges
        .map((item) => item.trim())
        .filter(Boolean),
      status,
      featured: form.featured,
      audioUrl: form.audioUrl.trim() || undefined,
    };

    try {
      const response = await fetch(`${API_URL}/admin/nuggets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          Array.isArray(data.message)
            ? data.message.join(" ")
            : data.message || "Could not create Nugget.",
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setSuccess(
        status === "published"
          ? "Nugget published successfully."
          : "Nugget saved as a draft.",
      );

      router.push("/admin/nuggets");
    } catch {
      setError("Could not connect to the server.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(null);
    }
  }

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        <div className="mx-auto w-full max-w-[1180px]">
          <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[13px] text-white/35">Nuggets / New Nugget</p>
              <h1 className="mt-2 font-serif text-[32px] leading-tight sm:text-[36px]">
                Create New Nugget
              </h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-white/40">
                Add biblical business wisdom in one continuous form. Fill each
                section as you scroll, then save it as a draft or publish it.
              </p>
            </div>

            <Link
              href="/admin/nuggets"
              className="bn-button inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-[14px] text-white/60 transition hover:border-[#C8A35A]/35 hover:text-[#E0C48A]"
            >
              <ArrowLeft size={16} />
              Back to Nuggets
            </Link>
          </section>

          {(error || success) && (
            <div
              className={`mt-6 rounded-lg border px-4 py-3 text-[14px] ${
                error
                  ? "border-red-500/20 bg-red-500/[0.06] text-red-300"
                  : "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300"
              }`}
            >
              <div className="flex items-start gap-2">
                {success && <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}
                <p>{error || success}</p>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-5">
            <FormSection
              icon={<FileText size={20} />}
              title="Basic Information"
              description="Set the foundational details for this Nugget."
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-12">
                <Field label="Nugget Number (BN)" required className="xl:col-span-3">
                  <input
                    type="number"
                    min="1"
                    value={form.number}
                    onChange={(event) => updateField("number", event.target.value)}
                    placeholder="e.g. 073"
                    className={inputClass}
                  />
                  <p className="mt-2 text-[12px] text-white/25">
                    It will appear as BN: {form.number || "---"}
                  </p>
                </Field>

                <Field label="Title" required className="xl:col-span-5">
                  <input
                    value={form.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    placeholder="e.g. The leader sets the tone"
                    className={inputClass}
                  />
                </Field>

                <Field label="Slug" className="xl:col-span-4">
                  <input
                    value={slug}
                    readOnly
                    placeholder="auto-generated"
                    className={`${inputClass} cursor-not-allowed text-white/35`}
                  />
                </Field>

                <Field label="Topic" required className="xl:col-span-6">
                  <select
                    value={form.topic}
                    onChange={(event) => updateField("topic", event.target.value)}
                    disabled={loadingOptions}
                    className={inputClass}
                  >
                    <option value="">
                      {loadingOptions ? "Loading topics..." : "Select a topic"}
                    </option>
                    {topics
                      .filter((topic) => topic.visible)
                      .map((topic) => (
                        <option key={topic.id} value={topic.name}>
                          {topic.name}
                        </option>
                      ))}
                  </select>
                </Field>

                <Field label="Tag" required className="xl:col-span-6">
                  <input
                    value={form.tag}
                    onChange={(event) => updateField("tag", event.target.value)}
                    placeholder="e.g. leadership"
                    className={inputClass}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              icon={<BookOpen size={20} />}
              title="Scripture Details"
              description="Add the biblical foundation for this Nugget."
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-12">
                <Field label="Scripture Reference" required className="xl:col-span-4">
                  <input
                    value={form.scriptureRef}
                    onChange={(event) =>
                      updateField("scriptureRef", event.target.value)
                    }
                    placeholder="e.g. Proverbs 23:7"
                    className={inputClass}
                  />
                </Field>

                <Field label="Book" required className="xl:col-span-4">
                  <select
                    value={form.book}
                    onChange={(event) => updateField("book", event.target.value)}
                    disabled={loadingOptions}
                    className={inputClass}
                  >
                    <option value="">
                      {loadingOptions ? "Loading books..." : "Select a book"}
                    </option>
                    {books
                      .filter((book) => book.visible)
                      .map((book) => (
                        <option key={book.id} value={book.name}>
                          {book.name}
                        </option>
                      ))}
                  </select>
                </Field>

                <Field label="Bible Section" required className="xl:col-span-4">
                  <select
                    value={form.bibleSection}
                    onChange={(event) =>
                      updateField("bibleSection", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Select a Bible section</option>
                    {bibleSections.map((section) => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Scripture Text" required className="md:col-span-2 xl:col-span-12">
                  <textarea
                    rows={5}
                    value={form.scriptureText}
                    onChange={(event) =>
                      updateField("scriptureText", event.target.value)
                    }
                    placeholder="Enter the Scripture text..."
                    className={textareaClass}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              icon={<Lightbulb size={20} />}
              title="Core Insight"
              description="Capture the teaching and how it applies in the marketplace."
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Key Principle" required>
                  <textarea
                    rows={5}
                    value={form.keyPrinciple}
                    onChange={(event) =>
                      updateField("keyPrinciple", event.target.value)
                    }
                    placeholder="Write the main principle or lesson from this Nugget..."
                    className={textareaClass}
                  />
                </Field>

                <Field label="Marketplace Application" required>
                  <textarea
                    rows={5}
                    value={form.marketplaceApplication}
                    onChange={(event) =>
                      updateField("marketplaceApplication", event.target.value)
                    }
                    placeholder="How does this apply to work, business or daily life?"
                    className={textareaClass}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              icon={<ListChecks size={20} />}
              title="Practical Action Plan"
              description="Break the lesson into clear, practical steps."
            >
              <div className="space-y-3">
                {actionSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C8A35A]/10 text-[13px] font-semibold text-[#E0C48A]">
                      {index + 1}
                    </div>

                    <input
                      value={step}
                      onChange={(event) =>
                        updateActionStep(index, event.target.value)
                      }
                      placeholder={`Action step ${index + 1}`}
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={() => removeActionStep(index)}
                      disabled={actionSteps.length === 1}
                      aria-label={`Remove action step ${index + 1}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/25 transition hover:bg-white/[0.04] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-20"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActionSteps((current) => [...current, ""])}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#C8A35A]/25 px-4 text-[13px] font-medium text-[#E0C48A] transition hover:bg-[#C8A35A]/10"
              >
                <Plus size={15} />
                Add Action Step
              </button>
            </FormSection>

            <FormSection
              icon={<Target size={20} />}
              title="Challenges & Reflection"
              description="Add prompts that help readers apply or reflect on the teaching."
            >
              <div className="space-y-3">
                {challenges.map((challenge, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-[13px] text-white/45">
                      {index + 1}
                    </div>

                    <textarea
                      rows={2}
                      value={challenge}
                      onChange={(event) =>
                        updateChallenge(index, event.target.value)
                      }
                      placeholder="Add a challenge or reflection prompt..."
                      className={textareaClass}
                    />

                    <button
                      type="button"
                      onClick={() => removeChallenge(index)}
                      disabled={challenges.length === 1}
                      aria-label={`Remove challenge ${index + 1}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/25 transition hover:bg-white/[0.04] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-20"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setChallenges((current) => [...current, ""])}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-[13px] font-medium text-white/55 transition hover:border-[#C8A35A]/25 hover:text-[#E0C48A]"
              >
                <Plus size={15} />
                Add Challenge
              </button>
            </FormSection>

            <FormSection
              icon={<ImageIcon size={20} />}
              title="Media"
              description="Add the Nugget image and optional audio."
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <Field label="Nugget Image" required>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={uploadImage}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex min-h-[150px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-[#080808] px-5 text-center transition hover:border-[#C8A35A]/40 hover:bg-[#C8A35A]/[0.03] disabled:cursor-wait"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C8A35A]/10 text-[#E0C48A]">
                        <Upload size={19} />
                      </div>
                      <p className="mt-3 text-[14px] font-medium text-white/70">
                        {uploading ? "Uploading image..." : "Upload Nugget image"}
                      </p>
                      <p className="mt-1 text-[12px] text-white/25">
                        JPG, PNG, WEBP or GIF · max 10MB
                      </p>
                    </button>
                  </Field>

                  <div className="mt-4">
                    <Field label="Or use an image URL">
                      <input
                        value={form.image}
                        onChange={(event) =>
                          updateField("image", event.target.value)
                        }
                        placeholder="https://..."
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>

                <div>
                  <Field label="Image Preview">
                    <div className="flex min-h-[212px] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#080808]">
                      {form.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.image}
                          alt="Nugget preview"
                          className="h-full max-h-[280px] w-full object-contain"
                        />
                      ) : (
                        <div className="px-5 text-center">
                          <ImageIcon size={28} className="mx-auto text-white/15" />
                          <p className="mt-3 text-[13px] text-white/25">
                            Your uploaded Nugget image will appear here.
                          </p>
                        </div>
                      )}
                    </div>
                  </Field>
                </div>

                <Field label="Audio URL (optional)" className="lg:col-span-2">
                  <AudioMediaInput value={form.audioUrl} onChange={value => updateField("audioUrl", value)} />
                  <p className="mt-2 text-[12px] text-white/25">
                    Add a direct audio link when an audio version is available.
                  </p>
                </Field>
              </div>
            </FormSection>

            <FormSection
              icon={<Settings2 size={20} />}
              title="Publishing Settings"
              description="Set access, promotion and estimated duration before saving."
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Duration" required>
                  <input
                    value={form.duration}
                    onChange={(event) => updateField("duration", event.target.value)}
                    placeholder="e.g. 5 min"
                    className={inputClass}
                  />
                </Field>

                <ToggleCard
                  label="Gold Nugget"
                  description="Premium members only"
                  checked={form.isGold}
                  onChange={(checked) => updateField("isGold", checked)}
                />

                <ToggleCard
                  label="Featured"
                  description="Highlight this Nugget"
                  checked={form.featured}
                  onChange={(checked) => updateField("featured", checked)}
                />

                <div className="rounded-lg border border-white/10 bg-[#080808] p-4">
                  <p className="text-[13px] font-medium text-white/70">Status</p>
                  <p className="mt-2 text-[12px] leading-5 text-white/30">
                    Choose Save as Draft or Publish Nugget below. Published free
                    Nuggets still follow the 10-free-Nugget limit.
                  </p>
                </div>
              </div>
            </FormSection>
          </div>

          <section className="mt-5 rounded-[10px] border border-white/10 bg-[#111111] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-[20px]">Ready to save?</h2>
                <p className="mt-1 text-[13px] text-white/30">
                  You can keep this Nugget private as a draft or publish it immediately.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => submitNugget("draft")}
                  disabled={saving !== null || uploading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-5 text-[14px] font-medium text-white/65 transition hover:border-[#C8A35A]/30 hover:text-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving === "draft" ? "Saving..." : "Save as Draft"}
                </button>

                <button
                  type="button"
                  onClick={() => submitNugget("published")}
                  disabled={saving !== null || uploading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#C8A35A] px-5 text-[14px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={16} />
                  {saving === "published" ? "Publishing..." : "Publish Nugget"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </AdminShell>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-white/10 bg-[#080808] px-3.5 text-[14px] text-white/75 outline-none transition placeholder:text-white/20 focus:border-[#C8A35A]/45 disabled:cursor-not-allowed disabled:opacity-50";

const textareaClass =
  "w-full resize-y rounded-lg border border-white/10 bg-[#080808] px-3.5 py-3 text-[14px] leading-6 text-white/75 outline-none transition placeholder:text-white/20 focus:border-[#C8A35A]/45";

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[10px] border border-white/10 bg-[#111111] p-4 sm:p-5 lg:p-6">
      <div className="grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-8">
        <div>
          <div className="flex items-center gap-3 text-[#E0C48A]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#C8A35A]/10">
              {icon}
            </div>
            <h2 className="font-serif text-[20px] text-[#FAF9F6]">{title}</h2>
          </div>
          <p className="mt-3 max-w-[260px] text-[13px] leading-5 text-white/30">
            {description}
          </p>
        </div>

        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-2 block text-[13px] font-medium text-white/65">
        {label}
        {required && <span className="ml-1 text-[#C8A35A]">*</span>}
      </span>
      {children}
    </label>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className="flex min-h-[92px] w-full items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#080808] p-4 text-left transition hover:border-[#C8A35A]/25"
    >
      <div>
        <p className="text-[13px] font-medium text-white/70">{label}</p>
        <p className="mt-1 text-[12px] text-white/30">{description}</p>
      </div>

      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[#C8A35A]" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full transition ${
            checked
              ? "left-6 bg-[#080808]"
              : "left-1 bg-white/45"
          }`}
        />
      </span>
    </button>
  );
}
