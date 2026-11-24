"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Maximize2, Pause, Play, X } from "lucide-react";

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

export default function GlobalAudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
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
          aria-label="Floating audio player"
          className="fixed bottom-4 right-4 z-[90] w-[min(310px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#171717]/95 text-[#FAF9F6] shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:bottom-6 sm:right-6"
        >
          <div className="flex items-center gap-3 p-3">
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
            <button type="button" aria-label={playing ? "Pause audio" : "Play audio"} onClick={() => void togglePlay()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E28906] text-[#080808] transition hover:bg-[#f0a52e]">
              {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            </button>
            <Link href={track.href} aria-label="Open full audio player" className="flex h-8 w-7 shrink-0 items-center justify-center text-white/45 transition hover:text-white">
              <Maximize2 size={14} />
            </Link>
            <button type="button" aria-label="Close audio player and stop playback" onClick={stop} className="flex h-8 w-7 shrink-0 items-center justify-center text-white/45 transition hover:text-white">
              <X size={15} />
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
