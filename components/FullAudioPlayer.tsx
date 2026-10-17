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
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

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
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    return "00:00";
  }

  const minutes = Math.floor(
    value / 60,
  );

  const seconds = Math.floor(
    value % 60,
  );

  return `${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}

export default function FullAudioPlayer({
  nugget,
  queue,
  audioSrc,
  coverImage,
}: Props) {
  const audioRef =
    useRef<HTMLAudioElement>(null);

  const [playing, setPlaying] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [speed, setSpeed] =
    useState(1);

  const [saved, setSaved] =
    useState(false);

  const [playlistOpen, setPlaylistOpen] =
    useState(false);

  const [playlists, setPlaylists] =
    useState<Playlist[]>([]);

  const [noteOpen, setNoteOpen] =
    useState(false);

  const [note, setNote] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    async function checkSaved() {
      const token =
        localStorage.getItem("token");

      if (!token) return;

      try {
        const response = await fetch(
          "http://localhost:3001/saved-nuggets",
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) return;

        const data =
          await response.json();

        setSaved(
          Array.isArray(data) &&
            data.some(
              (item) =>
                item.nuggetId ===
                nugget.id,
            ),
        );
      } catch {
        // player should still work
      }
    }

    checkSaved();
  }, [nugget.id]);

  async function togglePlay() {
    if (!audioSrc) {
      setMessage(
        "No audio file has been attached to this Nugget yet.",
      );
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
      Math.min(
        audio.duration || 0,
        audio.currentTime + amount,
      ),
    );
  }

  function changeSpeed() {
    const speeds = [
      1,
      1.25,
      1.5,
      2,
    ];

    const index =
      speeds.indexOf(speed);

    const next =
      speeds[
        (index + 1) %
          speeds.length
      ];

    setSpeed(next);

    if (audioRef.current) {
      audioRef.current.playbackRate =
        next;
    }
  }

  async function toggleSave() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      window.location.href =
        "/login";
      return;
    }

    try {
      const response = await fetch(
        saved
          ? `http://localhost:3001/saved-nuggets/${nugget.id}`
          : "http://localhost:3001/saved-nuggets",
        {
          method: saved
            ? "DELETE"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          ...(saved
            ? {}
            : {
                body: JSON.stringify({
                  nuggetId:
                    nugget.id,
                }),
              }),
        },
      );

      if (response.ok) {
        setSaved(!saved);
      }
    } catch {
      setMessage(
        "Could not update your saved Nuggets.",
      );
    }
  }

  async function openPlaylists() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      window.location.href =
        "/login";
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3001/playlists",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) return;

      const data =
        await response.json();

      setPlaylists(
        Array.isArray(data)
          ? data
          : [],
      );

      setPlaylistOpen(true);
    } catch {
      setMessage(
        "Could not load your playlists.",
      );
    }
  }

  async function addToPlaylist(
    playlistId: number,
  ) {
    const token =
      localStorage.getItem("token");

    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:3001/playlists/${playlistId}/items`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            nuggetId: nugget.id,
          }),
        },
      );

      if (response.ok) {
        setMessage(
          "Added to playlist.",
        );

        setPlaylistOpen(false);
      }
    } catch {
      setMessage(
        "Could not add this Nugget to the playlist.",
      );
    }
  }

  async function saveNote() {
    if (!note.trim()) return;

    const token =
      localStorage.getItem("token");

    if (!token) {
      window.location.href =
        "/login";
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3001/notes",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            title: nugget.title,
            content: note.trim(),
            nuggetId: nugget.id,
          }),
        },
      );

      if (response.ok) {
        setMessage("Note saved.");
        setNote("");
        setNoteOpen(false);
      }
    } catch {
      setMessage(
        "Could not save your note.",
      );
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc ?? undefined}
        onLoadedMetadata={(event) =>
          setDuration(
            event.currentTarget
              .duration,
          )
        }
        onTimeUpdate={(event) =>
          setCurrentTime(
            event.currentTarget
              .currentTime,
          )
        }
        onEnded={() =>
          setPlaying(false)
        }
      />

      <main className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[480px_minmax(0,1fr)]">
          {/* PLAYER */}
          <section>
            <div className="relative mx-auto aspect-square max-w-[350px] overflow-hidden rounded-xl border border-white/10">
              <Image
                src={coverImage}
                alt={nugget.title}
                fill
                priority
                sizes="350px"
                className="object-cover"
              />
            </div>

            <div className="mx-auto mt-7 max-w-[500px] text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C8A35A]">
                {nugget.scriptureRef} ·{" "}
                {nugget.topic}
              </p>

              <h1 className="mt-3 font-serif text-[28px] leading-tight">
                {nugget.title}
              </h1>

              {nugget.scriptureText && (
                <p className="mt-4 font-serif text-[14px] italic leading-6 text-white/45">
                  “{nugget.scriptureText}”
                </p>
              )}
            </div>

            {/* PROGRESS */}
            <div className="mt-7">
              <input
                type="range"
                min={0}
                max={
                  duration || 100
                }
                value={currentTime}
                onChange={(event) => {
                  const value = Number(
                    event.target.value,
                  );

                  setCurrentTime(
                    value,
                  );

                  if (
                    audioRef.current
                  ) {
                    audioRef.current.currentTime =
                      value;
                  }
                }}
                className="w-full accent-[#C8A35A]"
              />

              <div className="mt-1 flex justify-between text-[11px] text-white/30">
                <span>
                  {formatTime(
                    currentTime,
                  )}
                </span>

                <span>
                  {duration
                    ? formatTime(
                        duration,
                      )
                    : nugget.duration}
                </span>
              </div>
            </div>

            {/* AUDIO CONTROLS */}
            <div className="mt-5 flex items-center justify-center gap-5">
              <button
                type="button"
                aria-label="Shuffle"
                className="text-white/45 transition hover:text-white"
              >
                <Shuffle size={17} />
              </button>

              <button
                type="button"
                onClick={() =>
                  seek(-10)
                }
                aria-label="Back 10 seconds"
                className="text-white/60 transition hover:text-white"
              >
                <RotateCcw
                  size={18}
                />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={
                  playing
                    ? "Pause"
                    : "Play"
                }
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C8A35A] text-[#080808]"
              >
                {playing ? (
                  <Pause
                    size={18}
                    fill="currentColor"
                  />
                ) : (
                  <Play
                    size={18}
                    fill="currentColor"
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  seek(10)
                }
                aria-label="Forward 10 seconds"
                className="text-white/60 transition hover:text-white"
              >
                <RotateCw size={18} />
              </button>

              <button
                type="button"
                onClick={changeSpeed}
                className="rounded border border-white/10 px-2 py-1 text-[11px] text-[#C8A35A]"
              >
                {speed}x
              </button>
            </div>

            {/* ACTIONS */}
            <div className="mt-7 flex flex-wrap justify-center gap-7">
              <PlayerAction
                label={
                  saved
                    ? "Saved"
                    : "Save"
                }
                onClick={
                  toggleSave
                }
              >
                {saved ? (
                  <Check size={16} />
                ) : (
                  <Bookmark
                    size={16}
                  />
                )}
              </PlayerAction>

              <PlayerAction
                label="Playlist"
                onClick={
                  openPlaylists
                }
              >
                <ListMusic size={16} />
              </PlayerAction>

              <PlayerAction
                label="Write Note"
                onClick={() =>
                  setNoteOpen(true)
                }
              >
                <NotebookPen
                  size={16}
                />
              </PlayerAction>

              {audioSrc ? (
                <a
                  href={audioSrc}
                  download
                  className="flex flex-col items-center gap-2 text-[11px] text-white/45 transition hover:text-[#C8A35A]"
                >
                  <Download size={16} />
                  Offline
                </a>
              ) : (
                <span className="flex cursor-not-allowed flex-col items-center gap-2 text-[11px] text-white/20">
                  <Download size={16} />
                  Offline
                </span>
              )}
            </div>

            {message && (
              <p className="mt-5 text-center text-[13px] text-[#C8A35A]">
                {message}
              </p>
            )}
          </section>

          {/* QUEUE */}
          <aside className="lg:pt-2">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-[28px]">
                Wisdom Queue
              </h2>

              <Link
                href={`/nugget/${nugget.slug}/reader`}
                className="text-[13px] font-medium text-[#C8A35A]"
              >
                Open Full Reader View
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              <QueueRow
                index={1}
                nugget={nugget}
                active
              />

              {queue.map(
                (item, index) => (
                  <QueueRow
                    key={item.slug}
                    index={index + 2}
                    nugget={item}
                  />
                ),
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* PLAYLIST MODAL */}
      {playlistOpen && (
        <Modal
          title="Add to Playlist"
          onClose={() =>
            setPlaylistOpen(
              false,
            )
          }
        >
          {playlists.length > 0 ? (
            <div className="space-y-2">
              {playlists.map(
                (playlist) => (
                  <button
                    key={
                      playlist.id
                    }
                    type="button"
                    onClick={() =>
                      addToPlaylist(
                        playlist.id,
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-left text-[14px] transition hover:border-[#C8A35A]/50"
                  >
                    {
                      playlist.name
                    }
                  </button>
                ),
              )}
            </div>
          ) : (
            <p className="text-[14px] text-white/45">
              You do not have any
              playlists yet.
            </p>
          )}
        </Modal>
      )}

      {/* NOTE MODAL */}
      {noteOpen && (
        <Modal
          title="Write Note"
          onClose={() =>
            setNoteOpen(false)
          }
        >
          <textarea
            value={note}
            onChange={(event) =>
              setNote(
                event.target.value,
              )
            }
            rows={6}
            placeholder="Write your note..."
            className="w-full resize-none rounded-lg border border-white/10 bg-[#111111] p-4 text-[14px] outline-none focus:border-[#C8A35A]"
          />

          <button
            type="button"
            onClick={saveNote}
            className="mt-4 rounded-lg bg-[#C8A35A] px-5 py-3 text-[13px] font-semibold text-[#080808]"
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
      className={`grid grid-cols-[28px_minmax(0,1fr)_70px] items-center gap-3 rounded-lg border px-4 py-4 transition ${
        active
          ? "border-[#C8A35A]/35 bg-[#111111]"
          : "border-white/10 bg-[#111111] hover:border-[#C8A35A]/35"
      }`}
    >
      <span className="font-serif text-[15px] text-[#C8A35A]">
        {String(index).padStart(
          2,
          "0",
        )}
      </span>

      <div className="min-w-0">
        <p className="truncate font-serif text-[15px]">
          {nugget.title}
        </p>

        <p className="mt-1 text-[12px] text-white/35">
          {nugget.scriptureRef}
        </p>
      </div>

      <span className="text-right text-[12px] text-white/30">
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
      className="flex flex-col items-center gap-2 text-[11px] text-white/45 transition hover:text-[#C8A35A]"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-5">
      <div className="w-full max-w-[460px] rounded-xl border border-white/10 bg-[#0B0B0B] p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[20px]">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5">
          {children}
        </div>
      </div>
    </div>
  );
}