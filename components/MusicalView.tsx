"use client";

import { useEffect } from "react";

import Image from "next/image";
import Link from "next/link";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";

import { useGlobalAudioPlayer } from "@/components/GlobalAudioPlayerProvider";
import { displayTopicName } from "@/lib/topic-display";

import type { Nugget } from "@/types/nugget";

type MusicalNugget = Nugget & {
  musicalTitle?: string | null;
  musicalImage?: string | null;
};

export default function MusicalView({
  nugget,
  related,
  audioSrc,
  coverImage,
}: {
  nugget: MusicalNugget;
  related: MusicalNugget[];
  audioSrc: string | null;
  coverImage: string;
}) {
  const player = useGlobalAudioPlayer();
  const isCurrentTrack = Boolean(audioSrc && player.track?.src === audioSrc);
  const playing = isCurrentTrack && player.playing;
  const duration = isCurrentTrack ? player.duration : 0;
  const message = isCurrentTrack ? player.error : "";
  function togglePlay() {
    if (!audioSrc) return;
    if (isCurrentTrack) {
      void player.togglePlay();
      return;
    }
    void player.playTrack({
      src: audioSrc,
      title: nugget.musicalTitle ?? nugget.title,
      subtitle: `${nugget.scriptureRef} · ${displayTopicName(nugget.topic)}`,
      slug: nugget.slug,
      coverImage,
      kind: "music",
      href: `/nugget/${nugget.slug}/musical`,
    });
  }
  function seek(amount: number) {
    if (isCurrentTrack) player.seek(amount);
  }

  useEffect(() => {
    if (!audioSrc) return;
    player.registerLocalControl(audioSrc, true);
    return () => player.registerLocalControl(audioSrc, false);
  }, [audioSrc, player.registerLocalControl]);

  return (
    <>
      <main className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* MUSICAL COVER */}
          <section>
            <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10">
              <Image
                src={coverImage}
                alt={nugget.title}
                fill
                priority
                sizes="340px"
                className="object-cover"
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#E28906]">
                Wisdom Cinematic Musical
              </p>

              <h1 className="bn-hero-title mt-2 font-serif text-[28px] leading-tight">
                {nugget.musicalTitle ??
                  nugget.title}
              </h1>

              <p className="mt-2 text-[13px] text-white/40">
                {nugget.scriptureRef} · {displayTopicName(nugget.topic)}
              </p>

              <div className="mt-5 flex items-center justify-center gap-5">
                <button
                  type="button"
                  aria-label="Back 10 seconds"
                  disabled={!duration}
                  onClick={() =>
                    seek(-10)
                  }
                  className="text-white/50 hover:text-white"
                >
                  <SkipBack
                    size={17}
                  />
                </button>

                <button
                  type="button"
                  aria-label={playing ? "Pause" : "Play"}
                  disabled={!audioSrc}
                  onClick={togglePlay}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E28906] text-[#080808]"
                >
                  {playing ? (
                    <Pause
                      size={17}
                      fill="currentColor"
                    />
                  ) : (
                    <Play
                      size={17}
                      fill="currentColor"
                    />
                  )}
                </button>

                <button
                  type="button"
                  aria-label="Forward 10 seconds"
                  disabled={!duration}
                  onClick={() =>
                    seek(10)
                  }
                  className="text-white/50 hover:text-white"
                >
                  <SkipForward
                    size={17}
                  />
                </button>
              </div>

              {(message || !audioSrc) && (
                <p className="mt-4 text-[13px] text-[#E28906]">
                  {message || "No Musical audio has been attached to this Nugget yet."}
                </p>
              )}
            </div>
          </section>

          {/* PARENT STUDY AND RELATED MUSICALS */}
          <section>
            <div className="flex flex-col gap-5 rounded-xl border border-[#E28906]/45 bg-[#111111] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#E28906]">
                  Parent Scripture Study
                </p>

                <p className="mt-1 font-serif text-[16px]">
                  {nugget.scriptureRef} ·{" "}
                  {nugget.title}
                </p>
              </div>

              <Link
                href={`/nugget/${nugget.slug}`}
                className="bn-button w-fit rounded-md bg-[#E28906]/20 px-4 py-2 text-[12px] font-medium text-[#E28906]"
              >
                Read Exposition
              </Link>
            </div>

            {/* RELATED MUSICALS */}
            <section className="mt-8" aria-label="Related Cinematic Musicals">
              <h2 className="font-serif text-[28px]">
                Related Cinematic Musicals
              </h2>
              <p className="mt-2 text-[13px] text-white/50">
                More from {displayTopicName(nugget.topic)}
              </p>

              {related.length > 0 ? (
                <div className="mt-5 grid gap-3">
                  {related.map(item => (
                    <Link
                      key={item.slug}
                      href={`/nugget/${item.slug}/musical`}
                      className="group flex min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-[#111111] p-3 transition hover:border-[#E28906]/40 sm:gap-4"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={item.musicalImage || item.image || "/media-placeholder.svg"}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-[15px] text-[#FAF9F6]">
                          {item.musicalTitle || item.title}
                        </p>
                        <p className="mt-1 truncate text-[12px] text-white/50">
                          {item.scriptureRef}
                        </p>
                      </div>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E28906]/40 text-[#E28906] transition group-hover:bg-[#E28906] group-hover:text-[#080808]">
                        <Play size={14} fill="currentColor" />
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-[14px] text-white/45">
                  No other Musicals with available audio in this topic yet.
                </p>
              )}
            </section>
          </section>
        </div>
      </main>
    </>
  );
}