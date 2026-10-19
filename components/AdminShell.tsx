"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Tags,
  UserCog,
  Users,
  X,
} from "lucide-react";

import { API_URL } from "@/lib/api";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const navItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Nuggets",
    href: "/admin/nuggets",
    icon: FileText,
  },
  {
    label: "Topics & Categories",
    href: "/admin/topics",
    icon: Tags,
  },
  {
    label: "Scripture Index",
    href: "/admin/scripture",
    icon: BookOpen,
  },
  {
    label: "Daily Schedule",
    href: "/admin/schedule",
    icon: CalendarDays,
  },
  {
    label: "Media Library",
    href: "/admin/media",
    icon: FolderOpen,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: Library,
  },
  {
    label: "Moderation",
    href: "/admin/moderation",
    icon: ShieldCheck,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "Mobile App",
    href: "/admin/mobile",
    icon: Smartphone,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    label: "Roles & Access",
    href: "/admin/roles",
    icon: UserCog,
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: FileText,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [user, setUser] =
    useState<AdminUser | null>(
      null,
    );

  const [checking, setChecking] =
    useState(true);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  useEffect(() => {
    async function verifyAdmin() {
      const token =
        localStorage.getItem(
          "adminToken",
        ) ||
        sessionStorage.getItem(
          "adminToken",
        );

      if (!token) {
        router.replace(
          "/admin/login",
        );

        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/admin/test`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (!response.ok) {
          throw new Error(
            "Invalid admin session",
          );
        }

        const storedUser =
          localStorage.getItem(
            "adminUser",
          ) ||
          sessionStorage.getItem(
            "adminUser",
          );

        if (storedUser) {
          setUser(
            JSON.parse(
              storedUser,
            ),
          );
        }
      } catch {
        localStorage.removeItem(
          "adminToken",
        );

        localStorage.removeItem(
          "adminUser",
        );

        sessionStorage.removeItem(
          "adminToken",
        );

        sessionStorage.removeItem(
          "adminUser",
        );

        router.replace(
          "/admin/login",
        );
      } finally {
        setChecking(false);
      }
    }

    verifyAdmin();
  }, [router]);

  function signOut() {
    localStorage.removeItem(
      "adminToken",
    );

    localStorage.removeItem(
      "adminUser",
    );

    sessionStorage.removeItem(
      "adminToken",
    );

    sessionStorage.removeItem(
      "adminUser",
    );

    router.replace(
      "/admin/login",
    );
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] text-[11px] text-white/40">
        Verifying Admin Console...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      {/* MOBILE OVERLAY */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() =>
            setMobileOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[230px] flex-col border-r border-white/[0.07] bg-[#111111] transition-transform lg:translate-x-0 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-[66px] items-center justify-between border-b border-white/[0.06] px-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[#C8A35A] font-serif text-[12px] font-bold text-[#080808]">
              B
            </div>

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.04em]">
                Business Nuggets
              </p>

              <p className="mt-0.5 text-[7px] text-[#C8A35A]">
                Admin Console
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() =>
              setMobileOpen(false)
            }
            className="text-white/40 lg:hidden"
          >
            <X size={17} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navItems.map(
            (item) => {
              const active =
                pathname ===
                  item.href ||
                pathname.startsWith(
                  `${item.href}/`,
                );

              const Icon =
                item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMobileOpen(
                      false,
                    )
                  }
                  className={`mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-[10px] transition ${
                    active
                      ? "bg-[#C8A35A]/15 text-[#E0C48A]"
                      : "text-white/45 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <Icon
                    size={14}
                  />

                  {item.label}
                </Link>
              );
            },
          )}
        </nav>

        {/* ADMIN PROFILE */}

        <div className="border-t border-white/[0.07] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C8A35A]/20 text-[9px] font-semibold text-[#C8A35A]">
              {user?.name
                ?.slice(0, 2)
                .toUpperCase() ||
                "AD"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[9px] text-white/70">
                {user?.name ||
                  "Admin User"}
              </p>

              <p className="mt-0.5 text-[7px] text-white/30">
                Admin
              </p>
            </div>

            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="text-white/30 transition hover:text-red-400"
            >
              <LogOut
                size={14}
              />
            </button>
          </div>
        </div>
      </aside>

      {/* PAGE AREA */}

      <div className="lg:pl-[230px]">
        {/* HEADER */}

        <header className="sticky top-0 z-30 flex h-[66px] items-center gap-4 border-b border-white/[0.07] bg-[#111111]/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() =>
              setMobileOpen(true)
            }
            className="text-white/60 lg:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="relative hidden w-full max-w-[360px] sm:block">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
            />

            <input
              type="text"
              placeholder="Search nuggets, users, topics..."
              className="h-9 w-full rounded-md border border-white/10 bg-[#080808] pl-9 pr-4 text-[10px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/40"
            />
          </div>

          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/"
              className="text-[9px] text-white/35 transition hover:text-[#C8A35A]"
            >
              View Site
            </Link>

            <div className="h-6 w-px bg-white/[0.07]" />

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C8A35A]/20 text-[9px] font-semibold text-[#C8A35A]">
              AD
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}