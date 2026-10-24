import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

export default function PremiumNuggetGate() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8 lg:px-10">
        <section className="w-full max-w-[620px] rounded-2xl border border-[#C8A35A]/35 bg-[#111111] p-6 text-center sm:p-9">
          <span className="inline-flex rounded-full border border-[#C8A35A]/50 bg-[#C8A35A]/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#E0C48A]">
            Gold
          </span>

          <h1 className="mt-5 font-serif text-[34px] leading-tight text-[#FAF9F6] sm:text-[40px]">
            Unlock Business Nuggets Gold
          </h1>

          <p className="mx-auto mt-4 max-w-[500px] text-[16px] leading-7 text-white/55">
            This Nugget is part of the Premium library. Upgrade once to unlock the full Wisdom Archive, including Gold Nuggets, Reader, audio and related premium content.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/membership"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#C8A35A] px-6 text-[15px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
            >
              Upgrade to Premium
            </Link>

            <Link
              href="/library"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/12 px-6 text-[14px] font-medium text-white/65 transition hover:border-[#C8A35A]/40 hover:text-[#E0C48A]"
            >
              Return to Library
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
