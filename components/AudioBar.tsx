"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Repeat2, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { useGlobalAudioPlayer } from "@/components/GlobalAudioPlayerProvider";
import { displayTopicName } from "@/lib/topic-display";
import { getPublishedNuggets } from "@/lib/nuggets-api";
import type { Nugget } from "@/types/nugget";

export default function AudioBar({
  title,
  subtitle,
  audioSrc,
  slug,
  coverImage = "/media-placeholder.svg",
  trackKind,
  compact = false,
}: {
  title: string;
  subtitle: string;
  audioSrc: string | null;
  slug: string;
  coverImage?: string;
  trackKind?: "nugget" | "music";
  compact?: boolean;
}) {
  const player = useGlobalAudioPlayer();
  const kind = trackKind ?? "nugget";
  const label = kind === "nugget" ? "Nugget Audio" : "Music Audio";
  const isCurrent = Boolean(audioSrc && player.track?.src === audioSrc);
  const playing = isCurrent && player.playing;
  const currentTime = isCurrent ? player.currentTime : 0;
  const duration = isCurrent ? player.duration : 0;
  const muted = isCurrent && player.muted;
  const repeat = isCurrent && player.repeat;
  const audioError = isCurrent ? player.error : "";
  const router = useRouter();
  const [tracks, setTracks] = useState<Nugget[]>([]);
  const [shuffle, setShuffle] = useState(false);

  useEffect(() => {
    if (!audioSrc) return;
    player.registerLocalControl(audioSrc, true);
    return () => player.registerLocalControl(audioSrc, false);
  }, [audioSrc, player.registerLocalControl]);

  useEffect(() => {
    let active = true;
    void getPublishedNuggets().then(data => {
      if (active) setTracks(data.filter(item => !item.locked && (
        kind === "nugget" ? item.nuggetAudioUrl : item.audioUrl
      )));
    }).catch(() => {});
    return () => { active = false; };
  }, [kind]);

  function togglePlay() {
    if (!audioSrc) return;
    if (isCurrent) {
      void player.togglePlay();
      return;
    }
    void player.playTrack({
      src: audioSrc,
      title,
      subtitle,
      slug,
      coverImage,
      kind,
      href: `/nugget/${slug}/${kind === "music" ? "musical" : "audio"}`,
    });
  }

  function move(direction: number) {
    if (tracks.length < 2) return;
    const index = tracks.findIndex(item => item.slug === slug);
    const candidates = tracks.filter(item => item.slug !== slug);
    const next = shuffle
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : tracks[(Math.max(index, 0) + direction + tracks.length) % tracks.length];
    if (!next) return;
    const nextSrc = kind === "nugget" ? next.nuggetAudioUrl : next.audioUrl;
    if (nextSrc) {
      void player.playTrack({
        src: nextSrc,
        title: next.title,
        subtitle: `${next.scriptureRef} · ${displayTopicName(next.topic)}`,
        slug: next.slug,
        coverImage: next.image,
        kind,
        href: `/nugget/${next.slug}/${kind === "music" ? "musical" : "audio"}`,
      });
    }
    router.push(`/nugget/${next.slug}`);
  }


  if (compact) {
    return (
      <div className="min-w-0 rounded-lg border border-white/10 bg-[#111111] px-2 py-2 text-[#FAF9F6] sm:px-3">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <div className="relative hidden h-9 w-9 shrink-0 overflow-hidden rounded-md sm:block">
            <Image src={coverImage} alt="" fill sizes="36px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-semibold text-[#E28906] sm:text-[12px]">{label}</p>
            <p className="truncate font-serif text-[11px] text-[#FAF9F6] sm:text-[13px]">{title}</p>
          </div>
          <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
            <button type="button" aria-label="Shuffle" aria-pressed={shuffle} onClick={() => setShuffle(value => !value)} disabled={tracks.length < 2} className="p-1 text-white/55 hover:text-white">
              <Shuffle size={14} className={shuffle ? "text-[#E28906]" : undefined} />
            </button>
            <button type="button" aria-label="Previous track" onClick={() => move(-1)} disabled={tracks.length < 2} className="p-1 text-white/55 hover:text-white">
              <SkipBack size={14} />
            </button>
          </div>
          <button type="button" aria-label={`${playing ? "Pause" : "Play"} ${label}`} onClick={togglePlay} disabled={!audioSrc} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E28906] text-[#080808] disabled:opacity-40 sm:h-9 sm:w-9">
            {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          </button>
          <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
            <button type="button" aria-label="Next track" onClick={() => move(1)} disabled={tracks.length < 2} className="p-1 text-white/55 hover:text-white">
              <SkipForward size={14} />
            </button>
            <button type="button" aria-label="Repeat" aria-pressed={repeat} onClick={() => isCurrent && player.toggleRepeat()} disabled={!audioSrc || !isCurrent} className="p-1 text-white/55 hover:text-white">
              <Repeat2 size={14} className={repeat ? "text-[#E28906]" : undefined} />
            </button>
            <button type="button" onClick={() => isCurrent && player.toggleMute()} disabled={!audioSrc || !isCurrent} aria-label={muted ? "Unmute" : "Mute"} className="p-1 text-white/55 hover:text-white">
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
          <Link href={`/nugget/${slug}/${kind === "music" ? "musical" : "audio"}`} aria-label={`Open full ${label} player`} className="flex h-8 w-5 shrink-0 items-center justify-center text-white/65 hover:text-white sm:w-8">
            <Maximize2 size={13} />
          </Link>
        </div>
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span className="shrink-0 text-[9px] tabular-nums text-[#b4b2ab]">{formatTime(currentTime)}</span>
          <input aria-label={`${label} progress`} type="range" min={0} max={duration || 1} value={Math.min(currentTime, duration || 1)} disabled={!duration || !isCurrent} onChange={event => player.seekTo(Number(event.target.value))} className="h-2 min-w-0 flex-1 cursor-pointer accent-[#E28906]" />
          <span className="shrink-0 text-[9px] tabular-nums text-[#b4b2ab]">{formatTime(duration)}</span>
        </div>
        {(audioError || !audioSrc) && <p role="status" className="mt-1 break-words text-[10px] text-[#E28906]">{audioError || `No ${label.toLowerCase()} has been attached yet.`}</p>}
      </div>
    );
  }

  return (
    <div className={`${trackKind ? "" : "fixed inset-x-0 bottom-0 z-50 "}border-t border-white/10 bg-[#111111]`}>
      <div className="mx-auto flex min-h-[84px] max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3 sm:w-[270px]">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md">
            <Image src={coverImage} alt="" fill sizes="44px" className="object-cover" />
          </div>
          <div className="min-w-0">
            {trackKind && <p className="text-[12px] font-semibold text-[#E28906]">{label}</p>}
            <p className="truncate font-serif text-[13px] text-[#FAF9F6]">{title}</p>
            <p className="mt-1 truncate text-[11px] text-white/35">{subtitle}</p>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 flex-col items-center md:flex">
          <div className="flex items-center gap-4">
            <button type="button" aria-label="Shuffle" aria-pressed={shuffle} onClick={() => setShuffle(value => !value)} disabled={tracks.length < 2} className="text-white/40 hover:text-white">
              <Shuffle size={14} className={shuffle ? "text-[#E28906]" : undefined} />
            </button>
            <button type="button" aria-label="Previous track" onClick={() => move(-1)} disabled={tracks.length < 2} className="text-white/55 hover:text-white">
              <SkipBack size={15} />
            </button>
            <button type="button" aria-label={`${playing ? "Pause" : "Play"} ${label}`} onClick={togglePlay} disabled={!audioSrc} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E28906] text-[#080808]">
              {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
            <button type="button" aria-label="Next track" onClick={() => move(1)} disabled={tracks.length < 2} className="text-white/55 hover:text-white">
              <SkipForward size={15} />
            </button>
            <button type="button" aria-label="Repeat" aria-pressed={repeat} onClick={() => isCurrent && player.toggleRepeat()} disabled={!audioSrc || !isCurrent} className="text-white/40 hover:text-white">
              <Repeat2 size={14} className={repeat ? "text-[#E28906]" : undefined} />
            </button>
          </div>

          <div className="mt-2 flex w-full max-w-[520px] items-center gap-3">
            <span className="text-[10px] text-white/30">{formatTime(currentTime)}</span>
            <div className="relative h-[3px] flex-1 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#E28906]" style={{ width: `${duration ? currentTime / duration * 100 : 0}%` }} />
              <input aria-label="Audio progress" type="range" min={0} max={duration || 1} value={Math.min(currentTime, duration || 1)} disabled={!duration || !isCurrent} onChange={event => player.seekTo(Number(event.target.value))} className="absolute inset-x-0 -top-2 h-5 w-full cursor-pointer opacity-0" />
            </div>
            <span className="text-[10px] text-white/30">{formatTime(duration)}</span>
          </div>
        </div>

        <button type="button" aria-label={`${playing ? "Pause" : "Play"} ${label}`} onClick={togglePlay} disabled={!audioSrc} className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E28906] text-[#080808] md:hidden">
          {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
        </button>

        <div className="hidden items-center justify-end gap-4 sm:w-[180px] md:flex">
          <button type="button" onClick={() => isCurrent && player.toggleMute()} disabled={!audioSrc || !isCurrent} aria-label={muted ? "Unmute" : "Mute"} className="text-white/55 hover:text-white">
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <Link href={`/nugget/${slug}/${kind === "music" ? "musical" : "audio"}`} aria-label="Full screen" className="text-white/55 hover:text-white">
            <Maximize2 size={15} />
          </Link>
        </div>
      </div>
      {(audioError || !audioSrc) && <p role="status" className="mx-auto max-w-[1440px] px-4 pb-2 text-[12px] text-[#E28906] sm:px-6 lg:px-10">{audioError || `No ${label.toLowerCase()} has been attached yet.`}</p>}
    </div>
  );
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "00:00";
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
}
