
"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { adminApiFetch } from "@/lib/admin-api";
import { mediaUrl, readMediaResponse } from "@/lib/media-library";

type Bucket = "song" | "nuggets";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  bucket: Bucket;
};

export default function AudioMediaInput({
  value,
  onChange,
  label = "Audio URL",
  bucket,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!value) {
      setPreviewUrl("");
      return;
    }

    if (!value.startsWith("r2://")) {
      setPreviewUrl(mediaUrl(value));
      return;
    }

    const controller = new AbortController();
    setPreviewUrl("");

    void (async () => {
      try {
        const response = await adminApiFetch(
          `/r2-audio/preview?reference=${encodeURIComponent(value)}`,
          { signal: controller.signal },
        );

        const data = await readMediaResponse(response);

        if (!controller.signal.aborted) {
          setPreviewUrl(data.url);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Could not load the audio preview.");
        }
      }
    })();

    return () => controller.abort();
  }, [value]);

  async function uploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");
    setMessage("");

    if (
      !file.name.toLowerCase().endsWith(".mp3") ||
      file.size < 1 ||
      file.size > 50 * 1024 * 1024
    ) {
      setError("Choose an MP3 file no larger than 50 MB.");
      return;
    }

    setUploading(true);

    try {
      const signed = await readMediaResponse(
        await adminApiFetch("/r2-audio/sign-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: bucket,
            filename: file.name,
            size: file.size,
          }),
        }),
      );

      const uploaded = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "audio/mpeg" },
        body: file,
      });

      if (!uploaded.ok) {
        throw new Error(`R2 upload failed (${uploaded.status})`);
      }

      const completed = await readMediaResponse(
        await adminApiFetch("/r2-audio/complete-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: signed.reference,
          }),
        }),
      );

      onChange(completed.reference);
      setMessage("MP3 uploaded successfully.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not upload MP3.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Upload an MP3 or enter an audio URL"
        className="h-11 w-full rounded-lg border border-white/20 bg-[#080808] px-3 text-sm text-white outline-none focus:border-[#E28906]"
      />

      <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#E28906]/40 px-4 py-2 text-sm font-medium text-[#E28906]">
        {uploading ? "Uploading MP3..." : `Upload ${bucket === "song" ? "Song" : "Nugget"} MP3`}
        <input
          type="file"
          accept=".mp3,audio/mpeg"
          disabled={uploading}
          onChange={uploadFile}
          className="sr-only"
        />
      </label>

      {message && (
        <p role="status" className="text-sm text-green-400">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {previewUrl && (
        <audio
          controls
          preload="none"
          src={previewUrl}
          className="w-full"
          aria-label={`${label} preview`}
        />
      )}
    </div>
  );
}
