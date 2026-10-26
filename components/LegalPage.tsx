import Link from "next/link";
import InformationLayout from "@/components/InformationLayout";
import { getLegalDocument, type LegalSlug } from "@/lib/legal-pages";

export default async function LegalPage({ slug }: { slug: LegalSlug }) {
  const document = await getLegalDocument(slug);
  return (
    <InformationLayout title={document.title} introduction={document.introduction}>
      {document.updatedAt && <p className="mb-6 text-sm text-[#b4b2ab]">Last updated: {new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "Africa/Lagos" }).format(new Date(document.updatedAt))}</p>}
      {document.notice && <p className="mb-8 whitespace-pre-wrap rounded-lg border border-[#cda762]/30 bg-[#cda762]/10 p-5 text-sm leading-7 text-[#ead2a0]">{document.notice}</p>}
      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="In this document" className="space-y-3">
          {document.sections.map(section => <Link key={section.id} href={`#${section.id}`} className="block text-sm leading-6 text-[#b4b2ab] hover:text-[#ead2a0]">{section.title}</Link>)}
        </nav>
        <article className="min-w-0 space-y-8">
          {document.sections.map(section => (
            <section key={section.id} id={section.id} className="scroll-mt-28 border-b border-[#ead2a0]/15 pb-8">
              <h2 className="font-serif text-[30px]! leading-tight">{section.title}</h2>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-8 text-[#b4b2ab]">{section.body}</p>
            </section>
          ))}
          <div className="flex flex-wrap gap-5 text-sm text-[#ead2a0]">
            <Link href="/contact">Contact Us</Link>
            <Link href={slug === "privacy-policy" ? "/terms-of-use" : "/privacy-policy"}>{slug === "privacy-policy" ? "Terms of Use" : "Privacy Policy"}</Link>
          </div>
        </article>
      </div>
    </InformationLayout>
  );
}
