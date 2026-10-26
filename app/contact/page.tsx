import Link from "next/link";
import InformationLayout from "@/components/InformationLayout";
import PageNotice from "@/components/PageNotice";
import { API_URL } from "@/lib/api";
import { getSitePage } from "@/lib/site-pages";

export const dynamic = "force-dynamic";
async function getSupportEmail(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/settings/public`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      const settings = await response.json();
      if (typeof settings.supportEmail === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.supportEmail)) return settings.supportEmail;
    }
  } catch (error) { console.error("Could not load contact details", error); }
  return null;
}
export default async function ContactPage() {
  const [document, email] = await Promise.all([getSitePage("contact"), getSupportEmail()]);
  return <InformationLayout eyebrow="Contact" title={document.title} introduction={document.introduction}>
    <PageNotice text={document.notice} />
    <div className="grid gap-6 md:grid-cols-2">
      {document.sections.map(section => <section key={section.id} className="rounded-xl border border-[#ead2a0]/20 bg-[#191b18] p-6 sm:p-8">
        <h2 className="font-serif text-[30px]!">{section.title}</h2>
        {section.id === "support" && (email ? <><p className="mt-4 break-words text-[#b4b2ab]">{email}</p><a href={`mailto:${email}`} className="bn-button mt-6 inline-flex bg-[#cda762] px-5 py-3 font-semibold text-[#17140e]">Send an email</a></> : <p role="status" className="mt-4 text-[#b4b2ab]">Contact details are temporarily unavailable. Please try again later.</p>)}
        <p className="mt-4 whitespace-pre-wrap leading-7 text-[#b4b2ab]">{section.body}</p>
        {section.id === "answers" && <Link href="/faqs" className="mt-6 inline-block text-[#ead2a0]">Read FAQs →</Link>}
      </section>)}
    </div>
    <div className="mt-8 flex flex-wrap gap-4 text-sm text-[#b4b2ab]"><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-of-use">Terms of Use</Link></div>
  </InformationLayout>;
}
