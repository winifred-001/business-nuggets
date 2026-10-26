"use client";

import PasswordInput from "@/components/PasswordInput";
import { postAuthDestination } from "@/lib/auth-return";
import AuthContinueLink from "@/components/AuthContinueLink";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/member/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Registration failed",
        );
        return;
      }

      if (!data.token || !data.user) {
        setError("The server did not return a complete member session.");
        return;
      }

      // This is a harmless session marker, not the real JWT.
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-change"));
      router.push(postAuthDestination());
    } catch {
      setError("Could not connect to the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-6 sm:py-14 md:px-8 lg:px-10 lg:py-16">
        <section className="w-full max-w-[560px] rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-8 md:p-10">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-[#C8A35A] font-serif text-[20px] font-bold text-[#080808]">
              B
            </div>

            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#C8A35A]">
              Business Nuggets
            </p>

            <h1 className="bn-hero-title font-serif text-[45px]! font-semibold leading-tight text-[#FAF9F6]">
              Create Your Account
            </h1>

            <p className="mx-auto mt-3 max-w-md text-[16px] leading-7 text-white/50">
              Join a global network of purpose-driven marketplace leaders.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-[14px] font-medium text-white/70">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nehemiah Vance"
                required
                autoComplete="name"
                className="h-12 w-full rounded-lg border border-white/10 bg-[#080808] px-4 text-[16px] text-[#FAF9F6] outline-none placeholder:text-[#8A8781] focus:border-[#C8A35A]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-medium text-white/70">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. builder@jerusalemcorp.org"
                required
                autoComplete="email"
                className="h-12 w-full rounded-lg border border-white/10 bg-[#080808] px-4 text-[16px] text-[#FAF9F6] outline-none placeholder:text-[#8A8781] focus:border-[#C8A35A]"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[14px] font-medium text-white/70">
                  Password
                </label>
                <PasswordInput
                  visibilityLabel="password" aria-label="Password"

                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Secure password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-12 w-full rounded-lg border border-white/10 bg-[#080808] px-4 text-[16px] text-[#FAF9F6] outline-none placeholder:text-[#8A8781] focus:border-[#C8A35A]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-medium text-white/70">
                  Confirm password
                </label>
                <PasswordInput
                  visibilityLabel="confirm password" aria-label="Confirm password"

                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-12 w-full rounded-lg border border-white/10 bg-[#080808] px-4 text-[16px] text-[#FAF9F6] outline-none placeholder:text-[#8A8781] focus:border-[#C8A35A]"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-6 text-white/50">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <span>
                I agree to the Terms of Service and Privacy Policy.
              </span>
            </label>

            {error && (
              <p className="rounded-lg border border-[#B54A4A]/30 bg-[#B54A4A]/10 px-4 py-3 text-center text-[14px] text-[#D98383]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="min-h-12 w-full rounded-lg bg-[#C8A35A] px-5 text-[15px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-7 text-center text-[14px] leading-6 text-white/50">
            Already have an account?{" "}
            <AuthContinueLink
              href="/login"
              className="font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              Sign in
            </AuthContinueLink>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
