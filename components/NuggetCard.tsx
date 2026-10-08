import Link from "next/link";
import type { Nugget } from "@/lib/nuggets";
import ContentImage from "@/components/ContentImage";

export default function NuggetCard({
  nugget,
}: {
  nugget: Nugget;
}) {
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-gray-800 bg-neutral-950 text-white transition hover:border-amber-300/50">
      <Link
        href={`/nugget/${nugget.slug}`}
        aria-label={`Open ${nugget.title}`}
        className="relative block h-44 shrink-0 bg-gray-900"
      >
        <ContentImage src={nugget.image} alt={nugget.title} />

        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <span className="min-w-0 break-words rounded bg-amber-300 px-2 py-1 text-xs font-semibold text-black">
            {nugget.tag}
          </span>

          {nugget.isGold && (
            <span className="shrink-0 rounded border border-amber-300 bg-black/80 px-2 py-1 text-xs text-amber-300">
              GOLD
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="break-words font-serif text-lg leading-snug">
          <Link
            href={`/nugget/${nugget.slug}`}
            className="hover:text-amber-300"
          >
            {nugget.title}
          </Link>
        </h3>

        <p className="mt-2 text-xs text-gray-400">
          {nugget.scriptureRef}
        </p>

        <Link
          href={`/nugget/${nugget.slug}/reader`}
          className="mt-auto inline-block pt-4 text-sm font-medium text-amber-300 hover:underline"
        >
          Read wisdom →
        </Link>
      </div>
    </article>
  );
}