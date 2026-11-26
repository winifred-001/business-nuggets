
import Link from "next/link";

import InformationLayout from "@/components/InformationLayout";
import PageNotice from "@/components/PageNotice";
import { SitePageBlock, SiteSectionExtras } from "@/components/SitePageBlock";
import { getSitePage } from "@/lib/site-pages";

export const dynamic = "force-dynamic";

export default async function FAQsPage() {
  const document = await getSitePage("faqs");
  return <InformationLayout light eyebrow="FAQs" title={document.title} introduction={document.introduction}>
    <PageNotice light text={document.notice} />
    <div className="space-y-4">
      {document.sections.map(section => <details key={section.id} className="rounded-lg border border-[#E28906]/20 bg-white p-5 sm:p-6"><summary className="cursor-pointer font-semibold text-[#79500A]">{section.title}</summary><p className="mt-4 max-w-3xl whitespace-pre-wrap leading-7 text-[#4F4941]">{section.body}</p></details>)}
    </div>
    <p className="mt-8 text-[#4F4941]">Still need help? <Link href="/contact" className="text-[#79500A] underline">Contact us</Link>.</p>
  </InformationLayout>;
}
