"use client";

import { API_URL } from "@/lib/api";
import {useState} from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import{Eye, EyeOff } from "lucide-react";
export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const[password, setPassword] = useState("");
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
    window.dispatchEvent(
    new Event("auth-change"),
    );

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

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="w-full max-w-md sm:max-w-lg bg-neutral-950 border border-gray-800 rounded-xl p-5 sm:p-8 md:p-10 shadow-lg">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-amber-300 rounded-md flex items-center justify-center font-bold text-black mb-2">
              B
            </div>

            <p className="text-amber-300 text-[10px] sm:text-xs tracking-[0.2em] uppercase mb-3 sm:mb-4 text-center">
              Business Nuggets
            </p>

            <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-serif font-semibold text-center">
              Welcome Back
            </h1>

            <p className="text-gray-400 text-xs sm:text-sm mt-2 text-center leading-relaxed max-w-sm">
              Reclaim your leadership with eternal wisdom today.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-gray-300 text-xs sm:text-sm mb-1.5"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. solomon@kingdomventures.com"
                className="w-full h-11 sm:h-12 bg-black border border-gray-700 rounded-md px-3 sm:px-4 text-sm sm:text-base text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>

            {/* Password */}
            <div>
  <label
    htmlFor="password"
    className="block text-gray-300 text-xs sm:text-sm mb-1.5"
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
      className="w-full h-11 sm:h-12 bg-black border border-gray-700 rounded-md px-3 sm:px-4 pr-11 text-sm sm:text-base text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
    />

    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-300"
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  </div>
</div>

            {/* Remember / Forgot */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm pt-1">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-amber-300 cursor-pointer flex-shrink-0"
                />
                <span>Remember me</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-amber-300 hover:text-amber-400 hover:underline transition"
              >
                Forgot Password?
              </Link>
            </div>
            
            {error && (
            <p className="text-red-400 text-sm text-center">
             {error}
            </p>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 bg-amber-300 text-black text-sm sm:text-base font-medium rounded-md hover:bg-amber-400 active:bg-amber-500 transition mt-2"
            >
             {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Register */}
          <p className="text-center text-gray-400 text-xs sm:text-sm mt-6 sm:mt-8 leading-relaxed">
            New to the platform?{" "}
            <Link
              href="/register"
              className="text-amber-300 hover:text-amber-400 hover:underline transition"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}