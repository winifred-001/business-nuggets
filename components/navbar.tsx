"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, UserCircle } from "lucide-react";

const publicPages = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/onboarding",
];

const links = [
  { href: "/", label: "Home" },
  { href: "/library", label: "Library" },
  { href: "/search", label: "Search" },
];

const libraryViews = [
  { href: "/library?tab=Topics+Index", label: "Topics" },
  { href: "/library?tab=Challenges", label: "Challenges" },
  { href: "/library?tab=Scripture+Matrix", label: "Scripture Matrix" },
  { href: "/library?tab=Collections", label: "Collections" },
];

const workspace = [
  { href: "/home", label: "My workspace" },
  { href: "/library/saved-nuggets", label: "Saved nuggets" },
  { href: "/library/playlist", label: "Playlists" },
  { href: "/library/personal-notes", label: "Notes" },
  { href: "/library/history", label: "History" },
  { href: "/library/following", label: "Following" },
  { href: "/library/account", label: "Account settings" },
];

export default function Navbar({
  showAuthLinks,
}: {
  showAuthLinks?: boolean;
}) {
  const pathname = usePathname();

  const displayAuthLinks =
    showAuthLinks ?? publicPages.includes(pathname);

  const [openFor, setOpenFor] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  const open = openFor === pathname;
  const close = () => setOpenFor(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenFor(null);
        menuButton.current?.focus();
      }
    };

    document.addEventListener("keydown", onKey);

    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="relative z-40 border-b border-gray-800 bg-black text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link
          href="/"
          onClick={close}
          className="flex min-w-0 items-center gap-2"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-amber-300 font-bold text-black">
            B
          </span>

          <span>
            <span className="block text-xs font-extrabold sm:text-sm">
              BUSINESS NUGGETS
            </span>

            <span className="block font-serif text-xs italic text-amber-300">
              from the Bible
            </span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden gap-6 text-sm md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              aria-current={pathname === link.href ? "page" : undefined}
              className="text-gray-300 hover:text-amber-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {displayAuthLinks && (
            <>
              <Link
                href="/login"
                onClick={close}
                className="hidden text-sm text-gray-300 sm:block"
              >
                Login
              </Link>

              <Link
                href="/register"
                onClick={close}
                className="hidden rounded bg-amber-300 px-3 py-2 text-sm font-medium text-black sm:block"
              >
                Sign Up
              </Link>
            </>
          )}

          {!displayAuthLinks && (
            <Link
              href="/library/account"
              onClick={close}
              aria-label="Account settings"
              className="block text-gray-200 hover:text-amber-300"
            >
              <UserCircle size={26} />
            </Link>
          )}

          <button
            ref={menuButton}
            type="button"
            aria-label={
              open ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={open}
            aria-controls="navigation-menu"
            onClick={() => setOpenFor(open ? null : pathname)}
            className="rounded border border-gray-700 p-2 md:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="navigation-menu"
          aria-label="Expanded navigation"
          className="mx-auto grid max-w-7xl gap-1 border-t border-gray-800 px-4 py-4 sm:grid-cols-2 sm:px-6 md:hidden"
        >
          {[
            ...links,
            ...libraryViews,
            ...workspace,
            ...(displayAuthLinks
              ? [
                  { href: "/login", label: "Login" },
                  { href: "/register", label: "Sign Up" },
                ]
              : []),
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="rounded px-3 py-3 text-sm text-gray-300 hover:bg-gray-900 hover:text-amber-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}