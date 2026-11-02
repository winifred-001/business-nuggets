"use client";

import BrandMark from "@/components/BrandMark";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  LogOut,
  UserRound,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

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

const landingLinks = [
  { href: "/", label: "Home" },
  { href: "/library", label: "Library" },
  { href: "/philosophy", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/faqs", label: "FAQs" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function readAuth() {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      setIsLoggedIn(Boolean(token));

      if (!storedUser) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    readAuth();
    window.addEventListener("auth-change", readAuth);
    window.addEventListener("storage", readAuth);

    return () => {
      window.removeEventListener("auth-change", readAuth);
      window.removeEventListener("storage", readAuth);
    };
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadUnreadCount() {
      const token = localStorage.getItem("token");
      if (!token) {
        if (!cancelled) setUnreadNotifications(0);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.ok ? await response.json().catch(() => ({})) : {};

        if (!cancelled) {
          setUnreadNotifications(
            typeof data.unreadCount === "number" ? Math.max(0, data.unreadCount) : 0,
          );
        }
      } catch {
        if (!cancelled) setUnreadNotifications(0);
      }
    }

    const refresh = () => void loadUnreadCount();
    refresh();
    window.addEventListener("notifications-change", refresh);
    window.addEventListener("auth-change", refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("notifications-change", refresh);
      window.removeEventListener("auth-change", refresh);
    };
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const homeHref = isLoggedIn ? "/home" : "/";
  const links = [
    ...landingLinks.map((link) =>
      link.label === "Home" ? { ...link, href: homeHref } : link,
    ),
    ...(isLoggedIn
      ? [
          { href: "/library/saved-nuggets", label: "Saved Nuggets" },
          { href: "/library/playlist", label: "Playlists" },
          { href: "/library/personal-notes", label: "Notes" },
        ]
      : []),
  ];

  function isActive(href: string) {
    return pathname === href;
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    setUnreadNotifications(0);
    setProfileOpen(false);
    setMobileOpen(false);
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
    router.refresh();
  }

  const displayName =
    user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "My Account";
  const displayEmail = user?.email ?? "";

  return (
    <>
      <div className="h-1 bg-[linear-gradient(90deg,#6d4c1c,#e1be79,#6d4c1c)]" />

      <header className="sticky top-0 z-50 h-[89px] border-b border-[rgba(234,210,160,.19)] bg-[#12130f] text-[#f9f5ed] max-[600px]:h-[76px]">
        <div className="mx-auto flex h-full w-[calc(100%-38px)] max-w-[1190px] items-center justify-between gap-3 lg:w-[calc(100%-64px)]">
          <Link
            href={homeHref}
            className="flex min-w-0 items-center gap-[13px] lg:min-w-[210px]"
            aria-label="Business Nuggets home"
          >
            <BrandMark />

            <span className="block">
              <strong className="block text-[13px] font-bold tracking-[0.13em] text-[#f9f5ed] max-[600px]:text-[11px]">
                BUSINESS NUGGETS
              </strong>
              <em className="block font-serif text-[14px] font-normal text-[#cda762]">
                from the Bible
              </em>
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className={`${
              mobileOpen
                ? "absolute left-0 right-0 top-full flex"
                : "hidden"
            } z-40 max-h-[calc(100dvh-90px)] overflow-y-auto flex-col gap-0 border-b border-[rgba(234,210,160,.19)] bg-[#151611] px-[30px] py-[25px] text-[13px] text-[#c4c3be] lg:static lg:max-h-none lg:overflow-visible lg:flex lg:flex-row lg:items-center lg:gap-[12px] xl:gap-[16px] lg:border-0 lg:bg-transparent lg:p-0`}
          >
            {links.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`relative whitespace-nowrap py-3 transition lg:py-0 ${
                    active ? "text-[#ead2a0]" : "hover:text-[#ead2a0]"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-1 left-0 h-px w-full bg-[#cda762] lg:-bottom-[10px]" />
                  )}
                </Link>
              );
            })}

            {!isLoggedIn && (
              <div className="mt-4 flex items-center gap-[22px] border-t border-[rgba(234,210,160,.19)] pt-4 lg:hidden">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-[#bcbab4] transition hover:text-[#ead2a0]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="bn-button inline-flex items-center justify-center border border-[#cda762] bg-[#cda762] px-[22px] py-[11px] font-bold text-[#17140e] transition hover:bg-[#e0bf80]"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {isLoggedIn && (
              <div className="mt-4 border-t border-[rgba(234,210,160,.19)] pt-4 lg:hidden">
                <Link
                  href="/notifications"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between py-3 text-[#c4c3be]"
                >
                  <span>Notifications</span>
                  {unreadNotifications > 0 && (
                    <span className="bg-[#cda762] px-2 py-0.5 text-[9px] font-bold text-[#17140e]">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </Link>

                <div className="mt-2 border-t border-[rgba(234,210,160,.19)] pt-4">
                  <div className="flex items-start gap-3 pb-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center border border-[#61563c] text-[#ead2a0]">
                      <UserRound size={18} strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#f9f5ed]">{displayName}</p>
                      {displayEmail && (
                        <p className="mt-1 truncate text-[11px] text-[#b4b2ab]">{displayEmail}</p>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/library/account"
                    className="block py-3 text-[#c4c3be] transition hover:text-[#ead2a0]"
                    onClick={() => setMobileOpen(false)}
                  >
                    Account Settings
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 py-3 text-left text-[#d78484] transition hover:text-[#f0aaaa]"
                  >
                    <LogOut size={16} strokeWidth={1.7} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-[22px] text-[13px]">
            {!isLoggedIn ? (
              <div className="hidden items-center gap-[22px] lg:flex">
                <Link href="/login" className="text-[#bcbab4] transition hover:text-[#ead2a0]">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bn-button inline-flex items-center justify-center border border-[#cda762] bg-[#cda762] px-[22px] py-[11px] font-bold text-[#17140e] transition hover:-translate-y-0.5 hover:bg-[#e0bf80]"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="hidden items-center gap-3 lg:flex">
                <Link
                  href="/notifications"
                  aria-label={
                    unreadNotifications > 0
                      ? `Notifications, ${unreadNotifications} unread`
                      : "Notifications"
                  }
                  className="relative grid h-[46px] w-[46px] place-items-center border border-[#61563c] text-[#ead2a0] transition hover:bg-[#28251e]"
                >
                  <Bell size={18} strokeWidth={1.6} />
                  {unreadNotifications > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex min-h-[17px] min-w-[17px] items-center justify-center bg-[#cda762] px-1 text-[8px] font-bold text-[#17140e]">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </Link>

                <div ref={profileRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((current) => !current)}
                    aria-label="Profile"
                    aria-controls="profile-dropdown"
                    aria-haspopup="true"
                    aria-expanded={profileOpen}
                    className="grid h-[46px] w-[46px] place-items-center border border-[#61563c] bg-transparent text-[#f2e5cd] transition hover:bg-[#28251e]"
                  >
                    <UserRound size={20} strokeWidth={1.6} />
                  </button>

                  {profileOpen && (
                    <div
                      id="profile-dropdown"
                      className="absolute right-0 top-[54px] z-50 w-[240px] border border-[rgba(234,210,160,.19)] bg-[#191b18] shadow-2xl"
                    >
                      <div className="border-b border-[rgba(234,210,160,.19)] px-4 py-4">
                        <p className="truncate text-[13px] font-semibold text-[#f9f5ed]">{displayName}</p>
                        {displayEmail && (
                          <p className="mt-1 truncate text-[11px] text-[#b4b2ab]">{displayEmail}</p>
                        )}
                      </div>

                      <div className="p-2">
                        <Link
                          href="/library/account"
                          onClick={() => setProfileOpen(false)}
                          className="block px-3 py-2.5 text-[12px] text-[#b8b5aa] transition hover:bg-[#28251e] hover:text-[#ead2a0]"
                        >
                          Account Settings
                        </Link>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[12px] text-[#d78484] transition hover:bg-[#28251e] hover:text-[#f0aaaa]"
                        >
                          <LogOut size={15} strokeWidth={1.7} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              className="border-0 bg-transparent text-[26px] leading-none text-[#cda762] lg:hidden"
              aria-label={mobileOpen ? "Close navigation" : "Toggle navigation"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
            >
              <span aria-hidden="true" data-button-icon>
                {mobileOpen ? "×" : "☰"}
              </span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
