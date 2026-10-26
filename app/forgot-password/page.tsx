"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { API_URL } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ||
            "Could not request a password reset link.",
        );
        return;
      }

      router.push(
        `/reset-link-sent?email=${encodeURIComponent(
          normalizedEmail,
        )}`,
      );
    } catch {
      setError(
        "Could not connect to the server. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-6 sm:py-14 md:px-8 lg:px-10 lg:py-16">
        <section className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-8 md:p-10">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-[#C8A35A] font-serif text-[20px] font-bold text-[#080808]">
              B
            </div>

            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#C8A35A]">
              Business Nuggets
            </p>

            <h1 className="bn-hero-title font-serif text-[40px] font-semibold leading-tight text-[#FAF9F6]">
              Forgot Password?
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-[16px] leading-7 text-white/50">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="email"
              className="mb-2 block text-[14px] font-medium text-white/70"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="e.g. admin@kingdomventures.com"
              required
              className="h-12 w-full rounded-lg border border-white/10 bg-[#080808] px-4 text-[16px] text-[#FAF9F6] outline-none placeholder:text-[#8A8781] focus:border-[#C8A35A]"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-5 min-h-12 w-full rounded-lg bg-[#C8A35A] px-5 text-[15px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-[#B54A4A]/30 bg-[#B54A4A]/10 px-4 py-3 text-center text-[14px] leading-6 text-[#D98383]"
              >
                {error}
              </p>
            )}
          </form>

          <p className="mt-7 text-center text-[14px] leading-6 text-white/50">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              Back to Sign In
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
