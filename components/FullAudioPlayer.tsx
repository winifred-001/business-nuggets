"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  Check,
  Download,
  ListMusic,
  NotebookPen,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Shuffle,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { API_URL } from "@/lib/api";
import type { Nugget } from "@/types/nugget";

type Playlist = {
  id: number;
  name: string;
};

type Props = {
  nugget: Nugget;
  queue: Nugget[];
  audioSrc: string | null;
  coverImage: string;
};

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return "00:00";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function FullAudioPlayer({
  nugget,
  queue,
  audioSrc,
  coverImage,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [saved, setSaved] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkSaved() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/saved-nuggets`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;
        const data = await response.json();

        if (!cancelled) {
          setSaved(
            Array.isArray(data) &&
              data.some((item) => item.nuggetId === nugget.id),
          );
        }
      } catch {
        // Audio remains usable even if account actions are unavailable.
      }
    }

    void checkSaved();

    return () => {
      cancelled = true;
    };
  }, [nugget.id]);

  async function togglePlay() {
    if (!audioSrc) {
      setMessage("No audio file has been attached to this Nugget yet.");
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function seek(amount: number) {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(
      0,
      Math.min(audio.duration || 0, audio.currentTime + amount),
    );
  }

  function changeSpeed() {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(speed);
    const next = speeds[(currentIndex + 1) % speeds.length];

    setSpeed(next);

    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  }

  async function toggleSave() {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch(
        saved
          ? `${API_URL}/saved-nuggets/${nugget.id}`
          : `${API_URL}/saved-nuggets`,
        {
          method: saved ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          ...(saved
            ? {}
            : {
                body: JSON.stringify({ nuggetId: nugget.id }),
              }),
        },
      );

      if (response.ok) {
        setSaved((current) => !current);
      }
    } catch {
      setMessage("Could not update your saved Nuggets.");
    }
  }

  async function openPlaylists() {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch(`${API_URL}/playlists`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const data = await response.json();
      setPlaylists(Array.isArray(data) ? data : []);
      setPlaylistOpen(true);
    } catch {
      setMessage("Could not load your playlists.");
    }
  }

  async function addToPlaylist(playlistId: number) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/playlists/${playlistId}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nuggetId: nugget.id }),
        },
      );

      if (response.ok) {
        setMessage("Added to playlist.");
        setPlaylistOpen(false);
      }
    } catch {
      setMessage("Could not add this Nugget to the playlist.");
    }
  }

  async function saveNote() {
    if (!note.trim()) return;

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: nugget.title,
          content: note.trim(),
          nuggetId: nugget.id,
        }),
      });

      if (response.ok) {
        setMessage("Note saved.");
        setNote("");
        setNoteOpen(false);
      }
    } catch {
      setMessage("Could not save your note.");
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc ?? undefined}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
      />

      <main className="mx-auto w-full max-w-[1280px] px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-12">
          <section className="min-w-0">
            <div className="relative mx-auto aspect-square w-full max-w-[350px] overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
              <Image
                src={coverImage}
                alt={nugget.title}
                fill
                priority
                sizes="(max-width: 640px) calc(100vw - 40px), 350px"
                className="object-cover"
              />
            </div>

            <div className="mx-auto mt-6 max-w-[520px] text-center sm:mt-7">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C8A35A]">
                {nugget.scriptureRef} · {nugget.topic}
              </p>

              <h1 className="bn-hero-title mt-3 font-serif text-[34px] leading-[1.12] sm:text-[40px]">
                {nugget.title}
              </h1>

              {nugget.scriptureText && (
                <p className="mt-4 font-serif text-[16px] italic leading-7 text-white/50">
                  “{nugget.scriptureText}”
                </p>
              )}
            </div>

            <div className="mt-7">
              <label htmlFor="audio-progress" className="sr-only">
                Audio progress
              </label>
              <input
                id="audio-progress"
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setCurrentTime(value);
                  if (audioRef.current) {
                    audioRef.current.currentTime = value;
                  }
                }}
                className="h-11 w-full cursor-pointer accent-[#C8A35A]"
              />

              <div className="mt-1 flex justify-between text-[12px] text-white/40">
                <span>{formatTime(currentTime)}</span>
                <span>{duration ? formatTime(duration) : nugget.duration}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 sm:gap-4">
              <button
                type="button"
                aria-label="Shuffle"
                className="flex h-11 w-11 items-center justify-center rounded-full text-white/45 transition hover:bg-white/[0.04] hover:text-white"
              >
                <Shuffle size={18} />
              </button>

              <button
                type="button"
                onClick={() => seek(-10)}
                aria-label="Back 10 seconds"
                className="flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.04] hover:text-white"
              >
                <RotateCcw size={19} />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C8A35A] text-[#080808] transition hover:bg-[#E0C48A]"
              >
                {playing ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" />
                )}
              </button>

              <button
                type="button"
                onClick={() => seek(10)}
                aria-label="Forward 10 seconds"
                className="flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.04] hover:text-white"
              >
                <RotateCw size={19} />
              </button>

              <button
                type="button"
                onClick={changeSpeed}
                aria-label={`Playback speed ${speed} times`}
                className="flex h-11 min-w-11 items-center justify-center rounded-lg border border-white/10 px-2 text-[12px] font-semibold text-[#C8A35A]"
              >
                {speed}x
              </button>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <PlayerAction
                label={saved ? "Saved" : "Save"}
                onClick={toggleSave}
              >
                {saved ? <Check size={18} /> : <Bookmark size={18} />}
              </PlayerAction>

              <PlayerAction label="Playlist" onClick={openPlaylists}>
                <ListMusic size={18} />
              </PlayerAction>

              <PlayerAction label="Write Note" onClick={() => setNoteOpen(true)}>
                <NotebookPen size={18} />
              </PlayerAction>

              {audioSrc ? (
                <a
                  href={audioSrc}
                  download
                  className="bn-button flex min-h-14 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-[14px] text-white/55 transition hover:border-[#C8A35A]/40 hover:text-[#C8A35A] sm:flex-col"
                >
                  <Download size={18} />
                  Offline
                </a>
              ) : (
                <span className="flex min-h-14 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/[0.06] px-3 text-[14px] text-white/20 sm:flex-col">
                  <Download size={18} />
                  Offline
                </span>
              )}
            </div>

            {message && (
              <p className="mt-5 text-center text-[14px] leading-6 text-[#C8A35A]">
                {message}
              </p>
            )}
          </section>

          <aside className="min-w-0 lg:pt-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-serif text-[28px]">Wisdom Queue</h2>

              <Link
                href={`/nugget/${nugget.slug}/reader`}
                className="bn-button inline-flex min-h-11 items-center text-[14px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
              >
                Open Full Reader View
              </Link>
            </div>

            <div className="mt-5 space-y-3 sm:mt-6">
              <QueueRow index={1} nugget={nugget} active />
              {queue.map((item, index) => (
                <QueueRow
                  key={item.slug}
                  index={index + 2}
                  nugget={item}
                />
              ))}
            </div>
          </aside>
        </div>
      </main>

      {playlistOpen && (
        <Modal title="Add to Playlist" onClose={() => setPlaylistOpen(false)}>
          {playlists.length > 0 ? (
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => addToPlaylist(playlist.id)}
                  className="min-h-12 w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-left text-[14px] transition hover:border-[#C8A35A]/50"
                >
                  {playlist.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[16px] leading-7 text-white/50">
              You do not have any playlists yet.
            </p>
          )}
        </Modal>
      )}

      {noteOpen && (
        <Modal title="Write Note" onClose={() => setNoteOpen(false)}>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={6}
            placeholder="Write your note..."
            className="w-full resize-none rounded-lg border border-white/10 bg-[#111111] p-4 text-[16px] leading-7 outline-none focus:border-[#C8A35A]"
          />

          <button
            type="button"
            onClick={saveNote}
            className="mt-4 min-h-12 rounded-lg bg-[#C8A35A] px-5 text-[15px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
          >
            Save Note
          </button>
        </Modal>
      )}
    </>
  );
}

function QueueRow({
  nugget,
  index,
  active = false,
}: {
  nugget: Nugget;
  index: number;
  active?: boolean;
}) {
  return (
    <Link
      href={`/nugget/${nugget.slug}/audio`}
      className={`bn-button ${`grid min-h-16 grid-cols-[24px_minmax(0,1fr)_56px] items-center gap-3 rounded-lg border px-3 py-3 transition sm:grid-cols-[28px_minmax(0,1fr)_70px] sm:px-4 sm:py-4 ${
        active
          ? "border-[#C8A35A]/35 bg-[#111111]"
          : "border-white/10 bg-[#111111] hover:border-[#C8A35A]/35"
      }`}`}
    >
      <span className="font-serif text-[15px] text-[#C8A35A]">
        {String(index).padStart(2, "0")}
      </span>

      <div className="min-w-0">
        <p className="truncate font-serif text-[16px] leading-6">
          {nugget.title}
        </p>
        <p className="mt-1 truncate text-[12px] text-white/40">
          {nugget.scriptureRef}
        </p>
      </div>

      <span className="text-right text-[12px] text-white/35">
        {nugget.duration}
      </span>
    </Link>
  );
}

function PlayerAction({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-[14px] text-white/55 transition hover:border-[#C8A35A]/40 hover:text-[#C8A35A] sm:flex-col"
    >
      {children}
      {label}
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 px-4 sm:items-center sm:px-5">
      <div className="max-h-[88vh] w-full max-w-[460px] overflow-y-auto rounded-t-[20px] border border-white/10 bg-[#111111] p-5 sm:rounded-xl sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-[28px]">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.04] hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
