"use client";

import { API_URL } from "@/lib/api";
import { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-change"));

      router.push("/home");
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
        <section className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-8 md:p-10">
          <div className="mb-7 flex flex-col items-center text-center sm:mb-8">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-[#C8A35A] font-serif text-[20px] font-bold text-[#080808]">
              B
            </div>

            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#C8A35A]">
              Business Nuggets
            </p>

            <h1 className="font-serif text-[40px] font-semibold leading-tight text-[#FAF9F6]">
              Welcome Back
            </h1>

            <p className="mt-3 max-w-sm text-[16px] leading-7 text-white/50">
              Reclaim your leadership with eternal wisdom today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[14px] font-medium text-white/70"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. solomon@kingdomventures.com"
                required
                className="h-12 w-full rounded-lg border border-white/10 bg-[#080808] px-4 text-[16px] text-[#FAF9F6] outline-none placeholder:text-[#8A8781] focus:border-[#C8A35A]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[14px] font-medium text-white/70"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-12 w-full rounded-lg border border-white/10 bg-[#080808] px-4 pr-12 text-[16px] text-[#FAF9F6] outline-none placeholder:text-[#8A8781] focus:border-[#C8A35A]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-white/45 transition hover:text-[#E0C48A]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-1 text-[14px] sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-white/50">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <Link
                href="/forgot-password"
                className="inline-flex min-h-11 items-center font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
              >
                Forgot password?
              </Link>
            </div>

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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-7 text-center text-[14px] leading-6 text-white/50">
            New to the platform?{" "}
            <Link
              href="/register"
              className="font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              Create an account
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
