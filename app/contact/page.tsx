import Link from "next/link";
import InformationLayout from "@/components/InformationLayout";
import { API_URL } from "@/lib/api";

export const dynamic = "force-dynamic";
export default async function ContactPage() {
  let email: string | null = null;
  try {
    const response = await fetch(`${API_URL}/settings/public`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      const settings = await response.json();
      if (typeof settings.supportEmail === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.supportEmail)) email = settings.supportEmail;
    }
  } catch (error) { console.error("Could not load contact details", error); }
  return (
    <InformationLayout title="Contact Us" introduction="Questions about Business Nuggets, your account or the library? Get in touch with our support team.">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-[#ead2a0]/20 bg-[#191b18] p-6 sm:p-8">
          <h2 className="font-serif text-[30px]!">Email support</h2>
          {email ? <><p className="mt-4 break-words text-[#b4b2ab]">{email}</p><a href={`mailto:${email}`} className="mt-6 inline-flex bg-[#cda762] px-5 py-3 font-semibold text-[#17140e]">Send an email</a><p className="mt-4 text-sm text-[#b4b2ab]">This opens your email app. Include the page or feature you need help with. Never send your password or verification codes.</p></> : <p role="status" className="mt-4 text-[#b4b2ab]">Contact details are temporarily unavailable. Please try again later.</p>}
        </section>
        <section className="rounded-xl border border-[#ead2a0]/20 bg-[#191b18] p-6 sm:p-8">
          <h2 className="font-serif text-[30px]!">Find an answer</h2>
          <p className="mt-4 leading-7 text-[#b4b2ab]">Our frequently asked questions cover the library, accounts and your personal workspace.</p>
          <Link href="/faqs" className="mt-6 inline-block text-[#ead2a0]">Read FAQs →</Link>
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-[#b4b2ab]"><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-of-use">Terms of Use</Link></div>
        </section>
      </div>
    </InformationLayout>
  );
}
