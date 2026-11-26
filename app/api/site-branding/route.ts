import { loadSiteBranding } from "@/lib/site-branding";
export async function GET() { return Response.json(await loadSiteBranding()); }
