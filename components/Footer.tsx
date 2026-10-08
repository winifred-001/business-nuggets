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
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-serif font-semibold text-white">
            BUSINESS NUGGETS
          </p>

          <p className="mt-3 text-sm italic">
            Timeless Biblical Wisdom for Today&apos;s Marketplace.
          </p>
        </div>

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

      <p className="border-t border-gray-800 px-4 py-4 text-center text-xs">
        © 2026 Business Nuggets from the Bible.
      </p>
    </footer>
  );
}