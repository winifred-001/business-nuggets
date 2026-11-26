import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

export default function PremiumNuggetGate({ reader = false, previewLimit = false, guest = false, backHref = "/library" }: { reader?: boolean; previewLimit?: boolean; guest?: boolean; backHref?: string } = {}) {
  return (
    <div className="flex min-h-screen flex-col bn-cream-page bg-[#F5F0E8] text-[#211E19]">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8 lg:px-10">
        <section className="w-full max-w-[620px] rounded-2xl border border-[#E28906]/35 bg-[#111111] p-6 text-center sm:p-9">
          <span className="inline-flex rounded-full border border-[#E28906]/50 bg-[#E28906]/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#E28906]">
            {reader || previewLimit ? "Premium membership" : "Gold"}
          </span>

          <h1 className="bn-hero-title mt-5 font-serif text-[34px] leading-tight text-[#FAF9F6] sm:text-[40px]">
            {reader ? "Unlock the full teaching" : previewLimit ? "Unlock more Nuggets" : "Unlock Business Nuggets Gold"}
          </h1>

          <p className="mx-auto mt-4 max-w-[500px] text-[16px] leading-7 text-white/55">
            {reader ? "You have explored the preview. Sign up for Premium to continue reading the full teaching, including practical insights and biblical business wisdom." : previewLimit ? "Sign up for Premium to open this Nugget and explore more biblical business wisdom." : "This Nugget is part of the Premium library. Upgrade once to unlock the full Wisdom Archive, including Gold Nuggets, Reader, audio and related premium content."}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={(reader || previewLimit) && guest ? "/register?next=%2Fmembership" : "/membership"}
              className="bn-button inline-flex min-h-12 items-center justify-center rounded-lg bg-[#E28906] px-6 text-[15px] font-semibold text-[#080808] transition hover:bg-[#E28906]"
            >
              {reader || previewLimit ? "Sign up for Premium" : "Upgrade to Premium"}
            </Link>

            <Link
              href={backHref}
              className="bn-button inline-flex min-h-12 items-center justify-center rounded-lg border border-white/12 px-6 text-[14px] font-medium text-white/65 transition hover:border-[#E28906]/40 hover:text-[#E28906]"
            >
              {reader ? "Back to Nugget preview" : "Return to Library"}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
