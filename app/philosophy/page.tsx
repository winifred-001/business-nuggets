import Link from "next/link";
import InformationLayout from "@/components/InformationLayout";
import PageNotice from "@/components/PageNotice";
import { SitePageBlock, SiteSectionExtras } from "@/components/SitePageBlock";
import { getSitePage } from "@/lib/site-pages";

export const dynamic = "force-dynamic";
export default async function PhilosophyPage() {
  const document = await getSitePage("about");
  return <InformationLayout light eyebrow="About" title={document.title} introduction={document.introduction}>
    <PageNotice light text={document.notice} />
    <div className="grid gap-6 md:grid-cols-3">
      {document.sections.map(section => {
        if (section.kind && section.kind !== "text") return <div key={section.id} className="md:col-span-3"><SitePageBlock light section={section} /></div>;
        const isPrinciple = section.id.startsWith("principle-");
        if (section.id === "scripture") return <section key={section.id} className="rounded-[10px] border border-[#E28906]/45 bg-[#111111] text-[#f9f5ed] px-6 py-6 md:col-span-3 sm:px-7"><blockquote className="whitespace-pre-wrap font-serif text-[20px] italic leading-7 text-white/85">{section.body}</blockquote><p className="mt-4 text-[11px] uppercase tracking-[0.08em] text-[#E28906]">{section.title}</p><SiteSectionExtras section={section} /></section>;
        return <section key={section.id} className={section.width === "full" ? "md:col-span-3" : section.width === "half" ? "md:col-span-2" : isPrinciple ? "rounded-[10px] border border-black/15 bg-white p-5" : "md:col-span-3"}>
          <h2 className="font-serif text-[30px]! leading-tight">{section.title}</h2>
          <p className="mt-4 max-w-[850px] whitespace-pre-wrap text-[15px] leading-7 text-[#4F4941]">{section.body}</p><SiteSectionExtras section={section} />
        </section>;
      })}
    </div>
    <div className="mt-8 flex flex-wrap gap-4 text-sm">
      <Link href="/library" className="bn-button inline-flex bg-[#E28906] px-5 py-3 font-semibold text-black">Explore the Wisdom Archive</Link>
      <Link href="/library?tab=Scripture+Matrix" className="bn-button inline-flex items-center border border-black/20 px-5 py-3 text-[#79500A]">Browse Scripture Index</Link>
    </div>
  </InformationLayout>;
}
