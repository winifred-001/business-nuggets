"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ChevronDown,
  LogOut,
  Menu,
  NotebookPen,
  Search,
  UserCircle,
  X,
  Bookmark,
  ListMusic,
  Settings,
  Bell,
} from "lucide-react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { API_URL } from "@/lib/api";

type StoredUser = {
  id?: number | string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string | null;
  image?: string | null;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  const profileRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    function readAuth() {
      const token =
        localStorage.getItem("token");

      const storedUser =
        localStorage.getItem("user");

      setIsLoggedIn(Boolean(token));

      if (storedUser) {
        try {
          setUser(
            JSON.parse(storedUser),
          );
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }

    readAuth();

    window.addEventListener(
      "auth-change",
      readAuth,
    );

    window.addEventListener(
      "storage",
      readAuth,
    );

    return () => {
      window.removeEventListener(
        "auth-change",
        readAuth,
      );

      window.removeEventListener(
        "storage",
        readAuth,
      );
    };
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadUnreadCount() {
      const token = localStorage.getItem("token");

      if (!token) {
        if (!cancelled) {
          setUnreadNotifications(0);
        }
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/notifications/unread-count`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          if (!cancelled) {
            setUnreadNotifications(0);
          }
          return;
        }

        const data = await response.json().catch(() => ({}));

        if (!cancelled) {
          setUnreadNotifications(
            typeof data.unreadCount === "number"
              ? Math.max(0, data.unreadCount)
              : 0,
          );
        }
      } catch {
        if (!cancelled) {
          setUnreadNotifications(0);
        }
      }
    }

    const refreshUnreadCount = () => {
      void loadUnreadCount();
    };

    refreshUnreadCount();

    window.addEventListener(
      "notifications-change",
      refreshUnreadCount,
    );

    window.addEventListener(
      "auth-change",
      refreshUnreadCount,
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "notifications-change",
        refreshUnreadCount,
      );

      window.removeEventListener(
        "auth-change",
        refreshUnreadCount,
      );
    };
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target as Node,
        )
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
  }, []);

  const homeHref = isLoggedIn
    ? "/home"
    : "/";

  const links = [
    {
      href: homeHref,
      label: "Home",
    },
    {
      href: "/library",
      label: "Library",
    },
    {
      href: "/search",
      label: "Search",
    },
  ];

  function isActive(
    href: string,
  ) {
    if (
      href === "/" ||
      href === "/home"
    ) {
      return pathname === href;
    }

    return pathname.startsWith(
      href,
    );
  }

  function handleLogout() {
    localStorage.removeItem(
      "token",
    );

    localStorage.removeItem(
      "user",
    );

    setIsLoggedIn(false);
    setUser(null);
    setUnreadNotifications(0);
    setProfileOpen(false);
    setMobileOpen(false);

    window.dispatchEvent(
      new Event("auth-change"),
    );

    router.push("/");
    router.refresh();
  }

  const displayName =
    user?.name ||
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "My Account";

  const displayEmail =
    user?.email ?? "";

  return (
    <header className="relative z-50 border-b border-white/[0.06] bg-[#0B0B0B] text-[#FAF9F6]">
      <div className="mx-auto flex h-[80px] max-w-[1280px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link
          href={homeHref}
          className="flex shrink-0 items-center gap-3"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C8A35A] text-[14px] font-bold text-[#080808]">
            B
          </span>

          <div className="hidden sm:block">
            <p className="text-[11px] font-bold uppercase leading-none tracking-[0.04em] text-white">
              Business Nuggets
            </p>

            <p className="mt-1 font-serif text-[10px] italic leading-none text-[#C8A35A]">
              from the Bible
            </p>
          </div>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 md:flex"
        >
          {links.map((link) => {
            const active =
              isActive(link.href);

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative py-2 text-[13px] transition ${
                  active
                    ? "text-[#C8A35A]"
                    : "text-white/55 hover:text-white"
                }`}
              >
                {link.label}

                {active && (
                  <span className="absolute -bottom-[25px] left-0 h-[2px] w-full bg-[#C8A35A]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {!isLoggedIn && (
            <div className="hidden items-center gap-4 sm:flex">
              <Link
                href="/login"
                className="text-[13px] font-medium text-white/70 transition hover:text-white"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#C8A35A] px-5 text-[13px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
              >
                Sign Up
              </Link>
            </div>
          )}

          {isLoggedIn && (
            <>
              <Link
                href="/notifications"
                aria-label={
                  unreadNotifications > 0
                    ? `Notifications, ${unreadNotifications} unread`
                    : "Notifications"
                }
                className={`relative flex h-10 w-10 items-center justify-center rounded-full transition ${
                  pathname.startsWith(
                    "/notifications",
                  )
                    ? "bg-[#C8A35A]/10 text-[#C8A35A]"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-[#C8A35A]"
                }`}
              >
                <Bell
                  size={20}
                  strokeWidth={1.6}
                />

                {unreadNotifications > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#C8A35A] px-1 text-[8px] font-bold leading-none text-[#080808]">
                    {unreadNotifications > 9
                      ? "9+"
                      : unreadNotifications}
                  </span>
                )}
              </Link>

              <div
                ref={profileRef}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() =>
                    setProfileOpen(
                      (current) =>
                        !current,
                    )
                  }
                  aria-label="Open account menu"
                  aria-expanded={
                    profileOpen
                  }
                  className="flex items-center gap-1.5 rounded-full text-white/70 transition hover:text-[#C8A35A]"
                >
                  {user?.avatar ||
                  user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        user.avatar ||
                        user.image ||
                        ""
                      }
                      alt=""
                      className="h-9 w-9 rounded-full border border-[#C8A35A]/40 object-cover"
                    />
                  ) : (
                    <UserCircle
                      size={34}
                      strokeWidth={1.4}
                      className="text-[#E0C48A]"
                    />
                  )}

                  <ChevronDown
                    size={13}
                    className={`hidden transition-transform sm:block ${
                      profileOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[48px] w-[240px] overflow-hidden rounded-xl border border-white/10 bg-[#111111] shadow-2xl">
                    <div className="border-b border-white/[0.07] px-4 py-4">
                      <p className="truncate text-[14px] font-medium text-[#FAF9F6]">
                        {displayName}
                      </p>

                      {displayEmail && (
                        <p className="mt-1 truncate text-[12px] text-white/35">
                          {displayEmail}
                        </p>
                      )}
                    </div>

                    <div className="p-2">
                      <ProfileLink
                        href="/workspace"
                        icon={
                          <UserCircle
                            size={16}
                          />
                        }
                      >
                        My Workspace
                      </ProfileLink>

                      <ProfileLink
                        href="/library/saved-nuggets"
                        icon={
                          <Bookmark
                            size={16}
                          />
                        }
                      >
                        Saved Nuggets
                      </ProfileLink>

                      <ProfileLink
                        href="/library/playlist"
                        icon={
                          <ListMusic
                            size={16}
                          />
                        }
                      >
                        Playlists
                      </ProfileLink>

                      <ProfileLink
                        href="/library/personal-notes"
                        icon={
                          <NotebookPen
                            size={16}
                          />
                        }
                      >
                        Notes
                      </ProfileLink>

                      <ProfileLink
                        href="/library/account"
                        icon={
                          <Settings
                            size={16}
                          />
                        }
                      >
                        Account Settings
                      </ProfileLink>
                    </div>

                    <div className="border-t border-white/[0.07] p-2">
                      <button
                        type="button"
                        onClick={
                          handleLogout
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[13px] text-[#D66B6B] transition hover:bg-white/[0.04]"
                      >
                        <LogOut
                          size={16}
                        />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                (current) =>
                  !current,
              )
            }
            aria-label={
              mobileOpen
                ? "Close menu"
                : "Open menu"
            }
            aria-expanded={
              mobileOpen
            }
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/70 md:hidden"
          >
            {mobileOpen ? (
              <X size={18} />
            ) : (
              <Menu size={18} />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/[0.06] bg-[#0B0B0B] md:hidden">
          <nav className="mx-auto max-w-[1280px] px-5 py-4 sm:px-8">
            <div className="space-y-1">
              {links.map((link) => {
                const active =
                  isActive(
                    link.href,
                  );

                return (
                  <Link
                    key={
                      link.label
                    }
                    href={
                      link.href
                    }
                    className={`block rounded-lg px-3 py-3 text-[14px] ${
                      active
                        ? "bg-[#C8A35A]/10 text-[#C8A35A]"
                        : "text-white/60"
                    }`}
                  >
                    {
                      link.label
                    }
                  </Link>
                );
              })}

              <Link
                href="/musicals"
                className="block rounded-lg px-3 py-3 text-[14px] text-white/60"
              >
                Musicals
              </Link>
            </div>

            {!isLoggedIn ? (
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4">
                <Link
                  href="/login"
                  className="flex min-h-11 items-center justify-center rounded-lg border border-white/15 text-[13px] font-medium text-white"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="flex min-h-11 items-center justify-center rounded-lg bg-[#C8A35A] text-[13px] font-semibold text-[#080808]"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-1 border-t border-white/[0.07] pt-4">
                <Link
                  href="/notifications"
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-[14px] text-white/60"
                >
                  <span>Notifications</span>
                  {unreadNotifications > 0 && (
                    <span className="rounded-full bg-[#C8A35A] px-2 py-0.5 text-[9px] font-semibold text-[#080808]">
                      {unreadNotifications > 9
                        ? "9+"
                        : unreadNotifications}
                    </span>
                  )}
                </Link>

                <Link
                  href="/library/saved-nuggets"
                  className="block rounded-lg px-3 py-3 text-[14px] text-white/60"
                >
                  Saved Nuggets
                </Link>

                <Link
                  href="/library/playlist"
                  className="block rounded-lg px-3 py-3 text-[14px] text-white/60"
                >
                  Playlists
                </Link>

                <Link
                  href="/library/personal-notes"
                  className="block rounded-lg px-3 py-3 text-[14px] text-white/60"
                >
                  Notes
                </Link>

                <Link
                  href="/library/account"
                  className="block rounded-lg px-3 py-3 text-[14px] text-white/60"
                >
                  Account Settings
                </Link>

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="w-full rounded-lg px-3 py-3 text-left text-[14px] text-[#D66B6B]"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function ProfileLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] text-white/55 transition hover:bg-white/[0.04] hover:text-white"
    >
      <span className="text-[#C8A35A]">
        {icon}
      </span>
      {children}
    </Link>
  );
}
