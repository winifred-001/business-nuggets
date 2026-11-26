"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { GripHorizontal, Maximize2, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";

import { getPlayableAudioNuggets } from "@/lib/nuggets-api";
import { displayTopicName } from "@/lib/topic-display";
import type { Nugget } from "@/types/nugget";

export type GlobalAudioTrack = {
  src: string;
  title: string;
  subtitle: string;
  slug: string;
  coverImage?: string;
  kind: "nugget" | "music";
  href: string;
};

type GlobalAudioPlayerValue = {
  track: GlobalAudioTrack | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  muted: boolean;
  repeat: boolean;
  error: string;
  playTrack: (track: GlobalAudioTrack) => Promise<void>;
  togglePlay: () => Promise<void>;
  seekTo: (value: number) => void;
  seek: (amount: number) => void;
  changeSpeed: () => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  stop: () => void;
  registerLocalControl: (src: string | null, active: boolean) => void;
};

const GlobalAudioPlayerContext = createContext<GlobalAudioPlayerValue | null>(null);

export function useGlobalAudioPlayer() {
  const value = useContext(GlobalAudioPlayerContext);
  if (!value) throw new Error("useGlobalAudioPlayer must be used inside GlobalAudioPlayerProvider.");
  return value;
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "00:00";
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
}

type StickerPosition = { x: number; y: number };

function clampStickerPosition(position: StickerPosition, element: HTMLElement): StickerPosition {
  const margin = 8;
  return {
    x: Math.max(margin, Math.min(position.x, window.innerWidth - element.offsetWidth - margin)),
    y: Math.max(margin, Math.min(position.y, window.innerHeight - element.offsetHeight - margin)),
  };
}

