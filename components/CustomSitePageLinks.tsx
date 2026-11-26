"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { PublicSitePage } from "@/lib/site-pages";

export default function CustomSitePageLinks({ variant }: { variant: "header" | "footer" }) {
  const [pages, setPages] = useState<PublicSitePage[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/site-pages", { signal: controller.signal, cache: "no-store" })
      .then(async response => response.ok ? response.json() : [])
      .then(data => {
        if (!controller.signal.aborted && Array.isArray(data)) {
          setPages(data.filter((page: PublicSitePage) =>
            page.published && page.showInNavigation && /^\/pages\/[a-z0-9-]+$/.test(page.href)));
        }
      }).catch(() => { /* Existing site navigation remains usable if the CMS API is unavailable. */ });
    return () => controller.abort();
  }, []);

  if (!pages.length) return null;
  if (variant === "footer") {
    return <>{pages.map(page => <Link key={page.slug} href={page.href} className="transition hover:text-[#E28906]">{page.navLabel || page.title}</Link>)}</>;
  }

  return (
    <details className="group relative">
      <summary className="cursor-pointer list-none whitespace-nowrap py-3 font-bold hover:text-[#E28906] lg:py-0">
        More pages
      </summary>
      <div className="z-50 mt-2 flex flex-col gap-2 rounded-lg border border-[#E28906]/25 bg-[#151611] p-3 shadow-xl lg:absolute lg:right-0 lg:min-w-[210px]">
        {pages.map(page => (
          <Link key={page.slug} href={page.href} aria-current={pathname === page.href ? "page" : undefined}
            className="rounded px-3 py-2 text-[13px] hover:bg-white/10 hover:text-[#E28906]">
            {page.navLabel || page.title}
          </Link>
        ))}
      </div>
    </details>
  );
}
