"use client";
import Link from "next/link";
import { Pause, Play, Repeat, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { useAudioPlayback, audioTime } from "@/lib/use-audio-playback";
export default function AudioBar({ title, subtitle, audioSrc, slug }: { title: string; subtitle: string; audioSrc: string | null; slug: string }) {
  const { audioRef, audioProps, playing, currentTime, duration, muted, repeat, audioError, togglePlay, seek, seekTo, toggleRepeat, toggleMute } = useAudioPlayback(audioSrc);
  const controls = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/65 hover:text-[#ead2a0] disabled:opacity-30";
  return <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#191b18] text-[#f9f5ed]">
    <audio ref={audioRef} {...audioProps} />
    <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
      <div className="min-w-0 flex-1 sm:max-w-[280px]"><p className="truncate text-[14px]">{title}</p><p className="truncate text-[12px] text-white/45">{subtitle}</p></div>
      <div className="flex items-center gap-1 sm:mx-auto">
        <button type="button" onClick={() => seek(-10)} disabled={!duration} aria-label="Back 10 seconds" className={controls}><RotateCcw size={18} /></button>
        <button type="button" onClick={togglePlay} disabled={!audioSrc} aria-label={playing ? "Pause" : "Play"} className={`${controls} bg-[#cda762] text-black!`}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
        <button type="button" onClick={() => seek(10)} disabled={!duration} aria-label="Forward 10 seconds" className={controls}><RotateCw size={18} /></button>
        <button type="button" onClick={toggleRepeat} disabled={!audioSrc} aria-label="Repeat" aria-pressed={repeat} className={`${controls} ${repeat ? "text-[#cda762]!" : ""}`}><Repeat size={17} /></button>
        <button type="button" onClick={toggleMute} disabled={!audioSrc} aria-label={muted ? "Unmute" : "Mute"} className={`${controls} hidden sm:flex`}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
        <Link href={`/nugget/${slug}/audio`} aria-label="Open full player" className={controls}><Maximize2 size={17} /></Link>
      </div>
      <div className="flex w-full items-center gap-3 sm:w-auto sm:min-w-[180px] sm:flex-1"><span className="text-[11px]">{audioTime(currentTime)}</span><input aria-label="Audio progress" type="range" min={0} max={duration || 1} value={currentTime} disabled={!duration} onChange={event => seekTo(Number(event.target.value))} className="min-w-0 flex-1 accent-[#cda762]" /><span className="text-[11px]">{audioTime(duration)}</span></div>
      {(!audioSrc || audioError) && <p role="status" className="w-full text-[12px] text-[#ead2a0]">{audioError || "No audio has been attached to this Nugget yet."}</p>}
    </div>
  </div>;
}
