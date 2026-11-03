import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { API_URL } from "@/lib/api";
import { getPublishedNuggets } from "@/lib/nuggets-api";
import { getServerMemberToken } from "@/lib/server-member-token";

export const metadata = {
  title: "Shared Playlist",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

export default async function SharedPlaylistPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();

  const response = await fetch(`${API_URL}/shared-playlists/${token}`, { cache: "no-store" });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Could not load this playlist.");

  const playlist: { name: string; description: string; nuggetIds: string[] } = await response.json();
  const nuggets = await getPublishedNuggets(await getServerMemberToken());
  const byId = new Map(nuggets.map(nugget => [String(nugget.id), nugget]));
  const items = playlist.nuggetIds.flatMap(id => byId.get(id) ?? []);

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <p className="mb-3 text-sm uppercase text-[#C8A35A]">Shared Playlist</p>
        <h1 className="bn-hero-title font-serif">{playlist.name}</h1>
        {playlist.description && <p className="mt-4 whitespace-pre-wrap text-white/70">{playlist.description}</p>}
        {items.length ? (
          <ol className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {items.map(nugget => (
              <li key={nugget.id} className="py-4">
                <Link className="text-[#C8A35A] hover:underline" href={`/nugget/${nugget.slug}`}>{nugget.title}</Link>
                <p className="mt-1 text-sm text-white/60">{nugget.scriptureRef}</p>
              </li>
            ))}
          </ol>
        ) : <p className="mt-8 text-white/60">No available Nuggets in this playlist yet.</p>}
      </main>
      <Footer />
    </div>
  );
}
