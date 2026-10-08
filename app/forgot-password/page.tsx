
"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) return;

    setSubmitted(true);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080808]">
      <Navbar />

      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:py-10">
        <div className="w-full max-w-md rounded-lg border border-[#222222] bg-[#111111] p-5 sm:p-8">
          {/* Brand */}
          <div className="mb-5 flex justify-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#C8A35A] font-Inter text-sm font-bold text-black">
                B
              </div>

              <div>
                <p className="font-Inter text-xs font-extrabold leading-none text-white">
                  BUSINESS NUGGETS
                </p>
                <p className="font-EB_Garamond text-[10px] italic tracking-wide text-[#C8A35A]">
                  from the Bible
                </p>
              </div>
            </Link>
          </div>

          {/* Heading */}
          <h1 className="text-center font-EB_Garamond text-2xl font-semibold text-white">
            Forgot Password?
          </h1>

          <p className="mx-auto mt-2 max-w-xs text-center font-Inter text-xs leading-relaxed text-gray-400">
            Enter your email address and we&apos;ll send you a link to reset your
            password.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6">
            <label
              htmlFor="email"
              className="mb-2 block font-Inter text-xs font-medium text-gray-200"
            >
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSubmitted(false);
              }}
              placeholder="e.g. admon@kingdomventures.com"
              required
              className="w-full rounded-md border border-[#292929] bg-[#1B1B1F] px-3 py-2 font-Inter text-xs text-white outline-none placeholder:text-gray-500 focus:border-[#C8A35A]"
            />

            <button
              type="submit"
              className="mt-4 w-full rounded-md bg-[#C8A35A] px-4 py-2.5 font-Inter text-xs font-semibold text-black transition hover:bg-[#D5B36C]"
            >
              Send Reset Link
            </button>

            {submitted && (
              <p
                role="status"
                className="mt-3 text-center font-Inter text-xs leading-relaxed text-[#C8A35A]"
              >
                Form submitted. Connect your authentication service to send the
                password reset email.
              </p>
            )}
          </form>

          {/* Back to login */}
          <p className="mt-5 text-center font-Inter text-xs text-gray-400">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-[#C8A35A] transition hover:text-[#D5B36C]"
            >
              Back to Sign In
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}