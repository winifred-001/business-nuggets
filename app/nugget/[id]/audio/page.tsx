import { notFound } from "next/navigation";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import FullAudioPlayer from "@/components/FullAudioPlayer";
import PremiumNuggetGate from "@/components/PremiumNuggetGate";

import {
  getNuggetBySlugFromApi,
  getPublishedNuggets,
  PremiumRequiredError,
} from "@/lib/nuggets-api";
import {
  getServerMemberToken,
} from "@/lib/server-member-token";

import type { Nugget } from "@/types/nugget";

type AudioNugget = Nugget & {
  audioUrl?: string | null;
  commentaryAudioUrl?: string | null;
  audioImage?: string | null;
};

export default async function AudioPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token =
    await getServerMemberToken();

  let nugget: AudioNugget | null = null;
  let nuggets: AudioNugget[] = [];

  try {
    const [current, all] = await Promise.all([
      getNuggetBySlugFromApi(
        id,
        token,
      ),
      getPublishedNuggets(
        token,
      ),
    ]);

    nugget = current as AudioNugget;
    nuggets = all as AudioNugget[];
  } catch (error) {
    if (
      error instanceof
      PremiumRequiredError
    ) {
      return (
        <PremiumNuggetGate />
      );
    }

    console.error(
      "Could not load audio player:",
      error,
    );
  }

  if (!nugget) {
    notFound();
  }

  const sameTopic = nuggets.filter(
    (item) =>
      item.slug !== nugget.slug &&
      item.topic === nugget.topic,
  );

  const others = nuggets.filter(
    (item) =>
      item.slug !== nugget.slug &&
      item.topic !== nugget.topic,
  );

  const queue = [
    ...sameTopic,
    ...others,
  ].slice(0, 3);

  const audioSrc =
    nugget.commentaryAudioUrl ??
    nugget.audioUrl ??
    null;

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <FullAudioPlayer
        nugget={nugget}
        queue={queue}
        audioSrc={audioSrc}
        coverImage={
          nugget.audioImage ??
          "/images/audio-player.png"
        }
      />

      <Footer />
    </div>
  );
}