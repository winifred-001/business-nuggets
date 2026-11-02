"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Camera,
  Trash2,
  UserRound,
} from "lucide-react";

const PROFILE_IMAGE_ENDPOINT =
  "/api/member/proxy/users/me/profile-image";

const MAX_PROFILE_IMAGE_BYTES =
  5 * 1024 * 1024;

const PROFILE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type ProfileImageResponse = {
  url?: string | null;
  message?: string | string[];
};

function messageFromResponse(
  data: ProfileImageResponse,
  fallback: string,
) {
  if (Array.isArray(data.message)) {
    return data.message.join(", ");
  }

  return data.message || fallback;
}

export function ProfileAvatar({
  className = "h-12 w-12",
  iconSize = 22,
}: {
  className?: string;
  iconSize?: number;
}) {
  const [url, setUrl] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileImage() {
      try {
        const response = await fetch(
          PROFILE_IMAGE_ENDPOINT,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          if (!cancelled) {
            setUrl(null);
          }
          return;
        }

        const data =
          (await response.json()) as ProfileImageResponse;

        if (!cancelled) {
          setUrl(
            typeof data.url === "string"
              ? data.url
              : null,
          );
        }
      } catch {
        if (!cancelled) {
          setUrl(null);
        }
      }
    }

    const refresh = () => {
      void loadProfileImage();
    };

    refresh();
    window.addEventListener(
      "profile-image-change",
      refresh,
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        "profile-image-change",
        refresh,
      );
    };
  }, []);

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#181818] ${className}`}
      aria-hidden="true"
    >
      {url ? (
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound
          size={iconSize}
          strokeWidth={1.6}
          className="text-white/60"
        />
      )}
    </span>
  );
}

export function ProfileImageEditor() {
  const inputRef =
    useRef<HTMLInputElement>(null);
  const [url, setUrl] =
    useState<string | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState("");

  async function loadProfileImage() {
    try {
      const response = await fetch(
        PROFILE_IMAGE_ENDPOINT,
        {
          cache: "no-store",
        },
      );

      const data =
        (await response
          .json()
          .catch(() => ({}))) as ProfileImageResponse;

      if (!response.ok) {
        setMessage(
          response.status === 401
            ? ""
            : messageFromResponse(
                data,
                "Could not load profile image.",
              ),
        );
        return;
      }

      setUrl(
        typeof data.url === "string"
          ? data.url
          : null,
      );
    } catch {
      setMessage(
        "Could not load profile image.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfileImage();
  }, []);

  async function handleFile(
    file: File | undefined,
  ) {
    if (!file) return;

    setMessage("");

    if (!PROFILE_IMAGE_TYPES.has(file.type)) {
      setMessage(
        "Choose a JPG, PNG or WEBP image.",
      );
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setMessage(
        "Profile images must be 5 MB or smaller.",
      );
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        PROFILE_IMAGE_ENDPOINT,
        {
          method: "POST",
          body: formData,
        },
      );

      const data =
        (await response
          .json()
          .catch(() => ({}))) as ProfileImageResponse;

      if (!response.ok) {
        setMessage(
          messageFromResponse(
            data,
            "Could not upload profile image.",
          ),
        );
        return;
      }

      const nextUrl =
        typeof data.url === "string"
          ? data.url
          : null;

      setUrl(nextUrl);
      setMessage(
        "Profile image updated successfully.",
      );
      window.dispatchEvent(
        new Event("profile-image-change"),
      );
    } catch {
      setMessage(
        "Could not upload profile image.",
      );
    } finally {
      setSaving(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function removeImage() {
    if (!url || saving) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        PROFILE_IMAGE_ENDPOINT,
        {
          method: "DELETE",
        },
      );

      const data =
        (await response
          .json()
          .catch(() => ({}))) as ProfileImageResponse;

      if (!response.ok) {
        setMessage(
          messageFromResponse(
            data,
            "Could not remove profile image.",
          ),
        );
        return;
      }

      setUrl(null);
      setMessage(
        "Profile image removed.",
      );
      window.dispatchEvent(
        new Event("profile-image-change"),
      );
    } catch {
      setMessage(
        "Could not remove profile image.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#181818]">
        {url ? (
          <img
            src={url}
            alt="Your profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <UserRound
            size={28}
            strokeWidth={1.6}
            className="text-white/55"
          />
        )}
      </span>

      <div className="min-w-[220px] flex-1">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving || loading}
            onClick={() =>
              inputRef.current?.click()
            }
            className="bn-button inline-flex min-h-9 items-center gap-2 rounded-md border border-[#C8A35A]/50 px-3 text-[10px] font-semibold text-[#C8A35A] transition hover:bg-[#C8A35A]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera size={13} />
            {saving
              ? "Saving..."
              : url
                ? "Change Photo"
                : "Add Photo"}
          </button>

          {url && (
            <button
              type="button"
              disabled={saving}
              onClick={removeImage}
              className="bn-button inline-flex min-h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-[10px] text-white/55 transition hover:border-red-500/30 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={13} />
              Remove Photo
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) =>
            void handleFile(
              event.target.files?.[0],
            )
          }
        />

        <p className="mt-2 text-[11px] text-white/30">
          JPG, PNG or WEBP · Maximum 5 MB
        </p>

        {message && (
          <p className="mt-2 text-[11px] text-white/55">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
