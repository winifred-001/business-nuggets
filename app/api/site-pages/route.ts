import { NextResponse } from "next/server";
import { getPublicCustomPages } from "@/lib/site-pages";

export const dynamic = "force-dynamic";

export async function GET() {
  const pages = await getPublicCustomPages();
  return NextResponse.json(pages.filter(page => page.showInNavigation), {
    headers: { "Cache-Control": "no-store" },
  });
}
