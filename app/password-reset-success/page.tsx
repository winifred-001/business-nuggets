import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

export default function PasswordResetSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-6 sm:py-14 md:px-8 lg:px-10 lg:py-16">
        <section className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-8 md:p-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#C8A35A]/30 bg-[#C8A35A]/[0.06] text-[#C8A35A]">
            <ShieldCheck size={21} />
          </div>

          <h1 className="mt-5 font-serif text-[40px] leading-tight">
            Password Reset Complete
          </h1>

          <p className="mt-4 text-[16px] leading-7 text-white/50">
            Your password reset is complete. Return to Sign In to access your workspace with your new password.
          </p>

          <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C8A35A]">
            Confirmation state
          </p>

          <Link
            href="/login"
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-lg bg-[#C8A35A] px-5 text-[15px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
          >
            Sign In
          </Link>

          <p className="mt-6 text-[14px] leading-6 text-white/40">
            Need help accessing your account?{" "}
            <Link
              href="/support"
              className="font-medium text-white/65 transition hover:text-[#C8A35A]"
            >
              Support →
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
