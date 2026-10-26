import Link from "next/link";
import InformationLayout from "@/components/InformationLayout";
import PageNotice from "@/components/PageNotice";
import { getSitePage } from "@/lib/site-pages";

export const dynamic = "force-dynamic";
export default async function FAQsPage() {
  const document = await getSitePage("faqs");
  return <InformationLayout eyebrow="FAQs" title={document.title} introduction={document.introduction}>
    <PageNotice text={document.notice} />
    <div className="space-y-4">
      {document.sections.map(section => <details key={section.id} className="rounded-lg border border-[#ead2a0]/20 bg-[#191b18] p-5 sm:p-6"><summary className="cursor-pointer font-semibold text-[#ead2a0]">{section.title}</summary><p className="mt-4 max-w-3xl whitespace-pre-wrap leading-7 text-[#b4b2ab]">{section.body}</p></details>)}
    </div>
    <p className="mt-8 text-[#b4b2ab]">Still need help? <Link href="/contact" className="text-[#ead2a0] underline">Contact us</Link>.</p>
  </InformationLayout>;
}
