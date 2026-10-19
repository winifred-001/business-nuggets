"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Check,
  Plus,
} from "lucide-react";

import AdminShell from "@/components/AdminShell";
import { API_URL } from "@/lib/api";

type Campaign = {
  id: number;

  title: string;
  message: string;

  audience: string;
  platform: string;

  sendAt:
    | string
    | null;

  status: string;

  reach: number;

  createdAt: string;
};

export default function AdminNotificationsPage() {
  const [
    campaigns,
    setCampaigns,
  ] =
    useState<
      Campaign[]
    >([]);

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
    title,
    setTitle,
  ] = useState(
    "Today's Business Nugget",
  );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    audience,
    setAudience,
  ] = useState(
    "all",
  );

  const [
    platform,
    setPlatform,
  ] = useState(
    "ios-android",
  );

  const [
    sendTime,
    setSendTime,
  ] = useState("");

  const formRef =
    useRef<HTMLDivElement>(
      null,
    );

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

  /* =========================================================
     LOAD
  ========================================================= */

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    const token =
      getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/admin/notifications`,
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
        throw new Error(
          data.message ||
            "Could not load notification history.",
        );
      }

      setCampaigns(
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

  /* =========================================================
     RESET / NEW CAMPAIGN
  ========================================================= */

  function newCampaign() {
    setTitle("");
    setMessage("");
    setAudience(
      "all",
    );
    setPlatform(
      "ios-android",
    );
    setSendTime("");
    setError("");
    setSuccess("");

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  /* =========================================================
     SCHEDULE
  ========================================================= */

  async function scheduleCampaign() {
    if (
      !title.trim()
    ) {
      setError(
        "Enter a notification title.",
      );

      return;
    }

    if (
      !message.trim()
    ) {
      setError(
        "Enter a notification message.",
      );

      return;
    }

    if (
      !sendTime
    ) {
      setError(
        "Choose when the notification should be scheduled.",
      );

      return;
    }

    const token =
      getToken();

    if (!token) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const localDate =
        new Date(
          sendTime,
        );

      const response =
        await fetch(
          `${API_URL}/admin/notifications`,
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
                title:
                  title.trim(),

                message:
                  message.trim(),

                audience,

                platform,

                sendAt:
                  localDate.toISOString(),
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ||
            "Could not schedule notification.",
        );

        return;
      }

      setSuccess(
        "Notification campaign scheduled.",
      );

      setTitle("");
      setMessage("");
      setSendTime("");

      await loadCampaigns();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     BROWSER TEST NOTIFICATION
  ========================================================= */

  async function sendTest() {
    if (
      !title.trim() ||
      !message.trim()
    ) {
      setError(
        "Enter a title and message before testing.",
      );

      return;
    }

    if (
      !("Notification" in window)
    ) {
      setError(
        "This browser does not support desktop notifications.",
      );

      return;
    }

    try {
      let permission =
        Notification.permission;

      if (
        permission ===
        "default"
      ) {
        permission =
          await Notification.requestPermission();
      }

      if (
        permission !==
        "granted"
      ) {
        setError(
          "Notification permission was not granted.",
        );

        return;
      }

      new Notification(
        title.trim(),
        {
          body:
            message.trim(),
        },
      );

      setSuccess(
        "Test notification displayed on this device.",
      );
    } catch {
      setError(
        "Could not display the test notification.",
      );
    }
  }

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {/* HEADER */}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[32px]">
              Notifications
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Push and email
              messages to mobile
              and web members.
            </p>
          </div>

          <button
            type="button"
            onClick={
              newCampaign
            }
            className="inline-flex h-9 w-fit items-center gap-2 rounded-md bg-[#C8A35A] px-4 text-[8px] font-semibold text-[#080808] hover:bg-[#E0C48A]"
          >
            <Plus
              size={11}
            />

            New Campaign
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

        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          {/* COMPOSE */}

          <article
            ref={formRef}
            className="flex min-h-[520px] flex-col rounded-[10px] border border-white/10 bg-[#111111] p-5"
          >
            <h2 className="font-serif text-[18px]">
              Compose Push
              Notification
            </h2>

            <label className="mt-5 block text-[7px] text-white/30">
              Title
            </label>

            <input
              value={title}
              onChange={(
                event,
              ) =>
                setTitle(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Today's Business Nugget"
              className="mt-2 h-10 rounded-md border border-white/10 bg-[#080808] px-3 text-[9px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/30"
            />

            <label className="mt-4 block text-[7px] text-white/30">
              Message
            </label>

            <textarea
              rows={4}
              value={
                message
              }
              onChange={(
                event,
              ) =>
                setMessage(
                  event
                    .target
                    .value,
                )
              }
              placeholder="The Law of Just Balances in Corporate Negotiation"
              className="mt-2 resize-none rounded-md border border-white/10 bg-[#080808] px-3 py-3 text-[9px] leading-5 text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/30"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[7px] text-white/30">
                  Audience
                </label>

                <select
                  value={
                    audience
                  }
                  onChange={(
                    event,
                  ) =>
                    setAudience(
                      event
                        .target
                        .value,
                    )
                  }
                  className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[8px] text-white/60 outline-none"
                >
                  <option value="all">
                    All Members
                  </option>

                  <option value="free">
                    Free Members
                  </option>

                  <option value="premium">
                    Premium Members
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[7px] text-white/30">
                  Platform
                </label>

                <select
                  value={
                    platform
                  }
                  onChange={(
                    event,
                  ) =>
                    setPlatform(
                      event
                        .target
                        .value,
                    )
                  }
                  className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[8px] text-white/60 outline-none"
                >
                  <option value="ios-android">
                    iOS + Android
                  </option>

                  <option value="all">
                    All Platforms
                  </option>

                  <option value="web">
                    Web
                  </option>

                  <option value="ios">
                    iOS
                  </option>

                  <option value="android">
                    Android
                  </option>
                </select>
              </div>
            </div>

            <label className="mt-4 block text-[7px] text-white/30">
              Send Time
            </label>

            <input
              type="datetime-local"
              value={
                sendTime
              }
              onChange={(
                event,
              ) =>
                setSendTime(
                  event
                    .target
                    .value,
                )
              }
              className="mt-2 h-10 rounded-md border border-white/10 bg-[#080808] px-3 text-[8px] text-white/60 outline-none"
            />

            <p className="mt-3 text-[7px] leading-4 text-white/20">
              Scheduling stores
              the campaign. Actual
              iOS/Android/email
              delivery will be
              enabled when a
              messaging provider
              is connected.
            </p>

            <div className="mt-auto flex items-center justify-between gap-3 pt-8">
              <button
                type="button"
                onClick={
                  sendTest
                }
                className="h-9 rounded-md border border-white/10 px-5 text-[8px] text-white/45 transition hover:text-white"
              >
                Send Test
              </button>

              <button
                type="button"
                onClick={
                  scheduleCampaign
                }
                disabled={
                  saving
                }
                className="h-9 rounded-md bg-[#C8A35A] px-7 text-[8px] font-semibold text-[#080808] hover:bg-[#E0C48A] disabled:opacity-40"
              >
                {saving
                  ? "Scheduling..."
                  : "Schedule"}
              </button>
            </div>
          </article>

          {/* HISTORY */}

          <article className="overflow-hidden rounded-[10px] border border-white/10 bg-[#111111]">
            <div className="border-b border-white/[0.07] px-5 py-4">
              <h2 className="font-serif text-[18px]">
                History
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[470px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[7px] uppercase tracking-[0.06em] text-white/25">
                    <th className="px-5 py-3 font-medium">
                      Message
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Reach
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    Array.from({
                      length: 6,
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
                              3
                            }
                            className="px-5 py-4"
                          >
                            <div className="h-4 animate-pulse rounded bg-white/[0.04]" />
                          </td>
                        </tr>
                      ),
                    )
                  ) : campaigns.length >
                    0 ? (
                    campaigns.map(
                      (
                        campaign,
                      ) => (
                        <tr
                          key={
                            campaign.id
                          }
                          className="border-b border-white/[0.05] last:border-0"
                        >
                          <td className="px-5 py-4">
                            <p className="max-w-[210px] truncate text-[8px] text-white/55">
                              {
                                campaign.title
                              }
                            </p>

                            {campaign.sendAt && (
                              <p className="mt-1 text-[6px] text-white/20">
                                {formatDate(
                                  campaign.sendAt,
                                )}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4 text-[8px] text-white/35">
                            {campaign.reach.toLocaleString()}
                          </td>

                          <td className="px-4 py-4">
                            <CampaignStatus
                              status={
                                campaign.status
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
                          3
                        }
                        className="px-5 py-14 text-center text-[9px] text-white/25"
                      >
                        No campaigns
                        yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>
    </AdminShell>
  );
}

function CampaignStatus({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toLowerCase();

  const styles =
    normalized === "sent"
      ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400"
      : normalized ===
          "scheduled"
        ? "border-[#C8A35A]/20 bg-[#C8A35A]/[0.08] text-[#C8A35A]"
        : normalized ===
            "failed"
          ? "border-red-500/20 bg-red-500/[0.08] text-red-400"
          : "border-white/10 bg-white/[0.03] text-white/35";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[6px] capitalize ${styles}`}
    >
      {normalized}
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
    return "";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}
