import Link from "next/link";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

const sections = [
  {
    id: "product-scope",
    label: "Product Scope & Purpose",
  },
  {
    id: "account-access",
    label: "Account Access & Responsibility",
  },
  {
    id: "fees",
    label: "Fees & Premium Content",
  },
  {
    id: "content-rights",
    label: "Content Rights & Personal Study",
  },
  {
    id: "returns",
    label: "Returns & Account Closure",
  },
  {
    id: "processors",
    label: "Processors, Transfers & Security",
  },
  {
    id: "legal-basis",
    label: "Legal Basis, Rights & Policy Updates",
  },
];

export default function TermsOfUsePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-12 sm:px-8 lg:px-10">
        {/* BREADCRUMB */}
        <Link
          href="/"
          className="text-[12px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
        >
          ← Terms
        </Link>

        {/* HEADER */}
        <section className="mt-5">
          <h1 className="font-serif text-[40px] leading-tight">
            Terms of Use
          </h1>

          <p className="mt-2 text-[13px] text-white/40">
            Product-specific legal release draft. No effective date has
            been assigned.
          </p>
        </section>

        {/* DRAFT NOTICE */}
        <section className="mt-7 rounded-lg border border-[#C8A35A]/20 bg-[#C8A35A]/15 px-5 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
            Not an active contract yet
          </p>

          <p className="mt-2 text-[13px] leading-6 text-white/55">
            This document is currently presented as a product and legal
            draft. Final wording should be reviewed and approved before
            it is published as a binding agreement.
          </p>
        </section>

        {/* CONTENT */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* LEFT TABLE OF CONTENTS */}
          <aside>
            <div className="lg:sticky lg:top-28">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/35">
                In this draft
              </p>

              <nav className="mt-4 space-y-1">
                {sections.map((section) => (
                  <Link
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-md px-3 py-2 text-[12px] leading-5 text-white/45 transition hover:bg-white/[0.04] hover:text-[#C8A35A]"
                  >
                    {section.label}
                  </Link>
                ))}

                <Link
                  href="/privacy-policy"
                  className="mt-2 block rounded-md border border-white/10 px-3 py-2 text-[12px] text-white/55 transition hover:border-[#C8A35A]/40 hover:text-[#C8A35A]"
                >
                  Privacy Policy →
                </Link>
              </nav>
            </div>
          </aside>

          {/* TERMS BODY */}
          <article className="min-w-0">
            <TermsSection
              id="product-scope"
              title="Product Scope & Purpose"
            >
              <p>
                Business Nuggets from the Bible provides access to
                scripture-based business commentary, cinematic audio
                teachings, written studies, playlists, reading features,
                saved content and related learning tools.
              </p>

              <p>
                The platform is intended for educational and personal
                study purposes. Content is designed to support reflection
                on biblical principles and their possible application to
                modern marketplace situations.
              </p>
            </TermsSection>

            <TermsSection
              id="account-access"
              title="Account Access & Responsibility"
            >
              <p>
                Account holders are responsible for maintaining the
                confidentiality of their login credentials and for
                activities performed through their account.
              </p>

              <p>
                Users should provide accurate information when creating
                an account and must not use another person&apos;s account
                without permission.
              </p>
            </TermsSection>

            <TermsSection
              id="fees"
              title="Fees & Premium Content"
            >
              <p>
                Certain content or platform features may be offered as
                premium services. Where payment is required, applicable
                pricing and access conditions should be displayed before
                a purchase is completed.
              </p>

              <p>
                Any future subscription, billing, cancellation or refund
                rules should be clearly stated before paid services are
                activated.
              </p>
            </TermsSection>

            <TermsSection
              id="content-rights"
              title="Content Rights & Personal Study"
            >
              <p>
                Business Nuggets content, including written teachings,
                audio productions, visual assets and platform materials,
                is intended for personal study and permitted platform use.
              </p>

              <p>
                Users should not reproduce, redistribute, resell or
                republish protected platform content outside the
                permissions provided by the service or applicable law.
              </p>
            </TermsSection>

            <TermsSection
              id="returns"
              title="Returns & Account Closure — Review Required"
            >
              <p>
                Account closure, cancellation and any applicable return or
                refund process will depend on the type of service or
                purchase involved.
              </p>

              <p>
                Final eligibility requirements, timelines and procedures
                should be confirmed before this section becomes part of
                the active Terms of Use.
              </p>
            </TermsSection>

            <TermsSection
              id="processors"
              title="Processors, Transfers & Security — Review Required"
            >
              <p>
                The service may rely on hosting providers, authentication
                systems, payment providers and other technical services
                required to operate the platform.
              </p>

              <p>
                Final terms should explain applicable data-processing,
                security and international-transfer arrangements together
                with the corresponding Privacy Policy.
              </p>
            </TermsSection>

            <TermsSection
              id="legal-basis"
              title="Legal Basis, Rights & Policy Updates — Review Required"
            >
              <p>
                Final Terms of Use should identify the applicable legal
                framework, user rights, dispute procedures and the process
                used to communicate material changes to these terms.
              </p>

              <p>
                Where updates materially affect users, the platform should
                provide reasonable notice before revised terms take
                effect.
              </p>
            </TermsSection>

            {/* CONTACT */}
            <div className="mt-10 flex flex-wrap gap-3 border-t border-white/[0.07] pt-7">
              <Link
                href="/support"
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#C8A35A] px-5 text-[12px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
              >
                Contact Support
              </Link>

              <Link
                href="/privacy-policy"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/15 px-5 text-[12px] font-medium text-white/65 transition hover:border-[#C8A35A]/50 hover:text-white"
              >
                View Privacy Policy →
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function TermsSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-b border-white/[0.06] pb-8 [&+section]:pt-8"
    >
      <h2 className="font-serif text-[28px] leading-tight">
        {title}
      </h2>

      <div className="mt-4 space-y-4 text-[13px] leading-7 text-white/50">
        {children}
      </div>
    </section>
  );
}