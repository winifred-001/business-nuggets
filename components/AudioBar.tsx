"use client";

import { useState } from "react";
import {
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";

export default function AudioBar({
  title,
  subtitle,
  duration,
}: {
  title: string;
  subtitle: string;
  duration: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex min-h-[76px] items-center gap-3 border-t border-white/10 bg-[#111111] px-4 py-3 text-[#FAF9F6] sm:gap-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-[#FAF9F6]">
          {title}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-[#8A8781]">
          {subtitle}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 text-white/45 sm:gap-2">
        <button
          type="button"
          aria-label="Shuffle"
          className="hidden h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/[0.04] hover:text-[#E0C48A] sm:flex"
        >
          <Shuffle size={17} />
        </button>

        <button
          type="button"
          aria-label="Previous"
          className="hidden h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/[0.04] hover:text-[#E0C48A] sm:flex"
        >
          <SkipBack size={18} />
        </button>

        <button
          type="button"
          onClick={() => setPlaying((current) => !current)}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C8A35A] text-[#080808] transition hover:bg-[#E0C48A]"
        >
          {playing ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" />
          )}
        </button>

        <button
          type="button"
          aria-label="Next"
          className="hidden h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/[0.04] hover:text-[#E0C48A] sm:flex"
        >
          <SkipForward size={18} />
        </button>

        <button
          type="button"
          aria-label="Repeat"
          className="hidden h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/[0.04] hover:text-[#E0C48A] md:flex"
        >
          <Repeat size={17} />
        </button>
      </div>

      <span className="hidden shrink-0 text-[12px] text-[#8A8781] md:block">
        {duration}
      </span>
    </div>
  );
}
