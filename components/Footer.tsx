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
    <footer className="border-t border-gray-800 bg-black text-gray-400">
      <div className="mx-auto flex justify-between max-w-7xl gap-28 px-4 py-10 sm:px-6 ">
        <div>
          <p className="font-serif font-semibold text-white">
            BUSINESS NUGGETS
          </p>

          <p className="mt-3 text-sm italic">
            Timeless Biblical Wisdom for Today&apos;s Marketplace.
          </p>
        </div>
       <div className="grid grid-cols-2 gap-8 sm:gap-6 md:grid-cols-4">
        {[
          { title: "Explore", links: exploreLinks },
          { title: "Your workspace", links: workspaceLinks },
        ].map((group) => (
          <nav
            key={group.title}
            aria-label={`Footer ${group.title}`}
          >
            <h2 className="mb-3 font-semibold text-white">
              {group.title}
            </h2>

            <ul className="space-y-3 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-amber-300"
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

      <div className="border-t border-gray-800">
  <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <p>
      © 2026 Business Nuggets from the Bible. All rights reserved.
    </p>

    <div className="flex items-center gap-5">
      <Link
        href="/terms-of-use"
        className="transition hover:text-amber-300"
      >
        Terms of Use
      </Link>

      <Link
        href="/privacy-policy"
        className="transition hover:text-amber-300"
      >
        Privacy Policy
      </Link>
    </div>
  </div>
</div>
    </footer>
  );
}