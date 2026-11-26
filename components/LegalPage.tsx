import Link from "next/link";
import InformationLayout from "@/components/InformationLayout";
import { SitePageBlock, SiteSectionExtras } from "@/components/SitePageBlock";
import { getLegalDocument, type LegalSlug } from "@/lib/legal-pages";

export default async function LegalPage({ slug }: { slug: LegalSlug }) {
  const document = await getLegalDocument(slug);
  return (
    <InformationLayout light title={document.title} introduction={document.introduction}>
      {document.updatedAt && <p className="mb-6 text-sm text-[#4F4941]">Last updated: {new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "Africa/Lagos" }).format(new Date(document.updatedAt))}</p>}
      {document.notice && <p className="mb-8 whitespace-pre-wrap rounded-lg border border-[#E28906]/30 bg-[#E28906]/10 p-5 text-sm leading-7 text-[#79500A]">{document.notice}</p>}
      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="In this document" className="space-y-3">
          {document.sections.map(section => <Link key={section.id} href={`#${section.id}`} className="block text-sm leading-6 text-[#4F4941] hover:text-[#79500A]">{section.title}</Link>)}
        </nav>
        <article className="min-w-0 space-y-8">
          {document.sections.map(section => section.kind && section.kind !== "text" ? (
            <SitePageBlock light key={section.id} section={section} />
          ) : (
            <section key={section.id} id={section.id} className="scroll-mt-28 border-b border-[#E28906]/15 pb-8">
              <h2 className="font-serif text-[30px]! leading-tight">{section.title}</h2>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-8 text-[#4F4941]">{section.body}</p><SiteSectionExtras section={section} />
            </section>
          ))}
          <div className="flex flex-wrap gap-5 text-sm text-[#79500A]">
            <Link href="/contact">Contact Us</Link>
            <Link href={slug === "privacy-policy" ? "/terms-of-use" : "/privacy-policy"}>{slug === "privacy-policy" ? "Terms of Use" : "Privacy Policy"}</Link>
          </div>
        </article>
      </div>
    </InformationLayout>
  );
}
