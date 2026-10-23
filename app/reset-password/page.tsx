"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { API_URL } from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [tokenReady, setTokenReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search,
    );

    setToken(params.get("token") || "");
    setTokenReady(true);
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!token) {
      setError(
        "This password reset link is missing or invalid. Request a new one.",
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Your new password must be at least 8 characters.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            newPassword,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ||
            "Could not reset your password. The link may have expired.",
        );
        return;
      }

      router.replace(
        "/password-reset-success",
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

      <main className="flex flex-1 items-start justify-center px-5 py-16 sm:py-20">
        <section className="w-full max-w-[430px] rounded-[10px] border border-white/10 bg-[#111111] p-6 sm:p-8">
          <h1 className="font-serif text-[28px] leading-tight">
            Reset Password
          </h1>

          <p className="mt-4 text-[11px] leading-5 text-white/40">
            Choose a new password for your Business Nuggets account.
          </p>

          {tokenReady && !token ? (
            <div className="mt-6">
              <p
                role="alert"
                className="text-[11px] leading-5 text-red-300"
              >
                This reset link is missing its token or is no longer valid.
              </p>

              <Link
                href="/forgot-password"
                className="mt-5 flex min-h-10 w-full items-center justify-center rounded-md bg-[#C8A35A] px-4 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
              >
                Request a New Link
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-6"
            >
              <label
                htmlFor="new-password"
                className="mb-2 block text-[11px] font-medium text-white/70"
              >
                New Password
              </label>

              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setError("");
                }}
                minLength={8}
                required
                className="w-full rounded-md border border-[#292929] bg-[#1B1B1F] px-3 py-2.5 text-xs text-white outline-none focus:border-[#C8A35A]"
              />

              <label
                htmlFor="confirm-password"
                className="mb-2 mt-4 block text-[11px] font-medium text-white/70"
              >
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
                minLength={8}
                required
                className="w-full rounded-md border border-[#292929] bg-[#1B1B1F] px-3 py-2.5 text-xs text-white outline-none focus:border-[#C8A35A]"
              />

              {error && (
                <p
                  role="alert"
                  className="mt-4 text-[11px] leading-5 text-red-300"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !tokenReady}
                className="mt-5 flex min-h-10 w-full items-center justify-center rounded-md bg-[#C8A35A] px-4 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Resetting..."
                  : "Reset Password"}
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-4 flex min-h-10 w-full items-center justify-center rounded-md border border-white/10 bg-[#080808] text-[11px] text-white/60 transition hover:text-white"
          >
            Back to Sign In
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
