import LibraryEmptyPage from "@/components/LibraryEmptyPage";

export default function FollowingPage() {
  return (
    <LibraryEmptyPage
      title="Following"
      description="You are not following any topics yet. Following topics is coming soon."
      actionHref="/library?tab=Topics+Index"
      actionLabel="Explore topics"
    />
  );
}