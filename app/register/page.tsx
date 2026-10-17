"use client";

import { API_URL } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

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
      const response = await fetch(`${API_URL}/auth/register`, {
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

      const data = await response.json();

      if (!response.ok) {
        setError(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Registration failed"
        );
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/home");
    } catch {
      setError("Could not connect to the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-sm sm:max-w-md bg-neutral-950 border border-gray-800 rounded-xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-white text-xl sm:text-2xl font-serif font-semibold">
              Create Your Account
            </h1>

            <p className="text-gray-400 text-sm mt-1">
              Join a global network of purpose-driven marketplace executives.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nehemiah Vance"
                required
                className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-600 text-sm sm:text-base focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. builder@jerusalemcorp.org"
                required
                className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-600 text-sm sm:text-base focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                required
                minLength={6}
                className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-600 text-sm sm:text-base focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-600 text-sm sm:text-base focus:outline-none focus:border-amber-500"
              />
            </div>

            <label className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="accent-amber-500 mt-1 flex-shrink-0"
              />
              I agree to the Terms of Service and Privacy Policy.
            </label>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-300 text-black font-medium py-2.5 sm:py-2 rounded-md hover:bg-amber-400 active:bg-amber-500 transition disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-amber-300 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}