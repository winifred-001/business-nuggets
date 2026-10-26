"use client";

import Link from "next/link";

import {
  Bell,
  Bookmark,
  CircleUserRound,
  Headphones,
  ListMusic,
  LogOut,
  NotebookPen,
  Settings,
  UserRoundCheck,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import AuthRouteGuard from "@/components/AuthRouteGuard";

import { API_URL } from "@/lib/api";

type User = {
  id: number;
  name: string;
  email: string;
  role?: string;
};

type WorkspaceCard = {
  title: string;
  description: string;
  action: string;
  href: string;
  count?: number;
  icon:
    | "saved"
    | "notes"
    | "playlists"
    | "history"
    | "following"
    | "notifications";
};

export default function WorkspacePage() {
  const router =
    useRouter();

  const [user, setUser] =
    useState<User | null>(
      null,
    );

  const [
    savedCount,
    setSavedCount,
  ] = useState(0);

  const [
    notesCount,
    setNotesCount,
  ] = useState(0);

  const [
    playlistCount,
    setPlaylistCount,
  ] = useState(0);

  const [
    historyCount,
    setHistoryCount,
  ] = useState(0);

  const [
    followingCount,
    setFollowingCount,
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  /* =========================================
     LOAD WORKSPACE
  ========================================= */

  useEffect(() => {
    async function loadWorkspace() {
      const token =
        localStorage.getItem(
          "token",
        );

      if (!token) {
        setLoading(false);
        return;
      }

      const headers = {
        Authorization:
          `Bearer ${token}`,
      };

      try {
        const [
          userResponse,
          savedResponse,
          notesResponse,
          playlistsResponse,
          historyResponse,
          followingResponse,
        ] =
          await Promise.all([
            fetch(
              `${API_URL}/users/me`,
              {
                headers,
              },
            ),

            fetch(
              `${API_URL}/saved-nuggets`,
              {
                headers,
              },
            ),

            fetch(
              `${API_URL}/notes`,
              {
                headers,
              },
            ),

            fetch(
              `${API_URL}/playlists`,
              {
                headers,
              },
            ),

            fetch(
              `${API_URL}/history`,
              {
                headers,
              },
            ),

            fetch(
              `${API_URL}/following/topics`,
              {
                headers,
              },
            ),
          ]);

        if (
          userResponse.ok
        ) {
          const userData =
            await userResponse.json();

          setUser(userData);
        }

        if (
          savedResponse.ok
        ) {
          const data =
            await savedResponse.json();

          setSavedCount(
            Array.isArray(data)
              ? data.length
              : 0,
          );
        }

        if (
          notesResponse.ok
        ) {
          const data =
            await notesResponse.json();

          setNotesCount(
            Array.isArray(data)
              ? data.length
              : 0,
          );
        }

        if (
          playlistsResponse.ok
        ) {
          const data =
            await playlistsResponse.json();

          setPlaylistCount(
            Array.isArray(data)
              ? data.length
              : 0,
          );
        }

        if (
          historyResponse.ok
        ) {
          const data =
            await historyResponse.json();

          setHistoryCount(
            Array.isArray(data)
              ? data.length
              : 0,
          );
        }

        if (
          followingResponse.ok
        ) {
          const data =
            await followingResponse.json();

          setFollowingCount(
            Array.isArray(data)
              ? data.length
              : 0,
          );
        }
      } catch {
        console.error(
          "Could not load workspace.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadWorkspace();
  }, []);

  /* =========================================
     LOGOUT
  ========================================= */

  function signOut() {
    localStorage.removeItem(
      "token",
    );

    localStorage.removeItem(
      "user",
    );

    window.dispatchEvent(
      new Event(
        "auth-change",
      ),
    );

    router.replace("/");
  }

  /* =========================================
     CARDS
  ========================================= */

  const cards: WorkspaceCard[] =
    [
      {
        title:
          "Saved Nuggets",

        description:
          "Your bookmarked scripture and business teachings.",

        action:
          "Open Saved Nuggets",

        href:
          "/library/saved-nuggets",

        count:
          savedCount,

        icon: "saved",
      },

      {
        title:
          "My Journal & Notes",

        description:
          "Reflect on principles and practical applications.",

        action:
          "Open My Journal & Notes",

        href:
          "/library/personal-notes",

        count:
          notesCount,

        icon: "notes",
      },

      {
        title:
          "My Playlists",

        description:
          "Organize your executive listening paths.",

        action:
          "Open My Playlists",

        href:
          "/library/playlist",

        count:
          playlistCount,

        icon:
          "playlists",
      },

      {
        title:
          "Listening Activity & Logs",

        description:
          "Review listening history or recently viewed pages.",

        action:
          "Open Listening Activity & Logs",

        href:
          "/library/history",

        count:
          historyCount,

        icon: "history",
      },

      {
        title:
          "Following",

        description:
          "Manage topics, challenges and collections.",

        action:
          "Open Following",

        href:
          "/library/following",

        count:
          followingCount,

        icon:
          "following",
      },

      {
        title:
          "Notifications",

        description:
          "Daily wisdom and followed channel updates.",

        action:
          "Open Notifications",

        href:
          "/notifications",

        icon:
          "notifications",
      },
    ];

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10">
          {/* BACK */}

          <Link
            href="/home"
            className="text-[10px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
          >
            ← My Homepage
          </Link>

          {/* HEADING */}

          <section className="mt-3">
            <h1 className="bn-hero-title font-serif text-[40px] leading-tight">
              My Wisdom
              Workspace
            </h1>

            <p className="mt-3 text-[13px] leading-6 text-white/40">
              Your personal
              library,
              reflections and
              account in one
              place.
            </p>
          </section>

          {/* USER CARD */}

          <section className="mt-8 rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
            {loading ? (
              <p className="text-[11px] text-white/30">
                Loading
                workspace...
              </p>
            ) : (
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  {/* PROFILE */}

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#181818]">
                    <CircleUserRound
                      size={30}
                      className="text-white/55"
                    />
                  </div>

                  <div>
                    <h2 className="font-serif text-[24px] leading-tight">
                      {user?.name ||
                        "Business Nuggets Member"}
                    </h2>

                    <p className="mt-1 text-[10px] text-white/35">
                      {user?.email ||
                        ""}
                    </p>

                    <span className="mt-3 inline-flex rounded-sm bg-[#C8A35A]/15 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.05em] text-[#C8A35A]">
                      BNB Member
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/membership"
                    className="bn-button inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 bg-[#080808] px-4 text-[10px] font-medium text-white/70 transition hover:border-[#C8A35A]/30 hover:text-white"
                  >
                    Membership
                    Details →
                  </Link>

                  <Link
                    href="/library/account"
                    className="bn-button inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#C8A35A] px-5 text-[10px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                  >
                    <Settings
                      size={
                        13
                      }
                    />

                    Settings →
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* WORKSPACE GRID */}

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map(
              (card) => (
                <WorkspaceCard
                  key={
                    card.title
                  }
                  card={
                    card
                  }
                />
              ),
            )}
          </section>

          {/* BOTTOM */}

          <section className="mt-7 flex flex-col gap-5 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/library/account"
              className="inline-flex items-center gap-2 text-[10px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              <Settings
                size={
                  13
                }
              />

              Account &amp;
              Workspace
              Settings →
            </Link>

            <button
              type="button"
              onClick={
                signOut
              }
              className="inline-flex w-fit items-center gap-2 rounded-md border border-white/10 px-4 py-2.5 text-[10px] text-white/60 transition hover:border-red-500/30 hover:text-red-400"
            >
              <LogOut
                size={13}
              />

              Sign Out
            </button>
          </section>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}

/* =========================================
   WORKSPACE CARD
========================================= */

function WorkspaceCard({
  card,
}: {
  card: WorkspaceCard;
}) {
  const Icon =
    card.icon ===
    "saved"
      ? Bookmark
      : card.icon ===
          "notes"
        ? NotebookPen
        : card.icon ===
            "playlists"
          ? ListMusic
          : card.icon ===
              "history"
            ? Headphones
            : card.icon ===
                "following"
              ? UserRoundCheck
              : Bell;

  return (
    <Link
      href={card.href}
      className="group flex min-h-[190px] flex-col rounded-[10px] border border-white/10 bg-[#111111] p-5 transition hover:border-[#C8A35A]/35"
    >
      <div className="flex items-start justify-between gap-4">
        <Icon
          size={16}
          className="text-[#C8A35A]"
        />

        {card.count !==
          undefined && (
          <span className="rounded-full border border-white/[0.07] px-2 py-1 text-[8px] text-white/30">
            {card.count}
          </span>
        )}
      </div>

      <h2 className="mt-5 font-serif text-[18px] leading-6 text-white/90 transition group-hover:text-[#C8A35A]">
        {card.title}
      </h2>

      <p className="mt-3 text-[11px] leading-5 text-white/35">
        {
          card.description
        }
      </p>

      <span className="mt-auto pt-5 text-[9px] font-medium text-[#C8A35A]">
        {card.action} →
      </span>
    </Link>
  );
}