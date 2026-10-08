import { notFound, redirect } from "next/navigation";
import { getCollectionBySlug } from "@/lib/nuggets";

export default async function PlaylistDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string | string[] }>;
}) {
  const params = await searchParams;
  const slug = Array.isArray(params.slug)
    ? params.slug[0]
    : params.slug;

  if (!slug) redirect("/library?tab=Collections");

  const collection = getCollectionBySlug(slug);

  if (!collection) notFound();

  redirect(`/collection/${collection.slug}`);
}