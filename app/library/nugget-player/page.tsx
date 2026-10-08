import { notFound, redirect } from "next/navigation";
import { getNuggetBySlug } from "@/lib/nuggets";

export default async function NuggetPlayerPage({
  searchParams,
}: {
  searchParams: Promise<{
    slug?: string | string[];
    id?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const value = params.slug ?? params.id;
  const identifier = Array.isArray(value) ? value[0] : value;

  if (!identifier) redirect("/library");

  const nugget = getNuggetBySlug(identifier);

  if (!nugget) notFound();

  redirect(`/nugget/${nugget.slug}`);
}