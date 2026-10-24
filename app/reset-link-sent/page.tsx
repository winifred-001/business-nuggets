"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { API_URL } from "@/lib/api";

export default function ResetLinkSentPage() {
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") || "");
  }, []);

  async function resendLink() {
    if (!email) return;

    setResending(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.message || "Could not resend reset link.");
        return;
      }

      setMessage("A new reset link has been prepared.");
    } catch {
      setMessage("Could not connect to the server.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-6 sm:py-14 md:px-8 lg:px-10 lg:py-16">
        <section className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-8 md:p-10">
          <h1 className="font-serif text-[40px] leading-tight">
            Check Your Inbox
          </h1>

          <p className="mt-4 text-[16px] leading-7 text-white/50">
            If an account is associated with this email, a password reset link will be sent to:
          </p>

          <div className="mt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#C8A35A]/25 bg-[#C8A35A]/[0.06] text-[#C8A35A]">
              <Mail size={20} />
            </div>

            <p className="mt-4 break-all text-[14px] font-medium leading-6 text-[#C8A35A]">
              {email || "Your email address"}
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-[#C8A35A]/25 bg-[#C8A35A]/[0.08] p-4 sm:p-5">
            <p className="text-[14px] font-semibold text-[#E0C48A]">
              Didn&apos;t find the email?
            </p>

            <p className="mt-2 text-[14px] leading-6 text-white/45">
              Check your spam folder and make sure the email address is correct before requesting another link.
            </p>
          </div>

          {message && (
            <p className="mt-4 text-[14px] leading-6 text-[#E0C48A]">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={resendLink}
            disabled={resending || !email}
            className="mt-6 min-h-12 w-full rounded-lg bg-[#C8A35A] px-5 text-[15px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:opacity-40"
          >
            {resending ? "Resending..." : "Resend Reset Link"}
          </button>

          <Link
            href="/login"
            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-lg border border-white/10 bg-[#080808] px-4 text-[14px] font-medium text-white/65 transition hover:border-[#C8A35A]/35 hover:text-[#E0C48A]"
          >
            Back to Sign In
          </Link>

          <p className="mt-6 text-center text-[14px] leading-6 text-white/40">
            Use a different email?{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-white/70 transition hover:text-[#C8A35A]"
            >
              Forgot Password
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
