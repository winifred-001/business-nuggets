import Link from "next/link";

const exploreLinks = [
  { href: "/library", label: "Library" },
  { href: "/search", label: "Search" },
  { href: "/library?tab=Topics+Index", label: "Topics" },
  { href: "/library?tab=Challenges", label: "Challenges" },
  { href: "/library?tab=Scripture+Matrix", label: "Scripture Matrix" },
  { href: "/library?tab=Collections", label: "Collections" },
];

const workspaceLinks = [
  { href: "/library/saved-nuggets", label: "Saved Nuggets" },
  { href: "/library/playlist", label: "Playlists" },
  { href: "/library/personal-notes", label: "Notes" },
  { href: "/library/account", label: "Account settings" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#111111] text-[#8A8781]">
      <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-5 py-8 sm:px-6 md:grid-cols-[1.2fr_auto] md:gap-10 md:py-9 lg:px-8">
        <div className="max-w-md">
          <Link
            href="/home"
            className="flex shrink-0 items-center gap-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C8A35A] text-[14px] font-bold text-[#080808]">
              B
            </span>

            <div className="hidden sm:block">
              <p className="text-[17px] font-bold uppercase leading-none tracking-[0.04em] text-white">
                Business Nuggets
              </p>

              <p className="mt-1 font-serif text-[14px] italic leading-none text-[#C8A35A]">
                from the Bible
              </p>
            </div>
          </Link>

          <p className="mt-3 font-serif text-[18px] italics leading-6 text-white/50 sm:text-[14px]">
            Timeless Biblical Wisdom for Today&apos;s Marketplace.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 md:justify-self-end">
          {[
            { title: "Explore", links: exploreLinks },
            { title: "Your workspace", links: workspaceLinks },
          ].map((group) => (
            <nav
              key={group.title}
              aria-label={`Footer ${group.title}`}
              className="min-w-0"
            >
              <h2 className="mb-3 font-sans text-[16px] font-semibold text-[#FAF9F6]">
                {group.title}
              </h2>

              <ul className="space-y-0 text-[14px] leading-6">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center transition hover:text-[#E0C48A] md:min-h-0 md:py-1.5"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.07]">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-3 px-5 py-4 text-[12px] leading-5 text-white/35 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            © 2026 Business Nuggets from the Bible. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href="/terms-of-use"
              className="inline-flex min-h-11 items-center transition hover:text-[#E0C48A] md:min-h-0 md:py-1.5"
            >
              Terms of Use
            </Link>

            <Link
              href="/privacy-policy"
              className="inline-flex min-h-11 items-center transition hover:text-[#E0C48A] md:min-h-0 md:py-1.5"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
