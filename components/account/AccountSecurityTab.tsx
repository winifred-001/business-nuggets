"use client";

import PasswordInput from "@/components/PasswordInput";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";

export default function AccountSecurityTab() {
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        "The new passwords do not match.",
      );

      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Your new password must contain at least 8 characters.",
      );

      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      setError(
        "Your session has expired. Please sign in again.",
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/users/me/password`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not change password.",
        );
      }

      setMessage(
        "Password changed successfully.",
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not change password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-white/10 bg-[#111111] p-6"
      >
        <h2 className="font-serif text-[20px]">
          Change Password
        </h2>

        <div className="mt-5 space-y-5">
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={
              setCurrentPassword
            }
            placeholder="Enter your current password"
          />

          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Create a unique password"
          />

          <p className="-mt-3 text-[11px] leading-5 text-white/35">
            Use a long password with letters,
            numbers and symbols. Do not reuse
            another account&apos;s password.
          </p>

          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={
              setConfirmPassword
            }
            placeholder="Re-enter your new password"
          />

          <Link
            href="/forgot-password"
            className="inline-block text-[12px] text-[#C8A35A]"
          >
            Forgot Password? → Request
            Reset Link
          </Link>
        </div>

        {error && (
          <p className="mt-4 text-[13px] text-red-400">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-4 text-[13px] text-[#C8A35A]">
            {message}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              setError("");
              setMessage("");
            }}
            className="rounded-md border border-white/10 px-4 py-2.5 text-[12px] text-white/60"
          >
            Cancel Changes
          </button>

          <button
            disabled={loading}
            type="submit"
            className="rounded-md bg-[#C8A35A] px-5 py-2.5 text-[12px] font-semibold text-[#080808] disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </form>

      <section className="rounded-xl border border-white/10 bg-[#111111] p-6">
        <h2 className="font-serif text-[20px]">
          Two-Factor Authentication
        </h2>

        <div className="mt-5 rounded-md border border-[#C8A35A]/20 bg-[#C8A35A]/15 p-4">
          <p className="text-[12px] font-medium text-[#C8A35A]">
            Not enabled — premium status
          </p>

          <p className="mt-2 text-[12px] leading-5 text-white/45">
            An additional verification step
            helps protect your account if your
            password is compromised.
          </p>
        </div>

        <button
          type="button"
          disabled
          className="mt-5 rounded-md border border-white/10 px-4 py-2.5 text-[12px] text-white/35"
        >
          Set Up Two-Factor Authentication
        </button>

        <p className="mt-2 text-[11px] text-white/25">
          Two-factor authentication will be
          enabled when its backend support is
          added.
        </p>
      </section>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-medium text-white/55">
        {label}
      </label>

      <PasswordInput visibilityLabel={label.toLowerCase()} aria-label={label}
        required

        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={placeholder}
        className="h-12 w-full rounded-md border border-white/10 bg-[#19191D] px-4 text-[13px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/60"
      />
    </div>
  );
}
