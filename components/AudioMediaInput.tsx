
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { adminApiFetch } from "@/lib/admin-api";
import {
  mediaUrl,
  readMediaResponse,
} from "@/lib/media-library";

type Bucket = "song" | "nuggets";

type R2File = {
  key: string;
  name: string;
  size: number;
  reference: string;
};

type R2ListResponse = {
  files: R2File[];
  nextContinuationToken: string | null;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onDurationDetected?: (duration: string) => void;
  detectDurationForValue?: boolean;
  label?: string;
  bucket: Bucket;
};

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

export default function AudioMediaInput({
  value,
  onChange,
  onDurationDetected,
  detectDurationForValue = false,
  label = "Audio URL",
  bucket,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [browserOpen, setBrowserOpen] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [files, setFiles] = useState<R2File[]>([]);
  const [nextToken, setNextToken] =
    useState<string | null>(null);
  const [search, setSearch] = useState("");

  const pendingDurationReference = useRef<string | null>(null);

  useEffect(() => {
    // Only newly matched songs with an empty duration opt into auto-detection.
    if (detectDurationForValue && value) {
      pendingDurationReference.current = value;
    }
  }, [detectDurationForValue, value]);

  function selectAudioReference(reference: string) {
    pendingDurationReference.current = reference;
    onChange(reference);
  }

  function handleAudioMetadata(
    event: React.SyntheticEvent<HTMLAudioElement>,
  ) {
    if (pendingDurationReference.current !== value) {
      return;
    }

    const seconds = event.currentTarget.duration;

    if (!Number.isFinite(seconds) || seconds <= 0) {
      return;
    }

    const totalSeconds = Math.round(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    const formattedDuration =
      minutes > 0
        ? `${minutes} min${remainingSeconds ? ` ${remainingSeconds} sec` : ""}`
        : `${remainingSeconds} sec`;

    pendingDurationReference.current = null;

    onDurationDetected?.(formattedDuration);
  }


  const visibleFiles = useMemo(
    () =>
      files.filter((file) =>
        file.key
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [files, search],
  );

  useEffect(() => {
    setError("");

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

  async function loadR2Files(
    continuationToken?: string,
  ) {
    setBrowsing(true);
    setError("");

    try {
      const params = new URLSearchParams({
        kind: bucket,
      });

      if (continuationToken) {
        params.set(
          "continuationToken",
          continuationToken,
        );
      }

      const data = (await readMediaResponse(
        await adminApiFetch(
          `/r2-audio/files?${params.toString()}`,
          { cache: "no-store" },
        ),
      )) as R2ListResponse;

      setFiles((current) =>
        continuationToken
          ? [...current, ...data.files]
          : data.files,
      );

      setNextToken(
        data.nextContinuationToken,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not browse the R2 bucket.",
      );
    } finally {
      setBrowsing(false);
    }
  }

  function toggleBrowser() {
    if (browserOpen) {
      setBrowserOpen(false);
      return;
    }

    setBrowserOpen(true);
    setFiles([]);
    setNextToken(null);
    setSearch("");

    void loadR2Files();
  }

  function selectR2File(file: R2File) {
    selectAudioReference(file.reference);
    setBrowserOpen(false);
    setError("");
    setMessage(
      `${file.name} selected from R2. Save the Nugget to keep it.`,
    );
  }

  async function uploadFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
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
      setError(
        "Choose an MP3 file no larger than 50 MB.",
      );
      return;
    }

    setUploading(true);

    try {
      const signed = await readMediaResponse(
        await adminApiFetch(
          "/r2-audio/sign-upload",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              kind: bucket,
              filename: file.name,
              size: file.size,
            }),
          },
        ),
      );

      const uploaded = await fetch(
        signed.uploadUrl,
        {
          method: "PUT",
          headers: {
            "Content-Type": "audio/mpeg",
          },
          body: file,
        },
      );

      if (!uploaded.ok) {
        throw new Error(
          `R2 upload failed (${uploaded.status})`,
        );
      }

      const completed = await readMediaResponse(
        await adminApiFetch(
          "/r2-audio/complete-upload",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reference: signed.reference,
            }),
          },
        ),
      );

      selectAudioReference(completed.reference);
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
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="Upload an MP3, choose from R2, or enter an audio URL"
        className="h-11 w-full rounded-lg border border-white/20 bg-[#080808] px-3 text-sm text-white outline-none focus:border-[#E28906]"
      />

      <div className="flex flex-wrap gap-3">
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#E28906]/40 px-4 py-2 text-sm font-medium text-[#E28906]">
          {uploading
            ? "Uploading MP3..."
            : `Upload ${
                bucket === "song"
                  ? "Song"
                  : "Nugget"
              } MP3`}

          <input
            type="file"
            accept=".mp3,audio/mpeg"
            disabled={uploading}
            onChange={uploadFile}
            className="sr-only"
          />
        </label>

        <button
          type="button"
          disabled={uploading}
          onClick={toggleBrowser}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:border-[#E28906]/50 disabled:opacity-50"
        >
          {browserOpen
            ? "Close R2 Files"
            : "Browse R2 Files"}
        </button>
      </div>

      {browserOpen && (
        <div className="rounded-lg border border-white/20 bg-[#111111] p-4">
          <p className="mb-3 text-sm font-medium text-white">
            {bucket === "song"
              ? "Song"
              : "Nugget"}{" "}
            bucket files
          </p>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search loaded MP3 files..."
            className="mb-3 h-10 w-full rounded-lg border border-white/20 bg-[#080808] px-3 text-sm text-white outline-none focus:border-[#E28906]"
          />

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {visibleFiles.map((file) => (
              <button
                key={file.key}
                type="button"
                onClick={() =>
                  selectR2File(file)
                }
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-3 text-left text-sm text-white/80 hover:border-[#E28906]/50 hover:text-white"
              >
                <span className="min-w-0 break-words">
                  {file.key}
                </span>

                <span className="shrink-0 text-xs text-white/40">
                  {formatSize(file.size)}
                </span>
              </button>
            ))}

            {!browsing &&
              visibleFiles.length === 0 && (
                <p className="py-4 text-sm text-white/45">
                  No matching MP3 files in
                  the loaded results.
                </p>
              )}
          </div>

          {nextToken && (
            <button
              type="button"
              disabled={browsing}
              onClick={() =>
                void loadR2Files(nextToken)
              }
              className="mt-3 rounded-lg border border-white/20 px-4 py-2 text-sm text-[#E28906] disabled:opacity-50"
            >
              {browsing
                ? "Loading..."
                : "Load more files"}
            </button>
          )}

          {browsing && (
            <p className="mt-3 text-sm text-white/45">
              Loading R2 files...
            </p>
          )}
        </div>
      )}

      {message && (
        <p
          role="status"
          className="text-sm text-green-400"
        >
          {message}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="text-sm text-red-400"
        >
          {error}
        </p>
      )}

      
      {previewUrl && (
        <audio
          key={value}
          controls
          preload="metadata"
          src={previewUrl}
          onLoadedMetadata={handleAudioMetadata}
          className="w-full"
          aria-label={`${label} preview`}
        />
      )}

    </div>
  );
}
