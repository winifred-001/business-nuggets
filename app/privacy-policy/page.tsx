import Link from "next/link";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

const sections = [
  {
    id: "information",
    title: "Information We Collect",
  },
  {
    id: "use",
    title: "How We Use Information",
  },
  {
    id: "workspace",
    title: "Workspace & Personal Content",
  },
  {
    id: "device",
    title: "Device & Local Storage",
  },
  {
    id: "sharing",
    title: "Service Providers & Sharing",
  },
  {
    id: "retention",
    title: "Data Retention & Account Deletion",
  },
  {
    id: "security",
    title: "Security",
  },
  {
    id: "rights",
    title: "Your Choices & Rights",
  },
  {
    id: "updates",
    title: "Privacy Policy Updates",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-10">
        {/* BREADCRUMB */}
        <Link
          href="/"
          className="text-[12px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
        >
          ← Home
        </Link>

        {/* HEADER */}
        <section className="mt-5 border-b border-white/[0.07] pb-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C8A35A]">
            Legal
          </p>

          <h1 className="mt-3 font-serif text-[40px] leading-tight">
            Privacy Policy
          </h1>

          <p className="mt-3 max-w-[720px] text-[13px] leading-6 text-white/40">
            This Privacy Policy explains how Business Nuggets from the
            Bible may collect, use, store and protect information when
            you use the platform and your personal workspace.
          </p>

          <p className="mt-3 text-[11px] text-white/25">
            Last updated: October 2026
          </p>
        </section>

        {/* CONTENT */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* INDEX */}
          <aside>
            <div className="lg:sticky lg:top-28">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/30">
                In this document
              </p>

              <nav className="mt-4 space-y-1">
                {sections.map((section) => (
                  <Link
                    key={section.id}
                    href={`#${section.id}`}
                    className="block border-l border-white/10 px-3 py-2 text-[11px] leading-5 text-white/40 transition hover:border-[#C8A35A] hover:text-[#C8A35A]"
                  >
                    {section.title}
                  </Link>
                ))}
              </nav>

              <Link
                href="/terms-of-use"
                className="mt-5 inline-block text-[11px] text-[#C8A35A]"
              >
                Terms of Use →
              </Link>
            </div>
          </aside>

          {/* POLICY */}
          <article className="min-w-0">
            <PrivacySection
              id="information"
              number="01"
              title="Information We Collect"
            >
              <p>
                When you create an account, Business Nuggets may collect
                information such as your name, email address and account
                credentials.
              </p>

              <p>
                When you use your workspace, additional information may
                be associated with your account, including saved Nuggets,
                playlists, notes, followed topics, reading or listening
                history and progress.
              </p>

              <p>
                We may also receive technical information necessary to
                operate the service, such as browser information, device
                type and basic service activity.
              </p>
            </PrivacySection>

            <PrivacySection
              id="use"
              number="02"
              title="How We Use Information"
            >
              <p>
                Information may be used to provide and maintain your
                Business Nuggets account, load your personal workspace and
                make saved content available when you return.
              </p>

              <p>
                We may also use information to improve platform
                reliability, provide customer support, protect accounts
                from unauthorized access and communicate important
                service or account updates.
              </p>

              <p>
                Where optional personalization features are available,
                your selected interests, followed topics and activity may
                be used to help organize or personalize your experience.
              </p>
            </PrivacySection>

            <PrivacySection
              id="workspace"
              number="03"
              title="Workspace & Personal Content"
            >
              <p>
                Your workspace may contain personal information you
                choose to create or save, including journal entries,
                notes, playlists and saved Nuggets.
              </p>

              <p>
                These features are intended to support your personal
                study and organization. You should avoid entering highly
                sensitive information that is not necessary for your use
                of the platform.
              </p>

              <p>
                Workspace content may remain associated with your account
                until you delete the relevant content or permanently
                delete your account, subject to any required technical or
                legal retention periods.
              </p>
            </PrivacySection>

            <PrivacySection
              id="device"
              number="04"
              title="Device & Local Storage"
            >
              <p>
                Business Nuggets may use browser storage to remember
                information needed for your experience, such as your
                signed-in session and selected application preferences.
              </p>

              <p>
                Some interface preferences may be stored directly on the
                device you are using. This can include settings such as
                playback preferences, download preferences and
                notification choices.
              </p>

              <p>
                Removing browser storage, signing out or using another
                device may cause some locally stored preferences to be
                reset.
              </p>
            </PrivacySection>

            <PrivacySection
              id="sharing"
              number="05"
              title="Service Providers & Sharing"
            >
              <p>
                Business Nuggets may rely on third-party technology
                providers to operate parts of the service, including
                hosting, authentication, communications, storage and
                payment processing where applicable.
              </p>

              <p>
                Information should only be shared with service providers
                to the extent reasonably necessary for them to provide
                their services or where disclosure is required by law.
              </p>

              <p>
                Business Nuggets does not grant other users access to
                your private account workspace simply because they also
                use the platform.
              </p>
            </PrivacySection>

            <PrivacySection
              id="retention"
              number="06"
              title="Data Retention & Account Deletion"
            >
              <p>
                Account information may be retained while your account is
                active and for a reasonable period afterward where
                necessary for security, legal, operational or dispute
                purposes.
              </p>

              <p>
                Where account deletion is available, deleting your
                account may permanently remove associated workspace data
                such as saved Nuggets, playlists, notes, history and
                followed topics.
              </p>

              <p>
                You should use the Data Export feature before deleting
                your account if you want to keep a personal copy of
                eligible workspace information.
              </p>
            </PrivacySection>

            <PrivacySection
              id="security"
              number="07"
              title="Security"
            >
              <p>
                Business Nuggets may use technical and organizational
                safeguards intended to protect account and workspace
                information against unauthorized access, loss or misuse.
              </p>

              <p>
                Account passwords should be protected and should not be
                shared with other people. Users should also sign out when
                using a shared or public device.
              </p>

              <p>
                No internet-based service can guarantee complete security,
                but reasonable steps should be taken to reduce foreseeable
                risks.
              </p>
            </PrivacySection>

            <PrivacySection
              id="rights"
              number="08"
              title="Your Choices & Rights"
            >
              <p>
                Depending on the features available to your account, you
                may be able to review or update your profile information,
                change your password, manage notification preferences and
                unfollow topics through Account &amp; Workspace Settings.
              </p>

              <p>
                You may also be able to export eligible workspace data or
                request permanent account deletion through the settings
                area.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/library/account"
                  className="rounded-md border border-white/10 px-4 py-2.5 text-[11px] text-white/60 transition hover:border-[#C8A35A]/50 hover:text-[#C8A35A]"
                >
                  Account Settings
                </Link>
              </div>
            </PrivacySection>

            <PrivacySection
              id="updates"
              number="09"
              title="Privacy Policy Updates"
            >
              <p>
                This Privacy Policy may be updated as Business Nuggets
                introduces new features, changes service providers or
                responds to legal and operational requirements.
              </p>

              <p>
                The updated date displayed at the top of this page should
                indicate when material changes were last made.
              </p>

              <p>
                Where appropriate, important privacy changes may also be
                communicated through the platform or another available
                communication channel.
              </p>
            </PrivacySection>

            {/* CONTACT */}
            <section className="mt-9 rounded-lg border border-[#C8A35A]/30 bg-[#C8A35A]/[0.06] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                Privacy Questions
              </p>

              <p className="mt-2 max-w-[650px] text-[12px] leading-6 text-white/45">
                If you have questions about your information, account
                privacy or deletion of your data, contact Business Nuggets
                support.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/support"
                  className="rounded-md bg-[#C8A35A] px-4 py-2.5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                >
                  Contact Support
                </Link>

                <Link
                  href="/terms-of-use"
                  className="rounded-md border border-white/10 px-4 py-2.5 text-[11px] text-white/60 transition hover:border-[#C8A35A]/50 hover:text-[#C8A35A]"
                >
                  Terms of Use
                </Link>
              </div>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function PrivacySection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-b border-white/[0.07] py-8 first:pt-0"
    >
      <div className="flex gap-4">
        <span className="pt-1 font-serif text-[13px] text-[#C8A35A]">
          {number}
        </span>

        <div className="min-w-0">
          <h2 className="font-serif text-[28px] leading-tight">
            {title}
          </h2>

          <div className="mt-4 space-y-4 text-[13px] leading-7 text-white/45">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}