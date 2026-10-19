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

/* =========================================================
   TEMPORARY NOTIFICATION DATA

   We do not have a notifications backend yet.
   Read/unread state is stored locally for now.
========================================================= */

type NotificationItem = {
  id: string;
  group: "TODAY" | "YESTERDAY";
  type: string;
  time: string;
  title: string;
  description: string;
  href: string;
  icon: "nugget" | "topic" | "musical" | "system";
};

const notifications: NotificationItem[] = [
  {
    id: "daily-nugget-1",
    group: "TODAY",
    type: "TODAY'S NUGGET",
    time: "10 min ago",
    title: "The Law of Just Balances in Corporate Negotiation",
    description:
      "New daily commentary on Proverbs 11:1. Honesty is not a moral compromise; it is tactical dominion.",
    href: "/library",
    icon: "nugget",
  },

  {
    id: "followed-topic-1",
    group: "TODAY",
    type: "FOLLOWED TOPIC UPDATE",
    time: "2 hours ago",
    title: "New Nugget added to 'Leadership & Governance'",
    description:
      "Exodus 18: Jethro's delegation plan for scale is now available in premium format.",
    href: "/topics/leadership-governance",
    icon: "topic",
  },

  {
    id: "musical-1",
    group: "YESTERDAY",
    type: "NEW WISDOM MUSICAL",
    time: "1 day ago",
    title: "Genesis 41: Joseph's Reserve Blueprint Released",
    description:
      "A new cinematic Wisdom Musical is now available to explore.",
    href: "/musicals",
    icon: "musical",
  },

  {
    id: "system-1",
    group: "YESTERDAY",
    type: "SYSTEM NOTICE",
    time: "1 day ago",
    title: "Your Business Nuggets workspace is ready",
    description:
      "Your account and workspace preferences can be managed from Account Settings.",
    href: "/library/account",
    icon: "system",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function NotificationsPage() {
  const router = useRouter();

  const [readIds, setReadIds] =
    useState<string[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  /* =======================================================
     LOAD READ STATE
  ======================================================= */

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          "readNotifications",
        );

      if (stored) {
        setReadIds(
          JSON.parse(stored),
        );
      }
    } catch {
      setReadIds([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  /* =======================================================
     HELPERS
  ======================================================= */

  function saveReadState(
    ids: string[],
  ) {
    setReadIds(ids);

    localStorage.setItem(
      "readNotifications",
      JSON.stringify(ids),
    );

    window.dispatchEvent(
      new Event(
        "notifications-change",
      ),
    );
  }

  function markAsRead(
    id: string,
  ) {
    if (readIds.includes(id)) {
      return;
    }

    saveReadState([
      ...readIds,
      id,
    ]);
  }

  function markAllAsRead() {
    saveReadState(
      notifications.map(
        (notification) =>
          notification.id,
      ),
    );
  }

  function openNotification(
    notification: NotificationItem,
  ) {
    markAsRead(
      notification.id,
    );

    router.push(
      notification.href,
    );
  }

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !readIds.includes(
              notification.id,
            ),
        ).length,
      [readIds],
    );

  const today =
    notifications.filter(
      (notification) =>
        notification.group ===
        "TODAY",
    );

  const yesterday =
    notifications.filter(
      (notification) =>
        notification.group ===
        "YESTERDAY",
    );

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          {/* ===============================================
              HEADER
          =============================================== */}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-[40px] leading-tight text-[#FAF9F6]">
                Notification Centre
              </h1>

              <p className="mt-3 text-[13px] leading-6 text-white/40">
                Stay updated on direct
                updates, followed topics,
                and daily corporate wisdom.
              </p>
            </div>

            <button
              type="button"
              onClick={
                markAllAsRead
              }
              disabled={
                unreadCount === 0
              }
              className="inline-flex w-fit items-center gap-2 rounded-md border border-white/10 px-4 py-2.5 text-[11px] text-white/60 transition hover:border-white/20 hover:text-white disabled:cursor-default disabled:opacity-40"
            >
              <Check
                size={14}
              />

              {unreadCount === 0
                ? "All notifications read"
                : "Mark all as read"}
            </button>
          </div>

          {/* ===============================================
              CENTRE
          =============================================== */}

          <section className="mt-8 rounded-[10px] border border-white/10 bg-[#111111] p-4 sm:p-6">
            {!loaded ? (
              <p className="py-10 text-center text-[12px] text-white/35">
                Loading notifications...
              </p>
            ) : (
              <>
                {/* TODAY */}

                <NotificationGroup
                  title="Today"
                  items={today}
                  readIds={readIds}
                  onView={
                    openNotification
                  }
                />

                {/* YESTERDAY */}

                <div className="mt-8">
                  <NotificationGroup
                    title="Yesterday"
                    items={
                      yesterday
                    }
                    readIds={
                      readIds
                    }
                    onView={
                      openNotification
                    }
                  />
                </div>
              </>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}

/* =========================================================
   GROUP
========================================================= */

function NotificationGroup({
  title,
  items,
  readIds,
  onView,
}: {
  title: string;
  items: NotificationItem[];
  readIds: string[];
  onView: (
    notification: NotificationItem,
  ) => void;
}) {
  return (
    <section>
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#C8A35A]">
        {title}
      </h2>

      <div className="space-y-3">
        {items.map(
          (notification) => (
            <NotificationCard
              key={
                notification.id
              }
              notification={
                notification
              }
              read={readIds.includes(
                notification.id,
              )}
              onView={() =>
                onView(
                  notification,
                )
              }
            />
          ),
        )}
      </div>
    </section>
  );
}

/* =========================================================
   CARD
========================================================= */

function NotificationCard({
  notification,
  read,
  onView,
}: {
  notification: NotificationItem;
  read: boolean;
  onView: () => void;
}) {
  const Icon =
    getNotificationIcon(
      notification.icon,
    );

  return (
    <article
      className={`relative flex flex-col gap-4 rounded-lg border px-4 py-4 transition sm:flex-row sm:items-center ${
        read
          ? "border-white/[0.06] bg-[#0D0D0D]"
          : "border-white/10 bg-[#18181B]"
      }`}
    >
      {/* UNREAD DOT */}

      {!read && (
        <span className="absolute left-3 top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#C8A35A] sm:block" />
      )}

      {/* ICON */}

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-[#1D1D20] text-[#C8A35A] sm:ml-3">
        <Icon
          size={15}
          strokeWidth={1.7}
        />
      </div>

      {/* CONTENT */}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#C8A35A]">
            {
              notification.type
            }
          </span>

          <span className="text-[9px] text-white/25">
            •{" "}
            {
              notification.time
            }
          </span>
        </div>

        <h3 className="mt-1 font-serif text-[15px] leading-5 text-white/85">
          {
            notification.title
          }
        </h3>

        <p className="mt-1 max-w-[850px] text-[10px] leading-5 text-white/35">
          {
            notification.description
          }
        </p>
      </div>

      {/* ACTION */}

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

/* =========================================================
   ICON
========================================================= */

function getNotificationIcon(
  type: NotificationItem["icon"],
) {
  switch (type) {
    case "nugget":
      return BookOpen;

    case "topic":
      return Bell;

    case "musical":
      return Music2;

    case "system":
      return ShieldCheck;

    default:
      return Bell;
  }
}