"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  CheckCircle2,
  LoaderCircle,
  XCircle,
} from "lucide-react";

import { API_URL } from "@/lib/api";

export default function PaymentCallbackContent() {
  const [status, setStatus] =
    useState<
      | "verifying"
      | "success"
      | "error"
    >("verifying");

  const [message, setMessage] =
    useState(
      "Confirming your payment...",
    );

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search,
      );

    const reference =
      params.get("reference") ||
      params.get("trxref");

    const token =
      localStorage.getItem(
        "token",
      );

    if (!reference) {
      setStatus("error");
      setMessage(
        "Payment reference is missing.",
      );
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage(
        "Please log in again to finish activating your Premium membership.",
      );
      return;
    }

    let mounted = true;

    async function verify() {
      try {
        const response =
          await fetch(
            `${API_URL}/payments/verify/${encodeURIComponent(
              reference,
            )}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Payment could not be verified.",
          );
        }

        if (!mounted) {
          return;
        }

        window.dispatchEvent(
          new Event(
            "auth-change",
          ),
        );

        setStatus("success");
        setMessage(
          "Payment verified. Premium access is now active on your account.",
        );
      } catch (error) {
        if (!mounted) {
          return;
        }

        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Payment could not be verified.",
        );
      }
    }

    void verify();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-1 items-center px-5 py-16 sm:px-8">
      <section className="w-full rounded-[12px] border border-white/10 bg-[#111111] p-7 text-center sm:p-10">
        {status === "verifying" && (
          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-[#C8A35A]"
          />
        )}

        {status === "success" && (
          <CheckCircle2
            size={36}
            className="mx-auto text-emerald-400"
          />
        )}

        {status === "error" && (
          <XCircle
            size={36}
            className="mx-auto text-red-400"
          />
        )}

        <h1 className="mt-5 font-serif text-[32px] leading-tight text-[#FAF9F6]">
          {status === "verifying"
            ? "Verifying Payment"
            : status === "success"
              ? "Premium Unlocked"
              : "Payment Verification"}
        </h1>

        <p className="mx-auto mt-3 max-w-[560px] text-[13px] leading-6 text-white/45">
          {message}
        </p>

        {status === "success" && (
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/library"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#C8A35A] px-5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
            >
              Open Full Library
            </Link>

            <Link
              href="/membership"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/10 px-5 text-[11px] text-white/60 transition hover:border-[#C8A35A]/40 hover:text-white"
            >
              Membership
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/membership"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#C8A35A] px-5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
            >
              Return to Membership
            </Link>

            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/10 px-5 text-[11px] text-white/60 transition hover:border-[#C8A35A]/40 hover:text-white"
            >
              Log In
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
