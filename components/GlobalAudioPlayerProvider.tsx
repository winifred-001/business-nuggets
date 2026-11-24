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
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react";

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
        <>
          <div className="h-[78px]" aria-hidden="true" />
          <section aria-label="Persistent audio player" className="fixed inset-x-0 bottom-0 z-[90] border-t border-white/10 bg-[#111111] text-[#FAF9F6] shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
            <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center gap-3 px-4 py-2 sm:gap-5 sm:px-6 lg:px-10">
              <Link href={track.href} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-white/5">
                  <Image src={track.coverImage || "/media-placeholder.svg"} alt="" fill sizes="44px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold">{track.title}</span>
                  <span className="mt-1 block truncate text-[11px] text-white/45">{track.subtitle}</span>
                </span>
              </Link>
              <button type="button" aria-label={playing ? "Pause audio" : "Play audio"} onClick={() => void togglePlay()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E28906] text-[#080808]">
                {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>
              <div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
                <span className="text-[10px] tabular-nums text-white/40">{formatTime(currentTime)}</span>
                <input aria-label="Persistent audio progress" type="range" min={0} max={duration || 1} value={Math.min(currentTime, duration || 1)} disabled={!duration} onChange={event => seekTo(Number(event.target.value))} className="h-1 min-w-0 flex-1 cursor-pointer accent-[#E28906]" />
                <span className="text-[10px] tabular-nums text-white/40">{formatTime(duration)}</span>
              </div>
              <button type="button" aria-label={muted ? "Unmute audio" : "Mute audio"} onClick={toggleMute} className="hidden h-9 w-9 shrink-0 items-center justify-center text-white/55 hover:text-white sm:flex">
                {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
              <button type="button" aria-label="Close audio player" onClick={stop} className="flex h-9 w-9 shrink-0 items-center justify-center text-white/45 hover:text-white">
                <X size={17} />
              </button>
            </div>
            {error && <p role="status" className="mx-auto max-w-[1440px] px-4 pb-2 text-xs text-[#E28906] sm:px-6 lg:px-10">{error}</p>}
          </section>
        </>
      )}
    </GlobalAudioPlayerContext.Provider>
  );
}
