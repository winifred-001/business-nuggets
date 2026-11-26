import { redirect } from "next/navigation";
export default async function NuggetPlayerPage({ searchParams }: { searchParams: Promise<{ slug?: string | string[]; id?: string | string[] }> }) {
  const params = await searchParams;
  const value = params.slug ?? params.id;
  const identifier = Array.isArray(value) ? value[0] : value;
  if (!identifier) redirect("/library");
  redirect(`/nugget/${encodeURIComponent(identifier)}/audio`);
}