export default function GlobalAudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const stickerRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const [stickerPosition, setStickerPosition] = useState<StickerPosition | null>(null);
  const [dragging, setDragging] = useState(false);
  const playbackVersion = useRef(0);
  const [miniQueue, setMiniQueue] = useState<Nugget[]>([]);
  const [switchingTrack, setSwitchingTrack] = useState(false);
  const [localControlCounts, setLocalControlCounts] = useState<Record<string, number>>({});
  const [track, setTrack] = useState<GlobalAudioTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [error, setError] = useState("");

  const playTrack = useCallback(async (next: GlobalAudioTrack) => {
    const audio = audioRef.current;
    if (!audio || !next.src) return;
    playbackVersion.current += 1;
    const resolvedSrc = new URL(next.src, window.location.href).href;
    const sameTrack = (audio.currentSrc || audio.src) === resolvedSrc;
    if (!sameTrack) {
      audio.pause();
      audio.src = next.src;
      audio.currentTime = 0;
      audio.load();
      setCurrentTime(0);
      setDuration(0);
    }
    setTrack(next);
    setError("");
    audio.loop = repeat;
    audio.playbackRate = speed;
    audio.muted = muted;
    try {
      await audio.play();
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setPlaying(false);
      setError("Audio could not start. Check your connection and try Play again.");
    }
  }, [muted, repeat, speed]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    setError("");
    try {
      await audio.play();
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setPlaying(false);
      setError("Audio could not start. Check your connection and try Play again.");
    }
  }, [track]);

  const seekTo = useCallback((value: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const next = Math.max(0, Math.min(audio.duration, value));
    audio.currentTime = next;
    setCurrentTime(next);
  }, []);

  const seek = useCallback((amount: number) => {
    seekTo((audioRef.current?.currentTime || 0) + amount);
  }, [seekTo]);

  const changeSpeed = useCallback(() => {
    const speeds = [1, 1.25, 1.5, 2];
    setSpeed(current => {
      const next = speeds[(speeds.indexOf(current) + 1) % speeds.length];
      if (audioRef.current) audioRef.current.playbackRate = next;
      return next;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(current => {
      const next = !current;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat(current => {
      const next = !current;
      if (audioRef.current) audioRef.current.loop = next;
      return next;
    });
  }, []);

  const registerLocalControl = useCallback((src: string | null, active: boolean) => {
    if (!src) return;
    setLocalControlCounts(current => {
      const count = current[src] ?? 0;
      if (active) return { ...current, [src]: count + 1 };
      if (count <= 1) {
        const next = { ...current };
        delete next[src];
        return next;
      }
      return { ...current, [src]: count - 1 };
    });
  }, []);

  const stop = useCallback(() => {
    playbackVersion.current += 1;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setTrack(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError("");
  }, []);

  const value = useMemo<GlobalAudioPlayerValue>(() => ({
    track, playing, currentTime, duration, speed, muted, repeat, error,
    playTrack, togglePlay, seekTo, seek, changeSpeed, toggleMute, toggleRepeat, stop, registerLocalControl,
  }), [track, playing, currentTime, duration, speed, muted, repeat, error, playTrack, togglePlay, seekTo, seek, changeSpeed, toggleMute, toggleRepeat, stop, registerLocalControl]);

  const showMiniPlayer = Boolean(track && !localControlCounts[track.src]);
  useEffect(() => {
    if (!showMiniPlayer) {
      dragRef.current = null;
      setDragging(false);
      return;
    }
    const element = stickerRef.current;
    if (!element) return;
    const keepVisible = () => setStickerPosition(current =>
      current ? clampStickerPosition(current, element) : current
    );
    keepVisible();
    window.addEventListener("resize", keepVisible);
    const observer = new ResizeObserver(keepVisible);
    observer.observe(element);
    return () => {
      window.removeEventListener("resize", keepVisible);
      observer.disconnect();
    };
  }, [showMiniPlayer]);

  function startStickerDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || !stickerRef.current) return;
    const rect = stickerRef.current.getBoundingClientRect();
    dragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setStickerPosition(clampStickerPosition({ x: rect.left, y: rect.top }, stickerRef.current));
    event.preventDefault();
  }

  function moveSticker(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !stickerRef.current) return;
    setStickerPosition(clampStickerPosition({
      x: event.clientX - drag.offsetX,
      y: event.clientY - drag.offsetY,
    }, stickerRef.current));
  }

  function endStickerDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function moveStickerWithKeyboard(event: ReactKeyboardEvent<HTMLButtonElement>) {
    const element = stickerRef.current;
    if (!element) return;
    if (event.key === "Home") {
      event.preventDefault();
      setStickerPosition(null);
      return;
    }
    const step = event.shiftKey ? 40 : 12;
    const directions: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const rect = element.getBoundingClientRect();
    setStickerPosition(current => clampStickerPosition({
      x: (current?.x ?? rect.left) + direction[0],
      y: (current?.y ?? rect.top) + direction[1],
    }, element));
  }

  const miniKind = track?.kind;
  const miniSlug = track?.slug;
  useEffect(() => {
    let active = true;
    setMiniQueue([]);
    if (showMiniPlayer && miniKind) {
      void getPlayableAudioNuggets(miniKind).then(items => {
        if (active) setMiniQueue(items);
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [showMiniPlayer, miniKind, miniSlug]);

  async function moveMiniTrack(direction: number) {
    if (!track || switchingTrack) return;
    const version = playbackVersion.current;
    setSwitchingTrack(true);
    try {
      const available = await getPlayableAudioNuggets(track.kind);
      if (version !== playbackVersion.current) return;
      setMiniQueue(available);
      if (!available.some(item => item.slug !== track.slug)) return;
      const index = available.findIndex(item => item.slug === track.slug);
      const next = index < 0 ? available[direction > 0 ? 0 : available.length - 1]
        : available[(index + direction + available.length) % available.length];
      if (!next || next.slug === track.slug) return;
      const src = track.kind === "nugget" ? next.nuggetAudioUrl : next.audioUrl;
      if (!src) return;
      await playTrack({
        src,
        title: next.title,
        subtitle: `${next.scriptureRef} · ${displayTopicName(next.topic)}`,
        slug: next.slug,
        coverImage: next.image,
        kind: track.kind,
        href: `/nugget/${next.slug}/${track.kind === "music" ? "musical" : "audio"}`,
      });
    } catch {
      if (version === playbackVersion.current) setError("Could not load the next available audio. Please try again.");
    } finally {
      setSwitchingTrack(false);
    }
  }


  return (
    <GlobalAudioPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        loop={repeat}
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={() => {
          const value = audioRef.current?.duration || 0;
          setDuration(Number.isFinite(value) ? value : 0);
        }}
        onDurationChange={() => {
          const value = audioRef.current?.duration || 0;
          setDuration(Number.isFinite(value) ? value : 0);
        }}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setError("This audio file is unavailable or uses an unsupported format.");
        }}
      />
      {showMiniPlayer && track && (
        <section
          ref={stickerRef}
          aria-label="Floating audio player"
          style={stickerPosition ? { left: stickerPosition.x, top: stickerPosition.y, right: "auto", bottom: "auto" } : undefined}
          className="fixed bottom-4 right-4 z-[90] w-[min(310px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#171717]/95 text-[#FAF9F6] shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:bottom-6 sm:right-6"
        >
          <button type="button" aria-label="Move floating audio player" title="Drag to move, or use arrow keys. Home resets position." onPointerDown={startStickerDrag} onPointerMove={moveSticker} onPointerUp={endStickerDrag} onPointerCancel={endStickerDrag} onLostPointerCapture={endStickerDrag} onKeyDown={moveStickerWithKeyboard} className={`flex h-6 w-full touch-none select-none items-center justify-center text-white/60 hover:text-[#E28906] focus-visible:outline focus-visible:outline-[#E28906] ${dragging ? "cursor-grabbing" : "cursor-grab"}`}>
            <GripHorizontal size={18} aria-hidden="true" />
          </button>
          <div className="flex items-center gap-3 px-3 pb-3">
            <Link href={track.href} aria-label={`Open ${track.title} player`} className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/5">
              <Image src={track.coverImage || "/media-placeholder.svg"} alt="" fill sizes="44px" className="object-cover" />
            </Link>
            <Link href={track.href} className="min-w-0 flex-1">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-[#E28906]">
                {track.kind === "nugget" ? "Nugget audio" : "Music"}
              </span>
              <span className="mt-0.5 block truncate text-[12px] font-semibold">{track.title}</span>
              <span className="mt-0.5 block truncate text-[10px] text-white/45">{track.subtitle}</span>
            </Link>

            <Link href={track.href} aria-label="Open full audio player" className="flex h-8 w-7 shrink-0 items-center justify-center text-white/45 transition hover:text-white">
              <Maximize2 size={14} />
            </Link>
            <button type="button" aria-label="Close audio player and stop playback" onClick={stop} className="flex h-8 w-7 shrink-0 items-center justify-center text-white/45 transition hover:text-white">
              <X size={15} />
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 px-3 pb-2">
            <button type="button" aria-label="Previous audio track" onClick={() => void moveMiniTrack(-1)} disabled={switchingTrack || !miniQueue.some(item => item.slug !== track.slug)} className="flex h-9 w-9 items-center justify-center text-white/70 hover:text-white disabled:opacity-30">
              <SkipBack size={16} />
            </button>
            <button type="button" aria-label={playing ? "Pause audio" : "Play audio"} onClick={() => void togglePlay()} disabled={switchingTrack} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E28906] text-[#080808] transition hover:bg-[#f0a52e]">
              {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            </button>
            <button type="button" aria-label="Next audio track" onClick={() => void moveMiniTrack(1)} disabled={switchingTrack || !miniQueue.some(item => item.slug !== track.slug)} className="flex h-9 w-9 items-center justify-center text-white/70 hover:text-white disabled:opacity-30">
              <SkipForward size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 pb-2.5">
            <span className="text-[9px] tabular-nums text-white/40">{formatTime(currentTime)}</span>
            <input aria-label="Audio progress" type="range" min={0} max={duration || 1} value={Math.min(currentTime, duration || 1)} disabled={!duration} onChange={event => seekTo(Number(event.target.value))} className="h-1 min-w-0 flex-1 cursor-pointer accent-[#E28906]" />
            <span className="text-[9px] tabular-nums text-white/40">{formatTime(duration)}</span>
          </div>
          {error && <p role="status" className="px-3 pb-2 text-[10px] text-[#E28906]">{error}</p>}
        </section>
      )}
    </GlobalAudioPlayerContext.Provider>
  );
}
