"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Pause, Play, Repeat2, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useAudioPlayback, audioTime } from "@/lib/use-audio-playback";
import { getPublishedNuggets } from "@/lib/nuggets-api";
import type { Nugget } from "@/types/nugget";

export default function ReaderAudioBar({ title, subtitle, slug, coverImage, audioSrc }: {
  title: string; subtitle: string; slug: string; coverImage: string; audioSrc: string | null;
}) {
  const { audioRef, audioProps, playing, currentTime, duration, muted, repeat, audioError, togglePlay, seekTo, toggleRepeat, toggleMute } = useAudioPlayback(audioSrc);
  const router = useRouter();
  const [tracks, setTracks] = useState<Nugget[]>([]);
  const [shuffle, setShuffle] = useState(false);
  useEffect(() => {
    let active = true;
    void getPublishedNuggets().then(data => {
      if (active) setTracks(data.filter(item => item.nuggetAudioUrl && !item.locked));
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  function move(direction: number) {
    const candidates = tracks.filter(item => item.slug !== slug);
    if (!candidates.length) return;
    const index = tracks.findIndex(item => item.slug === slug);
    const next = shuffle ? candidates[Math.floor(Math.random() * candidates.length)] : tracks[(index + direction + tracks.length) % tracks.length];
    if (next) router.push(`/nugget/${next.slug}/reader`);
  }
  return (
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#DDD2C0] bg-[#F5F0E8]">
        <audio ref={audioRef} {...audioProps} />
        <div className="mx-auto flex min-h-[82px] max-w-[1180px] items-center gap-5 px-5 sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-3 sm:w-[270px]">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded">
              <Image
                src={coverImage}
                alt=""
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate font-serif text-[13px] font-semibold text-[#15120E]">
                {title}
              </p>

              <p className="mt-1 truncate text-[11px] text-[#756E64]">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 flex-col items-center md:flex">
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Shuffle"
                aria-pressed={shuffle}
                disabled={tracks.length < 2}
                onClick={() => setShuffle(value => !value)}
                className="text-[#756E64] transition hover:text-[#15120E]"
              >
                <Shuffle size={14} className={shuffle ? "text-[#9A7839]" : undefined} />
              </button>

              <button
                type="button"
                aria-label="Previous track"
                disabled={tracks.length < 2}
                onClick={() => move(-1)}
                className="text-[#756E64] transition hover:text-[#15120E]"
              >
                <SkipBack size={15} />
              </button>

              <button
                type="button"
                aria-label={playing ? "Pause" : "Play"}
                disabled={!audioSrc}
                onClick={togglePlay}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8A35A] text-[#15120E]"
              >
                {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              </button>

              <button
                type="button"
                aria-label="Next track"
                disabled={tracks.length < 2}
                onClick={() => move(1)}
                className="text-[#756E64] transition hover:text-[#15120E]"
              >
                <SkipForward size={15} />
              </button>

              <button
                type="button"
                aria-label="Repeat"
                aria-pressed={repeat}
                disabled={!audioSrc}
                onClick={toggleRepeat}
                className="text-[#756E64] transition hover:text-[#15120E]"
              >
                <Repeat2 size={14} className={repeat ? "text-[#9A7839]" : undefined} />
              </button>
            </div>

            <div className="mt-2 flex w-full max-w-[520px] items-center gap-3">
              <span className="text-[10px] text-[#8A8175]">
                {audioTime(currentTime)}
              </span>

              <div className="relative h-[3px] flex-1 rounded-full bg-[#D8CDBB]">
                <div className="h-full rounded-full bg-[#C8A35A]" style={{ width: `${duration ? currentTime / duration * 100 : 0}%` }} />
                <input aria-label="Audio progress" type="range" min={0} max={duration || 1} value={currentTime} disabled={!duration} onChange={event => seekTo(Number(event.target.value))} className="absolute inset-x-0 -top-2 h-5 w-full cursor-pointer opacity-0" />
              </div>

              <span className="text-[10px] text-[#8A8175]">
                {audioTime(duration)}
              </span>
            </div>
          </div>

          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
                disabled={!audioSrc}
                onClick={togglePlay}
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8A35A] text-[#15120E] md:hidden"
          >
            {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          </button>

          <div className="hidden items-center justify-end gap-4 sm:w-[150px] md:flex">
            <button type="button" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute} disabled={!audioSrc} className="text-[#756E64] transition hover:text-[#15120E]">
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <Link
              href={`/nugget/${slug}/audio`}
              aria-label="Full screen"
              className="text-[#756E64] transition hover:text-[#15120E]"
            >
              <Maximize2 size={15} />
            </Link>
          </div>
        </div>
        {(audioError || !audioSrc) && <p role="status" className="mx-auto max-w-[1180px] px-5 pb-2 text-[12px] text-[#9A7839] sm:px-8 lg:px-10">{audioError || "No commentary audio has been attached to this Nugget yet."}</p>}
      </div>
  );
}
