import LibraryEmptyPage from "@/components/LibraryEmptyPage";

export default function MusicalsPage() {
  return (
    <LibraryEmptyPage
      title="Wisdom Musicals"
      description="Musical recordings and audio playback are coming soon. You can explore the written nuggets now."
      actionHref="/library"
      actionLabel="Browse written nuggets"
    />
  );
}