"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";

import {
  useRef,
  useState,
} from "react";

import type { Nugget } from "@/types/nugget";

type MusicalNugget = Nugget & {
  musicalTitle?: string | null;
};

export default function MusicalView({
  nugget,
  related,
  audioSrc,
  coverImage,
}: {
  nugget: MusicalNugget;
  related: Nugget[];
  audioSrc: string | null;
  coverImage: string;
}) {
  const audioRef =
    useRef<HTMLAudioElement>(null);

  const [playing, setPlaying] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function togglePlay() {
    if (!audioSrc) {
      setMessage(
        "No Musical audio has been attached to this Nugget yet.",
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
    const audio =
      audioRef.current;

    if (!audio) return;

    audio.currentTime =
      Math.max(
        0,
        Math.min(
          audio.duration || 0,
          audio.currentTime +
            amount,
        ),
      );
  }

  const principleLines =
    nugget.keyPrinciple
      ?.split(/(?<=[.!?])\s+/)
      .filter(Boolean)
      .slice(0, 3) ?? [];

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc ?? undefined}
        onEnded={() =>
          setPlaying(false)
        }
      />

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
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C8A35A]">
                Wisdom Cinematic Musical
              </p>

              <h1 className="mt-2 font-serif text-[28px] leading-tight">
                {nugget.musicalTitle ??
                  nugget.title}
              </h1>

              <p className="mt-2 text-[13px] text-white/40">
                {nugget.scriptureRef}
              </p>

              <div className="mt-5 flex items-center justify-center gap-5">
                <button
                  type="button"
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
                  onClick={togglePlay}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C8A35A] text-[#080808]"
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

              {message && (
                <p className="mt-4 text-[13px] text-[#C8A35A]">
                  {message}
                </p>
              )}
            </div>
          </section>

          {/* TEXT EXPERIENCE */}
          <section>
            <div className="flex flex-col gap-5 rounded-xl border border-[#C8A35A]/45 bg-[#111111] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                  Parent Scripture Study
                </p>

                <p className="mt-1 font-serif text-[16px]">
                  {nugget.scriptureRef} ·{" "}
                  {nugget.title}
                </p>
              </div>

              <Link
                href={`/nugget/${nugget.slug}`}
                className="w-fit rounded-md bg-[#C8A35A]/20 px-4 py-2 text-[12px] font-medium text-[#C8A35A]"
              >
                Read Exposition
              </Link>
            </div>

            <div className="mt-8">
              <h2 className="font-serif text-[28px]">
                Cinematic Lyrics
              </h2>

              {nugget.scriptureText && (
                <p className="mt-5 max-w-[700px] font-serif text-[18px] italic leading-8 text-[#C8A35A]">
                  “
                  {
                    nugget.scriptureText
                  }
                  ”
                </p>
              )}

              <div className="mt-6 space-y-4">
                {principleLines.map(
                  (line, index) => (
                    <p
                      key={`${line}-${index}`}
                      className={`max-w-[720px] font-serif text-[17px] leading-7 ${
                        index === 1
                          ? "text-[#E0C48A]"
                          : "text-white/60"
                      }`}
                    >
                      {line}
                    </p>
                  ),
                )}
              </div>
            </div>
          </section>
        </div>

        {/* RELATED MUSICALS */}
        <section className="mt-14">
          <h2 className="font-serif text-[28px]">
            Related Cinematic Musicals
          </h2>

          {related.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map(
                (item, index) => (
                  <Link
                    key={
                      item.slug
                    }
                    href={`/nugget/${item.slug}/musical`}
                    className="group flex items-center gap-4 rounded-lg border border-white/10 bg-[#111111] p-3 transition hover:border-[#C8A35A]/40"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={
                          index === 0
                            ? "/images/cinematic-musical1.png"
                            : index === 1
                              ? "/images/cinematic-musical2.png"
                              : "/images/cinematic-musical3.png"
                        }
                        alt={
                          item.title
                        }
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-serif text-[15px]">
                        {
                          item.title
                        }
                      </p>

                      <p className="mt-1 text-[12px] text-white/35">
                        {
                          item.scriptureRef
                        }
                      </p>
                    </div>
                  </Link>
                ),
              )}
            </div>
          ) : (
            <p className="mt-5 text-[14px] text-white/45">
              No related Musicals are
              available yet.
            </p>
          )}
        </section>
      </main>
    </>
  );
}