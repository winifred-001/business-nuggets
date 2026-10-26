"use client";
import { useCallback, useRef, useState } from "react";
export function audioTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "00:00";
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
}
export function useAudioPlayback(src: string | null) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [audioError, setAudioError] = useState("");
  const attachAudio = useCallback((element: HTMLAudioElement | null) => {
    audioRef.current = element;
    // Cached media may finish loading before React hydrates the server-rendered audio.
    if (element && Number.isFinite(element.duration)) setDuration(element.duration);
    if (element?.error) { setPlaying(false); setAudioError("This audio file is unavailable or uses an unsupported format. Please try another Nugget."); }
  }, []);
  async function togglePlay() {
    const audio = audioRef.current;
    if (!src || !audio) { setAudioError("No audio file has been attached to this Nugget yet."); return; }
    if (!audio.paused) { audio.pause(); return; }
    setAudioError("");
    try { await audio.play(); }
    catch (cause) { if (cause instanceof DOMException && cause.name === "AbortError") return; setPlaying(false); setAudioError("Audio could not start. Check your connection and try Play again."); }
  }
  function seekTo(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const next = Math.max(0, Math.min(audio.duration, value));
    audio.currentTime = next; setCurrentTime(next);
  }
  function seek(amount: number) { seekTo((audioRef.current?.currentTime || 0) + amount); }
  function changeSpeed() {
    const speeds = [1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next); if (audioRef.current) audioRef.current.playbackRate = next;
  }
  function toggleMute() { const next = !muted; setMuted(next); if (audioRef.current) audioRef.current.muted = next; }
  const audioProps = {
    src: src || undefined, preload: "metadata" as const, loop: repeat,
    onPlay: () => setPlaying(true), onPause: () => setPlaying(false),
    onLoadedMetadata: () => { const value = audioRef.current?.duration || 0; setDuration(Number.isFinite(value) ? value : 0); },
    onTimeUpdate: () => setCurrentTime(audioRef.current?.currentTime || 0),
    onEnded: () => setPlaying(false),
    onError: () => { setPlaying(false); setAudioError("This audio file is unavailable or uses an unsupported format. Please try another Nugget."); },

  };
  return { audioRef: attachAudio, audioProps, playing, currentTime, duration, speed, muted, repeat, audioError, togglePlay, seek, seekTo, changeSpeed, toggleMute, toggleRepeat: () => setRepeat(value => !value) };
}
