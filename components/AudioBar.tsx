"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Repeat2, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { useAudioPlayback, audioTime } from "@/lib/use-audio-playback";
import { getPublishedNuggets } from "@/lib/nuggets-api";
import type { Nugget } from "@/types/nugget";
export default function AudioBar({ title, subtitle, audioSrc, slug, coverImage = "/images/musical.png" }: { title: string; subtitle: string; audioSrc: string | null; slug: string; coverImage?: string }) {
  const { audioRef, audioProps, playing, currentTime, duration, muted, repeat, audioError, togglePlay, seekTo, toggleRepeat, toggleMute } = useAudioPlayback(audioSrc);
  const router = useRouter();
  const [tracks, setTracks] = useState<Nugget[]>([]);
  const [shuffle, setShuffle] = useState(false);
  useEffect(() => {
    let active = true;
    void getPublishedNuggets().then(data => { if (active) setTracks(data.filter(item => (item.nuggetAudioUrl || item.audioUrl) && !item.locked)); }).catch(() => {});
    return () => { active = false; };
  }, []);
  function move(direction: number) {
    if (tracks.length < 2) return;
    const index = tracks.findIndex(item => item.slug === slug);
    const candidates = tracks.filter(item => item.slug !== slug);
    const next = shuffle ? candidates[Math.floor(Math.random() * candidates.length)] : tracks[(Math.max(index, 0) + direction + tracks.length) % tracks.length];
    if (next) router.push(`/nugget/${next.slug}`);
  }
  return (
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#111111]">
        <audio ref={audioRef} {...audioProps} />
        <div className="mx-auto flex min-h-[84px] max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-10">
          {/* TRACK INFO */}
          <div className="flex min-w-0 items-center gap-3 sm:w-[270px]">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md">
              <Image
                src={coverImage}
                alt=""
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate font-serif text-[13px] text-[#FAF9F6]">
                {title}
              </p>

              <p className="mt-1 truncate text-[11px] text-white/35">
                {subtitle}
              </p>
            </div>
          </div>

          {/* CENTER PLAYER */}
          <div className="hidden min-w-0 flex-1 flex-col items-center md:flex">
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Shuffle"
                aria-pressed={shuffle}
                onClick={() => setShuffle(value => !value)}
                disabled={tracks.length < 2}
                className="text-white/40 hover:text-white"
              >
                <Shuffle size={14} className={shuffle ? "text-[#C8A35A]" : undefined} />
              </button>

              <button
                type="button"
                aria-label="Previous track"
                onClick={() => move(-1)}
                disabled={tracks.length < 2}
                className="text-white/55 hover:text-white"
              >
                <SkipBack size={15} />
              </button>

              <button
                type="button"
                aria-label={playing ? "Pause" : "Play"}
                onClick={togglePlay}
                disabled={!audioSrc}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8A35A] text-[#080808]"
              >
                {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              </button>

              <button
                type="button"
                aria-label="Next track"
                onClick={() => move(1)}
                disabled={tracks.length < 2}
                className="text-white/55 hover:text-white"
              >
                <SkipForward size={15} />
              </button>

              <button
                type="button"
                aria-label="Repeat"
                aria-pressed={repeat}
                onClick={toggleRepeat}
                disabled={!audioSrc}
                className="text-white/40 hover:text-white"
              >
                <Repeat2 size={14} className={repeat ? "text-[#C8A35A]" : undefined} />
              </button>
            </div>

            <div className="mt-2 flex w-full max-w-[520px] items-center gap-3">
              <span className="text-[10px] text-white/30">
                {audioTime(currentTime)}
              </span>

              <div className="relative h-[3px] flex-1 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#C8A35A]" style={{ width: `${duration ? currentTime / duration * 100 : 0}%` }} />
                <input aria-label="Audio progress" type="range" min={0} max={duration || 1} value={currentTime} disabled={!duration} onChange={event => seekTo(Number(event.target.value))} className="absolute inset-x-0 -top-2 h-5 w-full cursor-pointer opacity-0" />
              </div>

              <span className="text-[10px] text-white/30">
                {audioTime(duration)}
              </span>
            </div>
          </div>

          {/* MOBILE PLAY */}
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
                onClick={togglePlay}
                disabled={!audioSrc}
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8A35A] text-[#080808] md:hidden"
          >
            {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          </button>

          {/* RIGHT CONTROLS */}
          <div className="hidden items-center justify-end gap-4 sm:w-[180px] md:flex">
            <button type="button" onClick={toggleMute} disabled={!audioSrc} aria-label={muted ? "Unmute" : "Mute"} className="text-white/55 hover:text-white">{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button>

            <Link
              href={`/nugget/${slug}/audio`}
              aria-label="Full screen"
              className="text-white/55 hover:text-white"
            >
              <Maximize2 size={15} />
            </Link>
          </div>
        </div>
        {(audioError || !audioSrc) && <p role="status" className="mx-auto max-w-[1440px] px-4 pb-2 text-[12px] text-[#C8A35A] sm:px-6 lg:px-10">{audioError || "No audio has been attached to this Nugget yet."}</p>}
      </div>
  );
}
