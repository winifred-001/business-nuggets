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
  Repeat,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAudioPlayback, audioTime as formatTime } from "@/lib/use-audio-playback";
import { loginFor } from "@/lib/auth-return";

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

export default function FullAudioPlayer({
  nugget,
  queue,
  audioSrc,
  coverImage,
}: Props) {
  const [shuffledQueue, setShuffledQueue] = useState<Nugget[] | null>(null);
  const playbackQueue = shuffledQueue ?? queue;
  const { audioRef, audioProps, playing, currentTime, duration, speed, audioError, togglePlay, seek, seekTo, changeSpeed, muted, toggleMute, repeat, toggleRepeat } = useAudioPlayback(audioSrc);
  const [busy, setBusy] = useState(false);
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
              data.some((item) => String(item.nuggetId) === String(nugget.id)),
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

  function shuffleQueue() {
    if (shuffledQueue) { setShuffledQueue(null); return; }
    const shuffled = [...queue];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
    }
    // With a short queue, guarantee visible movement if randomness kept the order.
    if (shuffled.length > 1 && shuffled.every((item, i) => item.slug === queue[i].slug)) shuffled.push(shuffled.shift()!);
    setShuffledQueue(shuffled);
  }
  async function ensureOk(response: Response, fallback: string) {
    if (response.ok) return;
    if (response.status === 401) { window.location.assign(loginFor(`/nugget/${nugget.slug}/audio`)); throw new Error("Please log in to continue."); }
    const data = await response.json().catch(() => null);
    throw new Error(typeof data?.message === "string" ? data.message : fallback);
  }
  async function downloadAudio() {
    if (!audioSrc || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(audioSrc);
      if (!response.ok) throw new Error("Download failed.");
      const blob = await response.blob();
      if (!blob.size || blob.type.includes("text/html")) throw new Error("Invalid audio file.");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url;
      const extension = new URL(audioSrc, window.location.origin).pathname.split(".").pop();
      link.download = `${nugget.slug}.${extension && /^(mp3|wav|m4a|ogg|flac)$/i.test(extension) ? extension : "mp3"}`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage("Download started. Find the audio in your device’s downloads.");
    } catch { setMessage("This audio could not be downloaded. The file host may block downloads; you can still stream it here."); }
    finally { setBusy(false); }
  }

  async function toggleSave() {
    if (busy) return;
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.assign(loginFor(`/nugget/${nugget.slug}/audio`));
      return;
    }

    setBusy(true);
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

      await ensureOk(response, "Could not update your saved Nuggets.");
      if (response.ok) {
        setSaved((current) => !current);
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not update your saved Nuggets.");
    } finally { setBusy(false); }
  }

  async function openPlaylists() {
    setMessage("");
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.assign(loginFor(`/nugget/${nugget.slug}/audio`));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/playlists`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await ensureOk(response, "Could not load your playlists.");

      const data = await response.json();
      setPlaylists(Array.isArray(data) ? data : []);
      setPlaylistOpen(true);
    } catch {
      setMessage("Could not load your playlists.");
    }
  }

  async function addToPlaylist(playlistId: number) {
    if (busy) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setBusy(true);
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

      await ensureOk(response, "Could not add this Nugget to the playlist.");
      if (response.ok) {
        setMessage("Added to playlist.");
        setPlaylistOpen(false);
      }
    } catch {
      setMessage("Could not add this Nugget to the playlist.");
    } finally { setBusy(false); }
  }

  async function saveNote() {
    if (!note.trim() || busy) return;

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.assign(loginFor(`/nugget/${nugget.slug}/audio`));
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: nugget.title.slice(0, 120),
          content: note.trim(),
          nuggetId: nugget.id,
        }),
      });

      await ensureOk(response, "Could not save your note.");
      if (response.ok) {
        setMessage("Note saved.");
        setNote("");
        setNoteOpen(false);
      }
    } catch {
      setMessage("Could not save your note.");
    } finally { setBusy(false); }
  }

  return (
    <>
      <audio ref={audioRef} {...audioProps} />

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
                max={duration || 1}
                disabled={!duration}
                value={currentTime}
                onChange={(event) => seekTo(Number(event.target.value))}
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
                aria-pressed={Boolean(shuffledQueue)}
                onClick={shuffleQueue}
                disabled={queue.length < 2}
                className={`flex h-11 w-11 items-center justify-center rounded-full transition disabled:opacity-30 ${shuffledQueue ? "text-[#cda762]" : "text-white/45"}`}
              >
                <Shuffle size={18} />
              </button>

              <button
                type="button"
                onClick={() => seek(-10)}
                aria-label="Back 10 seconds"
                disabled={!duration}
                className="flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.04] hover:text-white"
              >
                <RotateCcw size={19} />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                disabled={!audioSrc}
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
                disabled={!duration}
                className="flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.04] hover:text-white"
              >
                <RotateCw size={19} />
              </button>

              <button
                type="button"
                onClick={changeSpeed}
                disabled={!audioSrc}
                aria-label={`Playback speed ${speed} times`}
                className="flex h-11 min-w-11 items-center justify-center rounded-lg border border-white/10 px-2 text-[12px] font-semibold text-[#C8A35A]"
              >
                {speed}x
              </button>
            </div>

            <div className="mt-3 flex justify-center gap-4">
              <button type="button" disabled={!audioSrc} onClick={toggleRepeat} aria-label="Repeat" aria-pressed={repeat} className={`flex h-11 items-center gap-2 ${repeat ? "text-[#cda762]" : "text-white/50"}`}><Repeat size={17} /> Repeat</button>
              <button type="button" disabled={!audioSrc} onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="flex h-11 items-center gap-2 text-white/50">{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}{muted ? "Unmute" : "Mute"}</button>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <PlayerAction
                label={saved ? "Saved" : "Save"}
                onClick={toggleSave}
                disabled={busy}
              >
                {saved ? <Check size={18} /> : <Bookmark size={18} />}
              </PlayerAction>

              <PlayerAction label="Playlist" onClick={openPlaylists} disabled={busy}>
                <ListMusic size={18} />
              </PlayerAction>

              <PlayerAction label="Write Note" onClick={() => { setMessage(""); setNoteOpen(true); }} disabled={busy}>
                <NotebookPen size={18} />
              </PlayerAction>

              <PlayerAction label={busy ? "Please wait…" : "Download"} onClick={downloadAudio} disabled={!audioSrc || busy}><Download size={18} /></PlayerAction>
            </div>

            {(message || audioError || !audioSrc) && (
              <p role="status" className="mt-5 text-center text-[14px] leading-6 text-[#C8A35A]">
                {message || audioError || "No audio file has been attached to this Nugget yet."}
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
              {playbackQueue.map((item, index) => (
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
          {message && <p role="alert" className="mb-4 text-[14px] text-[#ead2a0]">{message}</p>}
          {playlists.length > 0 ? (
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  disabled={busy}
                  onClick={() => addToPlaylist(playlist.id)}
                  className="min-h-12 w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-left text-[14px] transition hover:border-[#C8A35A]/50"
                >
                  {playlist.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[16px] leading-7 text-white/50">
              You do not have any playlists yet. <Link href="/library/playlist/create" className="text-[#cda762] underline">Create a playlist</Link>.
            </p>
          )}
        </Modal>
      )}

      {noteOpen && (
        <Modal title="Write Note" onClose={() => setNoteOpen(false)}>
          {message && <p role="alert" className="mb-4 text-[14px] text-[#ead2a0]">{message}</p>}
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={6}
            aria-label="Your note"
            maxLength={10000}
            placeholder="Write your note..."
            className="w-full resize-none rounded-lg border border-white/10 bg-[#111111] p-4 text-[16px] leading-7 outline-none focus:border-[#C8A35A]"
          />

          <button
            type="button"
            onClick={saveNote}
            disabled={!note.trim() || busy}
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
  disabled = false,
}: {
  disabled?: boolean;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
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
    <dialog ref={element => { if (element && !element.open) element.showModal(); }} onClose={onClose} aria-label={title} className="fixed z-[100] m-auto w-[calc(100%-32px)] max-w-[460px] border-0 bg-transparent p-0 text-[#f9f5ed] backdrop:bg-black/75">
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
    </dialog>
  );
}
