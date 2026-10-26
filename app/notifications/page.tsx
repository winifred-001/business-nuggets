"use client";

import {
  Bell,
  BookOpen,
  Check,
  Music2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import AuthRouteGuard from "@/components/AuthRouteGuard";
import { API_URL } from "@/lib/api";

type NotificationItem = {
  id: number;
  userId?: number;
  campaignId?: number | null;
  type?: string | null;
  title: string;
  message: string;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
};

type NotificationGroup = {
  label: string;
  items: NotificationItem[];
};

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      const token = localStorage.getItem("token");

      if (!token) {
        if (!cancelled) {
          setError("Please sign in to view your notifications.");
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`${API_URL}/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => []);

        if (!response.ok) {
          if (!cancelled) {
            setError(
              Array.isArray(data?.message)
                ? data.message.join(", ")
                : data?.message || "Could not load notifications.",
            );
          }
          return;
        }

        if (!cancelled) {
          setNotifications(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError("Could not connect to the server.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications],
  );

  const groups = useMemo<NotificationGroup[]>(() => {
    const today: NotificationItem[] = [];
    const yesterday: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    for (const notification of notifications) {
      const createdAt = new Date(notification.createdAt).getTime();

      if (createdAt >= startOfToday) {
        today.push(notification);
      } else if (createdAt >= startOfYesterday) {
        yesterday.push(notification);
      } else {
        earlier.push(notification);
      }
    }

    return [
      { label: "Today", items: today },
      { label: "Yesterday", items: yesterday },
      { label: "Earlier", items: earlier },
    ].filter((group) => group.items.length > 0);
  }, [notifications]);

  async function markAsRead(notificationId: number) {
    const existing = notifications.find(
      (notification) => notification.id === notificationId,
    );

    if (!existing || existing.readAt) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) return;

      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, readAt }
            : notification,
        ),
      );

      window.dispatchEvent(new Event("notifications-change"));
    } catch {
      setError("Could not update the notification.");
    }
  }

  async function markAllAsRead() {
    const token = localStorage.getItem("token");

    if (!token || unreadCount === 0 || markingAll) {
      return;
    }

    setMarkingAll(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Could not mark notifications as read.",
        );
        return;
      }

      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: notification.readAt || readAt,
        })),
      );

      window.dispatchEvent(new Event("notifications-change"));
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setMarkingAll(false);
    }
  }

  async function openNotification(notification: NotificationItem) {
    await markAsRead(notification.id);
    router.push(notification.href || "/library");
  }

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="bn-hero-title font-serif text-[40px] leading-tight text-[#FAF9F6]">
                Notification Centre
              </h1>

              <p className="mt-3 text-[13px] leading-6 text-white/40">
                Stay updated on direct updates, followed topics, and account activity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void markAllAsRead()}
              disabled={unreadCount === 0 || markingAll}
              className="inline-flex w-fit items-center gap-2 rounded-md border border-white/10 px-4 py-2.5 text-[11px] text-white/60 transition hover:border-white/20 hover:text-white disabled:cursor-default disabled:opacity-40"
            >
              <Check size={14} />
              {markingAll
                ? "Updating..."
                : unreadCount === 0
                  ? "All notifications read"
                  : `Mark all as read (${unreadCount})`}
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[11px] text-red-300">
              {error}
            </div>
          )}

          <section className="mt-8 rounded-[10px] border border-white/10 bg-[#111111] p-4 sm:p-6">
            {loading ? (
              <p className="py-10 text-center text-[12px] text-white/35">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#181818] text-[#C8A35A]">
                  <Bell size={18} />
                </div>
                <h2 className="mt-4 font-serif text-[18px] text-white/85">
                  You&apos;re all caught up
                </h2>
                <p className="mt-2 max-w-md text-[11px] leading-5 text-white/35">
                  New Business Nuggets updates and account notifications will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {groups.map((group) => (
                  <NotificationGroupView
                    key={group.label}
                    title={group.label}
                    items={group.items}
                    onView={(notification) =>
                      void openNotification(notification)
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}

function NotificationGroupView({
  title,
  items,
  onView,
}: {
  title: string;
  items: NotificationItem[];
  onView: (notification: NotificationItem) => void;
}) {
  return (
    <section>
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#C8A35A]">
        {title}
      </h2>

      <div className="space-y-3">
        {items.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onView={() => onView(notification)}
          />
        ))}
      </div>
    </section>
  );
}

function NotificationCard({
  notification,
  onView,
}: {
  notification: NotificationItem;
  onView: () => void;
}) {
  const read = Boolean(notification.readAt);
  const Icon = getNotificationIcon(notification.type);

  return (
    <article
      className={`relative flex flex-col gap-4 rounded-lg border px-4 py-4 transition sm:flex-row sm:items-center ${
        read
          ? "border-white/[0.06] bg-[#0D0D0D]"
          : "border-white/10 bg-[#18181B]"
      }`}
    >
      {!read && (
        <span className="absolute left-3 top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#C8A35A] sm:block" />
      )}

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-[#1D1D20] text-[#C8A35A] sm:ml-3">
        <Icon size={15} strokeWidth={1.7} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#C8A35A]">
            {formatType(notification.type)}
          </span>
          <span className="text-[9px] text-white/25">
            • {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        <h3 className="mt-1 font-serif text-[15px] leading-5 text-white/85">
          {notification.title}
        </h3>

        <p className="mt-1 max-w-[850px] text-[10px] leading-5 text-white/35">
          {notification.message}
        </p>
      </div>

      <button
        type="button"
        onClick={onView}
        className="shrink-0 self-start rounded-md border border-white/10 px-4 py-2 text-[10px] text-white/55 transition hover:border-[#C8A35A]/40 hover:text-[#C8A35A] sm:self-center"
      >
        View
      </button>
    </article>
  );
}

function getNotificationIcon(type?: string | null) {
  const normalized = (type || "system").toLowerCase();

  if (normalized.includes("musical")) return Music2;
  if (normalized.includes("topic") || normalized.includes("follow")) return Bell;
  if (normalized.includes("nugget")) return BookOpen;
  return ShieldCheck;
}

function formatType(type?: string | null) {
  return (type || "system")
    .replace(/[-_]+/g, " ")
    .trim()
    .toUpperCase();
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const time = date.getTime();

  if (!Number.isFinite(time)) return "Recently";

  const difference = Math.max(0, Date.now() - time);
  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
