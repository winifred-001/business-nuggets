import Link from "next/link";
import type { Nugget } from "@/lib/nuggets";
import ContentImage from "@/components/ContentImage";

export default function NuggetCard({
  nugget,
}: {
  nugget: Nugget;
}) {
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111111] text-[#FAF9F6] transition hover:border-[#C8A35A]/50">
      <Link
        href={`/nugget/${nugget.slug}`}
        aria-label={`Open ${nugget.title}`}
        className="relative block h-44 shrink-0 bg-[#080808] sm:h-48"
      >
        <ContentImage src={nugget.image} alt={nugget.title} />

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="min-w-0 break-words rounded-md bg-[#C8A35A] px-2.5 py-1.5 text-[12px] font-semibold leading-4 text-[#080808]">
            {nugget.tag}
          </span>

          {nugget.isGold && (
            <span className="shrink-0 rounded-md border border-[#C8A35A]/60 bg-[#080808]/90 px-2.5 py-1.5 text-[12px] font-semibold leading-4 text-[#E0C48A] backdrop-blur-sm">
              GOLD
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="break-words font-serif text-[22px] leading-7 text-[#FAF9F6]">
          <Link
            href={`/nugget/${nugget.slug}`}
            className="transition hover:text-[#E0C48A]"
          >
            {nugget.title}
          </Link>
        </h3>

        <p className="mt-2 text-[14px] leading-5 text-[#8A8781]">
          {nugget.scriptureRef}
        </p>

        <Link
          href={`/nugget/${nugget.slug}/reader`}
          className="mt-auto inline-flex min-h-11 items-center pt-4 text-[14px] font-semibold text-[#C8A35A] transition hover:text-[#E0C48A]"
        >
          Read wisdom →
        </Link>
      </div>
    </article>
  );
}
