import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InformationLayout from "@/components/InformationLayout";
import { SitePageBlock } from "@/components/SitePageBlock";
import PageNotice from "@/components/PageNotice";
import { getCustomSitePage } from "@/lib/site-pages";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCustomSitePage(slug);
  return page
    ? { title: page.title + " | Business Nuggets", description: page.metaDescription || page.introduction }
    : { title: "Page not found" };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getCustomSitePage(slug);
  if (!page) notFound();

  return (
    <InformationLayout light title={page.title} introduction={page.introduction}>
      <PageNotice light text={page.notice} />
      <div className="grid gap-6 md:grid-cols-2">
        {page.sections.map(section => (
          <div key={section.id} className={section.width === "half" ? "" : "md:col-span-2"}>
            <SitePageBlock light section={section} />
          </div>
        ))}
      </div>
    </InformationLayout>
  );
}
