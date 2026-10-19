"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Check,
  Lock,
  Users,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import AuthRouteGuard from "@/components/AuthRouteGuard";

import { API_URL } from "@/lib/api";

export default function CreatePlaylistPage() {
  const router = useRouter();

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [privacy, setPrivacy] =
    useState<"private" | "shared">(
      "private",
    );

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  async function createPlaylist() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setError(
        "Your session has expired. Please sign in again.",
      );

      return;
    }

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      setError(
        "Enter a playlist name.",
      );

      return;
    }

    setCreating(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/playlists`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                name:
                  trimmedName,
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          Array.isArray(
            data.message,
          )
            ? data.message.join(
                ", ",
              )
            : data.message ||
                "Could not create playlist.",
        );

        return;
      }

      /*
       * Description and privacy are currently
       * UI-only because the Playlist backend
       * does not store these fields yet.
       *
       * We keep the entered values locally
       * so the user does not immediately lose
       * them while we build the backend fields.
       */

      if (data.id) {
        localStorage.setItem(
          `playlist-meta-${data.id}`,
          JSON.stringify({
            description:
              description.trim(),

            privacy,
          }),
        );
      }

      router.push(
        data.id
          ? `/library/playlist/${data.id}`
          : "/library/playlist",
      );

      router.refresh();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto flex w-full max-w-[1280px] flex-1 items-start justify-center px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <section className="w-full max-w-[650px] rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-7">
            {/* HEADER */}

            <h1 className="font-serif text-[40px] leading-tight">
              Create New Playlist
            </h1>

            <p className="mt-3 max-w-[520px] text-[13px] leading-6 text-white/40">
              Build a listening path around
              a business challenge or a
              principle you want to study.
            </p>

            <Link
              href="/library/playlist"
              className="mt-4 inline-block text-[11px] text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              ← My Playlists
            </Link>

            {/* NAME */}

            <div className="mt-7">
              <label
                htmlFor="playlist-name"
                className="mb-2 block text-[10px] font-semibold text-white/55"
              >
                Playlist Name
              </label>

              <input
                id="playlist-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(
                    event.target.value,
                  );

                  setError("");
                }}
                placeholder="e.g. Wisdom for Strategic Decisions"
                maxLength={100}
                className="h-11 w-full rounded-md border border-white/10 bg-[#19191D] px-4 text-[12px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/60"
              />
            </div>

            {/* DESCRIPTION */}

            <div className="mt-5">
              <label
                htmlFor="playlist-description"
                className="mb-2 block text-[10px] font-semibold text-white/55"
              >
                Description
              </label>

              <textarea
                id="playlist-description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                placeholder="Describe the focus of your playlist..."
                rows={5}
                maxLength={300}
                className="w-full resize-none rounded-md border border-white/10 bg-[#19191D] px-4 py-3 text-[12px] leading-6 text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/60"
              />

              <p className="mt-2 text-[10px] leading-5 text-white/25">
                Description support will be
                connected permanently when
                the playlist backend stores
                this field.
              </p>
            </div>

            {/* PRIVACY */}

            <div className="mt-6 space-y-3">
              <p className="text-[10px] font-semibold text-white/55">
                Privacy
              </p>

              {/* PRIVATE */}

              <button
                type="button"
                onClick={() =>
                  setPrivacy(
                    "private",
                  )
                }
                className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition ${
                  privacy ===
                  "private"
                    ? "border-[#C8A35A]/55 bg-[#C8A35A]/[0.10]"
                    : "border-white/10 bg-[#19191D] hover:border-white/20"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border ${
                    privacy ===
                    "private"
                      ? "border-[#C8A35A] bg-[#C8A35A]"
                      : "border-white/25"
                  }`}
                >
                  {privacy ===
                    "private" && (
                    <Check
                      size={11}
                      strokeWidth={3}
                      className="text-[#080808]"
                    />
                  )}
                </span>

                <Lock
                  size={15}
                  className="mt-0.5 shrink-0 text-[#C8A35A]"
                />

                <div>
                  <p className="text-[12px] font-medium text-white/85">
                    Private
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-white/35">
                    Keep this playlist in
                    your personal workspace.
                  </p>
                </div>
              </button>

              {/* SHARED */}

              <button
                type="button"
                onClick={() =>
                  setPrivacy(
                    "shared",
                  )
                }
                className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition ${
                  privacy ===
                  "shared"
                    ? "border-[#C8A35A]/55 bg-[#C8A35A]/[0.10]"
                    : "border-white/10 bg-[#19191D] hover:border-white/20"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border ${
                    privacy ===
                    "shared"
                      ? "border-[#C8A35A] bg-[#C8A35A]"
                      : "border-white/25"
                  }`}
                >
                  {privacy ===
                    "shared" && (
                    <Check
                      size={11}
                      strokeWidth={3}
                      className="text-[#080808]"
                    />
                  )}
                </span>

                <Users
                  size={15}
                  className="mt-0.5 shrink-0 text-[#C8A35A]"
                />

                <div>
                  <p className="text-[12px] font-medium text-white/85">
                    Shared
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-white/35">
                    Prepare this playlist
                    for future sharing
                    features.
                  </p>
                </div>
              </button>

              <p className="text-[10px] leading-5 text-white/25">
                Playlist sharing is not
                available on the backend yet.
                Your playlist will still be
                accessible only from your
                account for now.
              </p>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                <p className="text-[11px] text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* ACTIONS */}

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
              <Link
                href="/library/playlist"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 px-4 text-[11px] text-white/55 transition hover:border-white/20 hover:text-white"
              >
                Cancel - My Playlists
              </Link>

              <button
                type="button"
                onClick={
                  createPlaylist
                }
                disabled={
                  creating ||
                  !name.trim()
                }
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#C8A35A] px-5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {creating
                  ? "Creating..."
                  : "Create Playlist"}
              </button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}