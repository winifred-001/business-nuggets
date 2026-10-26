"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminApiFetch } from "@/lib/admin-api";
import {
  mediaUrl,
  readMediaResponse,
  type MediaAsset,
} from "@/lib/media-library";

export default function AudioMediaInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const closePicker = useCallback(() => setOpen(false), []);
  return (
    <div className="space-y-3">
      <input
        aria-label="Audio URL"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://example.com/audio.mp3"
        className="mt-2 h-11 w-full rounded-lg border border-white/20 bg-[#080808] px-3 text-sm text-white outline-none focus:border-[#cda762]"
      />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-[#cda762]/40 px-4 py-2 text-sm text-[#ead2a0]"
      >
        Choose audio from Media Library
      </button>
      {value && (
        <audio
          controls
          preload="none"
          src={mediaUrl(value)}
          className="w-full"
          aria-label="Selected audio preview"
        />
      )}
      {open && (
        <AudioPicker
          onClose={closePicker}
          onSelect={(url) => {
            onChange(url);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function AudioPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await readMediaResponse(
          await adminApiFetch("/media", { signal: controller.signal }),
        );
        if (!controller.signal.aborted)
          setAssets(
            data.assets.filter((asset: MediaAsset) =>
              asset.mimeType.startsWith("audio/"),
            ),
          );
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "Could not load audio.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 z-[100] m-0 h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-black/80 p-4 text-white open:flex"
      aria-label="Choose audio"
    >
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/20 bg-[#191b18] p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-serif text-[30px]!">Choose audio</h2>
          <button
            autoFocus
            type="button"
            onClick={onClose}
            className="rounded border border-white/20 px-3 py-2"
          >
            Close
          </button>
        </div>
        {loading ? (
          <p role="status">Loading audio…</p>
        ) : error ? (
          <p role="alert" className="text-red-300">
            {error}
          </p>
        ) : assets.length === 0 ? (
          <p>
            No audio yet. Upload a file or save an audio URL in Media Library
            first.
          </p>
        ) : (
          <div className="space-y-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-lg border border-white/15 p-4"
              >
                <p className="mb-3 break-words">{asset.originalName}</p>
                <audio
                  controls
                  preload="none"
                  src={mediaUrl(asset.url)}
                  className="w-full"
                />
                <button
                  type="button"
                  onClick={() => onSelect(mediaUrl(asset.url))}
                  className="mt-3 rounded bg-[#cda762] px-4 py-2 font-semibold text-black"
                >
                  Use this audio
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </dialog>
  );
}
