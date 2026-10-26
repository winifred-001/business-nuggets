import { notFound } from "next/navigation";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import MusicalView from "@/components/MusicalView";
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

type MusicalNugget = Nugget & {
  audioUrl?: string | null;
  musicalAudioUrl?: string | null;
  musicalImage?: string | null;
  musicalTitle?: string | null;
};

export default async function MusicalPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const token =
    await getServerMemberToken();

  let nugget: MusicalNugget | null =
    null;

  let nuggets: MusicalNugget[] = [];

  try {
    const [current, all] =
      await Promise.all([
        getNuggetBySlugFromApi(
          id,
          token,
        ),
        getPublishedNuggets(
          token,
        ).catch(() => []),
      ]);

    nugget =
      current as MusicalNugget;

    nuggets =
      all as MusicalNugget[];
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
      "Could not load Musical:",
      error,
    );
  }

  if (!nugget) {
    notFound();
  }

  const related = nuggets
    .filter(
      (item) =>
        item.slug !==
          nugget!.slug &&
        (item.topic ===
          nugget!.topic ||
          item.book ===
            nugget!.book),
    )
    .slice(0, 3);

  const audioSrc =
    nugget.musicalAudioUrl ||
    nugget.audioUrl ||
    null;

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <MusicalView
        key={nugget.slug}
        nugget={nugget}
        related={related}
        audioSrc={audioSrc}
        coverImage={
          nugget.musicalImage ??
          "/images/musical.png"
        }
      />

      <Footer />
    </div>
  );
}