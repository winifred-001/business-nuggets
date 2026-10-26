"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Bookmark,
  ChevronDown,
  ListMusic,
  LogOut,
  NotebookPen,
  Settings,
  UserCircle,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import styles from "@/app/visitor-home.module.css";
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

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const homeHref = isLoggedIn ? "/home" : "/";
  const navLinks = [
    { href: homeHref, label: "Home" },
    { href: "/library", label: "The Library" },
    { href: "/#approach", label: "Our Approach" },
    { href: "/library?tab=Topics+Index", label: "Explore Topics" },
  ];

  function isActive(href: string) {
    if (href === "/" || href === "/home") return pathname === href;
    if (href.startsWith("/#")) return false;
    return pathname.startsWith(href.split("?")[0]);
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
      <div className={styles.topline} />
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.nav}`}>
          <Link href={homeHref} className={styles.brand} aria-label="Business Nuggets home">
            <div className={styles.brandmark}>B</div>
            <div className={styles.brandtext}>
              <strong>BUSINESS NUGGETS</strong>
              <em>from the Bible</em>
            </div>
          </Link>

          <nav
            className={`${styles.navlinks} ${mobileOpen ? styles.navlinksOpen : ""}`}
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={isActive(link.href) ? styles.active : undefined}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {isLoggedIn && (
              <Link href="/workspace" onClick={() => setMobileOpen(false)}>
                Workspace
              </Link>
            )}
          </nav>

          <div className={styles.navright}>
            {!isLoggedIn ? (
              <>
                <Link href="/login" className={`${styles.login} ${styles.muted}`}>
                  Login
                </Link>
                <Link href="/register" className={`${styles.btn} ${styles.signup}`}>
                  Sign Up →
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/notifications"
                  aria-label={
                    unreadNotifications > 0
                      ? `Notifications, ${unreadNotifications} unread`
                      : "Notifications"
                  }
                  className="relative hidden h-10 w-10 items-center justify-center border border-[#61563c] text-[#ead2a0] transition hover:bg-[#28251e] sm:flex"
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
                    aria-label="Open account menu"
                    aria-expanded={profileOpen}
                    className="flex h-[46px] items-center gap-2 border border-[#61563c] bg-transparent px-3 text-[#f2e5cd] transition hover:bg-[#28251e]"
                  >
                    {user?.avatar || user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar || user.image || ""}
                        alt=""
                        className="h-7 w-7 rounded-full border border-[#cda762]/50 object-cover"
                      />
                    ) : (
                      <UserCircle size={26} strokeWidth={1.4} className="text-[#ead2a0]" />
                    )}
                    <ChevronDown
                      size={13}
                      className={`hidden transition-transform sm:block ${profileOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-[54px] z-50 w-[240px] border border-[rgba(234,210,160,.19)] bg-[#191b18] shadow-2xl">
                      <div className="border-b border-[rgba(234,210,160,.19)] px-4 py-4">
                        <p className="truncate text-[13px] font-semibold text-[#f9f5ed]">{displayName}</p>
                        {displayEmail && (
                          <p className="mt-1 truncate text-[11px] text-[#b4b2ab]">{displayEmail}</p>
                        )}
                      </div>

                      <div className="p-2">
                        <ProfileLink href="/workspace" icon={<UserCircle size={15} />}>
                          My Workspace
                        </ProfileLink>
                        <ProfileLink href="/library/saved-nuggets" icon={<Bookmark size={15} />}>
                          Saved Nuggets
                        </ProfileLink>
                        <ProfileLink href="/library/playlist" icon={<ListMusic size={15} />}>
                          Playlists
                        </ProfileLink>
                        <ProfileLink href="/library/personal-notes" icon={<NotebookPen size={15} />}>
                          Notes
                        </ProfileLink>
                        <ProfileLink href="/library/account" icon={<Settings size={15} />}>
                          Account Settings
                        </ProfileLink>
                      </div>

                      <div className="border-t border-[rgba(234,210,160,.19)] p-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[12px] text-[#d78484] transition hover:bg-[#28251e]"
                        >
                          <LogOut size={15} />
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
              className={styles.menu}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
            >
              ☰
            </button>
          </div>
        </div>
      </header>
    </>
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
      className="flex items-center gap-3 px-3 py-2.5 text-[12px] text-[#b8b5aa] transition hover:bg-[#28251e] hover:text-[#ead2a0]"
    >
      <span className="text-[#cda762]">{icon}</span>
      {children}
    </Link>
  );
}
