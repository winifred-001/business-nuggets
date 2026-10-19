"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
} from "lucide-react";

import { API_URL } from "@/lib/api";

type LoginResponse = {
  message?: string;

  token?: string;

  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
};

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    keepSignedIn,
    setKeepSignedIn,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =========================================
     REDIRECT ALREADY AUTHENTICATED ADMIN
  ========================================= */

  useEffect(() => {
    async function checkExistingAdmin() {
      const token =
        localStorage.getItem(
          "adminToken",
        ) ||
        sessionStorage.getItem(
          "adminToken",
        );

      if (!token) return;

      try {
        const response =
          await fetch(
            `${API_URL}/admin/test`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (response.ok) {
          router.replace(
            "/admin/dashboard",
          );
        }
      } catch {
        // Stay on login page.
      }
    }

    checkExistingAdmin();
  }, [router]);

  /* =========================================
     LOGIN
  ========================================= */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !email.trim() ||
      !password
    ) {
      setError(
        "Enter your admin email and password.",
      );

      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email:
                email
                  .trim()
                  .toLowerCase(),

              password,
            }),
          },
        );

      const data: LoginResponse =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        !data.token ||
        !data.user
      ) {
        setError(
          data.message ||
            "Invalid email or password.",
        );

        return;
      }

      /* =====================================
         ROLE CHECK
      ===================================== */

      if (
        data.user.role !== "admin"
      ) {
        setError(
          "This account does not have Admin Console access.",
        );

        return;
      }

      /* =====================================
         VERIFY ADMIN GUARD
      ===================================== */

      const verifyResponse =
        await fetch(
          `${API_URL}/admin/test`,
          {
            headers: {
              Authorization:
                `Bearer ${data.token}`,
            },
          },
        );

      if (!verifyResponse.ok) {
        setError(
          "Admin access could not be verified.",
        );

        return;
      }

      /* =====================================
         STORE ADMIN SESSION
      ===================================== */

      const adminUser =
        JSON.stringify(
          data.user,
        );

      if (keepSignedIn) {
        localStorage.setItem(
          "adminToken",
          data.token,
        );

        localStorage.setItem(
          "adminUser",
          adminUser,
        );

        sessionStorage.removeItem(
          "adminToken",
        );

        sessionStorage.removeItem(
          "adminUser",
        );
      } else {
        sessionStorage.setItem(
          "adminToken",
          data.token,
        );

        sessionStorage.setItem(
          "adminUser",
          adminUser,
        );

        localStorage.removeItem(
          "adminToken",
        );

        localStorage.removeItem(
          "adminUser",
        );
      }

      router.replace(
        "/admin/dashboard",
      );
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      {/* =====================================
          ADMIN HEADER
      ===================================== */}

      <header className="border-b border-white/[0.07] bg-[#111111]">
        <div className="flex h-[72px] items-center px-6 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#C8A35A] font-serif text-[14px] font-bold text-[#080808]">
              B
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-white">
                Business Nuggets
              </p>

              <p className="mt-0.5 text-[8px] text-[#C8A35A]">
                Admin Console
              </p>
            </div>
          </Link>
        </div>
      </header>

      {/* =====================================
          LOGIN AREA
      ===================================== */}

      <main className="flex min-h-[calc(100vh-72px)] items-start justify-center px-5 py-16 sm:py-20">
        <section className="w-full max-w-[440px] rounded-[10px] border border-white/10 bg-[#111111] p-6 sm:p-8">
          {/* MARK */}

          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-[#C8A35A] font-serif text-[18px] font-semibold text-[#080808]">
            B
          </div>

          {/* HEADING */}

          <div className="mt-5 text-center">
            <h1 className="font-serif text-[28px] leading-tight">
              Admin Sign In
            </h1>

            <p className="mt-2 text-[11px] text-white/35">
              Authorised administrators only
            </p>
          </div>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="mt-7"
          >
            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[9px] font-medium text-white/45"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value,
                  );

                  setError("");
                }}
                placeholder="admin@businessnuggets.com"
                className="h-11 w-full rounded-md border border-white/10 bg-[#0D0D0D] px-4 text-[11px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/50"
              />
            </div>

            {/* PASSWORD */}

            <div className="mt-4">
              <label
                htmlFor="password"
                className="mb-2 block text-[9px] font-medium text-white/45"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  value={password}
                  onChange={(
                    event,
                  ) => {
                    setPassword(
                      event
                        .target
                        .value,
                    );

                    setError("");
                  }}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-md border border-white/10 bg-[#0D0D0D] px-4 pr-11 text-[11px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }
                  aria-label="Toggle password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition hover:text-white/60"
                >
                  {showPassword ? (
                    <EyeOff
                      size={15}
                    />
                  ) : (
                    <Eye
                      size={15}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* KEEP SIGNED IN */}

            <div className="mt-4 flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    keepSignedIn
                  }
                  onChange={(
                    event,
                  ) =>
                    setKeepSignedIn(
                      event
                        .target
                        .checked,
                    )
                  }
                  className="h-3.5 w-3.5 accent-[#C8A35A]"
                />

                <span className="text-[9px] text-white/35">
                  Keep me signed in
                </span>
              </label>

              <Link
                href="/forgot-password"
                className="text-[9px] text-[#C8A35A] transition hover:text-[#E0C48A]"
              >
                Forgot password?
              </Link>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                <p className="text-[10px] leading-5 text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* SIGN IN */}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex min-h-10 w-full items-center justify-center rounded-md bg-[#C8A35A] px-4 text-[10px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>

          {/* SECURITY */}

          <div className="mt-8 border-t border-white/[0.07] pt-6 text-center">
            <p className="text-[9px] leading-5 text-white/25">
              Admin access is protected by
              account authentication.
            </p>

            <p className="text-[9px] leading-5 text-white/25">
              Need access? Contact the Super Admin.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}