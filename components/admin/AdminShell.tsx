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

import {
  clearAdminSession,
} from "@/lib/admin-auth";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Nuggets", href: "/admin/nuggets", icon: FileText },
  { label: "Topics & Categories", href: "/admin/topics", icon: Tags },
  { label: "Scripture Index", href: "/admin/scripture", icon: BookOpen },
  { label: "Daily Schedule", href: "/admin/schedule", icon: CalendarDays },
  { label: "Media Library", href: "/admin/media", icon: FolderOpen },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: Library },
  { label: "Moderation", href: "/admin/moderation", icon: ShieldCheck },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Mobile App", href: "/admin/mobile", icon: Smartphone },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Roles & Access", href: "/admin/roles", icon: UserCog },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  { label: "Legal Pages", href: "/admin/legal", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function verifyAdmin() {
      try {
        const response = await fetch(
          "/api/admin/auth/session",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Invalid admin session");
        }

        const storedUser =
          localStorage.getItem("adminUser") ||
          sessionStorage.getItem("adminUser");

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch {
        clearAdminSession();
        router.replace("/admin/login");
      } finally {
        setChecking(false);
      }
    }

    void verifyAdmin();
  }, [router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function signOut() {
    try {
      await fetch(
        "/api/admin/auth/logout",
        {
          method: "POST",
        },
      );
    } finally {
      clearAdminSession();
      router.replace("/admin/login");
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-[14px] text-white/45">
        Verifying Admin Console...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/75 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,280px)] flex-col border-r border-white/[0.07] bg-[#111111] transition-transform duration-200 lg:w-[230px] lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-[72px] items-center justify-between border-b border-white/[0.06] px-4 sm:px-5">
          <Link
            href="/admin/dashboard"
            className="flex min-h-11 items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#C8A35A] font-serif text-[18px] font-bold text-[#080808]">
              B
            </div>

            <div>
              <p className="text-[14px] font-semibold uppercase leading-tight tracking-[0.04em] text-[#FAF9F6]">
                Business Nuggets
              </p>
              <p className="mt-1 text-[12px] leading-none text-[#C8A35A]">
                Admin Console
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/[0.04] hover:text-[#E0C48A] lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`mb-1.5 flex min-h-11 items-center gap-3 rounded-lg px-3 text-[14px] transition ${
                  active
                    ? "bg-[#C8A35A]/15 text-[#E0C48A]"
                    : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={1.7} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.07] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8A35A]/15 text-[13px] font-semibold text-[#C8A35A]">
              {user?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] text-white/75">
                {user?.name || "Admin User"}
              </p>
              <p className="mt-0.5 text-[12px] text-white/35">Admin</p>
            </div>

            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/[0.04] hover:text-[#B54A4A]"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[230px]">
        <header className="sticky top-0 z-30 flex min-h-[68px] items-center gap-3 border-b border-white/[0.07] bg-[#111111]/95 px-4 backdrop-blur sm:px-6 md:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open admin navigation"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/65 transition hover:border-[#C8A35A]/35 hover:text-[#E0C48A] lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="relative hidden w-full max-w-[420px] sm:block">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              placeholder="Search nuggets, users, topics..."
              className="h-11 w-full rounded-lg border border-white/10 bg-[#080808] pl-10 pr-4 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-[#C8A35A]/45"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-lg px-2 text-[14px] text-white/45 transition hover:text-[#E0C48A] sm:px-3"
            >
              View Site
            </Link>

            <div className="hidden h-7 w-px bg-white/[0.07] sm:block" />

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C8A35A]/15 text-[13px] font-semibold text-[#C8A35A]">
              {user?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
