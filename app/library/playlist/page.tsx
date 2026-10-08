import LibraryEmptyPage from "@/components/LibraryEmptyPage";

export default function PlaylistsPage() {
  return (
    <LibraryEmptyPage
      title="My Playlists"
      description="No personal playlists yet. Playlist creation is coming soon."
      actionHref="/library?tab=Collections"
      actionLabel="Explore sample collections"
    />
  );
}