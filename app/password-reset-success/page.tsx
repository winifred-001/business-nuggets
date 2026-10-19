import Link from "next/link";

import {
  ShieldCheck,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

export default function PasswordResetSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="flex flex-1 items-start justify-center px-5 py-16 sm:py-20">
        <section className="w-full max-w-[430px] rounded-[10px] border border-white/10 bg-[#111111] p-6 sm:p-8">
          <h1 className="font-serif text-[28px] leading-tight">
            Password Reset Complete
          </h1>

          <p className="mt-4 text-[11px] leading-5 text-white/40">
            Your password reset is
            complete. Return to Sign
            In to access your
            workspace with your new
            password.
          </p>

          <div className="mt-6 flex h-10 w-10 items-center justify-center rounded-md border border-[#C8A35A]/30 bg-[#C8A35A]/[0.05] text-[#C8A35A]">
            <ShieldCheck
              size={18}
            />
          </div>

          <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
            Confirmation State
          </p>

          <Link
            href="/login"
            className="mt-5 flex min-h-10 w-full items-center justify-center rounded-md bg-[#C8A35A] px-4 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
          >
            Sign In
          </Link>

          <p className="mt-5 text-[10px] leading-5 text-white/30">
            Need help accessing
            your account?{" "}
            <Link
              href="/support"
              className="text-white/55 transition hover:text-[#C8A35A]"
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