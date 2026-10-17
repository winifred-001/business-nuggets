import { notFound } from "next/navigation";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import MusicalView from "@/components/MusicalView";

import {
  getNuggetBySlugFromApi,
  getPublishedNuggets,
} from "@/lib/nuggets-api";

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

  let nugget: MusicalNugget | null =
    null;

  let nuggets: MusicalNugget[] = [];

  try {
    const [current, all] =
      await Promise.all([
        getNuggetBySlugFromApi(id),
        getPublishedNuggets(),
      ]);

    nugget =
      current as MusicalNugget;

    nuggets =
      all as MusicalNugget[];
  } catch (error) {
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
    nugget.musicalAudioUrl ??
    nugget.audioUrl ??
    null;

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <MusicalView
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