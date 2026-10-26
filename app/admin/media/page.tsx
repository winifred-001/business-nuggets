"use client";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Music2, Upload } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { adminApiFetch } from "@/lib/admin-api";
import {
  formatMediaBytes,
  MEDIA_ACCEPT,
  mediaUrl,
  readMediaResponse,
  uploadMedia,
  type MediaAsset,
} from "@/lib/media-library";
type Library = {
  assets: MediaAsset[];
  folders: { id: number; name: string }[];
  storage: { usedBytes: number; limitBytes: number };
};
const URL_TYPES = {
  "audio/mpeg": "MP3 / audio",
  "audio/wav": "WAV",
  "audio/mp4": "M4A",
  "audio/ogg": "OGG",
  "audio/flac": "FLAC",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
  "image/gif": "GIF",
};
export default function AdminMediaPage() {
  const [library, setLibrary] = useState<Library>({
    assets: [],
    folders: [],
    storage: { usedBytes: 0, limitBytes: 0 },
  });
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [folderId, setFolderId] = useState<number | null>(null),
    [kind, setKind] = useState("all");
  const [folderOpen, setFolderOpen] = useState(false),
    [folderName, setFolderName] = useState("");
  const [urlOpen, setUrlOpen] = useState(false),
    [urlName, setUrlName] = useState(""),
    [url, setUrl] = useState(""),
    [mimeType, setMimeType] = useState("audio/mpeg");
  const fileInput = useRef<HTMLInputElement>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await readMediaResponse(
        await adminApiFetch("/media", { cache: "no-store", signal }),
      );
      if (!signal?.aborted) setLibrary(data);
    } catch (cause) {
      if (!signal?.aborted)
        setError(
          cause instanceof Error ? cause.message : "Could not load media.",
        );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    adminApiFetch("/media", { cache: "no-store", signal: controller.signal })
      .then(readMediaResponse)
      .then((data) => {
        if (!controller.signal.aborted) setLibrary(data);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "Could not load media.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  const assets = useMemo(
    () =>
      library.assets.filter(
        (asset) =>
          (folderId === null || asset.folderId === folderId) &&
          (kind === "all" || asset.mimeType.startsWith(`${kind}/`)),
      ),
    [library.assets, folderId, kind],
  );
  async function action(work: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await work();
      setSuccess(message);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Media request failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await action(
      () => uploadMedia(file, folderId),
      "File uploaded and saved to the library.",
    );
    if (fileInput.current) fileInput.current.value = "";
  }
  function post(path: string, body: unknown) {
    return adminApiFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(readMediaResponse);
  }
  async function saveFolder(event: FormEvent) {
    event.preventDefault();
    await action(async () => {
      await post("/media/folders", { name: folderName.trim() });
      setFolderOpen(false);
      setFolderName("");
    }, "Folder created.");
  }
  async function saveUrl(event: FormEvent) {
    event.preventDefault();
    await action(async () => {
      await post("/media/urls", {
        name: urlName.trim(),
        url: url.trim(),
        mimeType,
        ...(folderId ? { folderId } : {}),
      });
      setUrlOpen(false);
      setUrlName("");
      setUrl("");
    }, "Media URL saved. The file remains with its original host.");
  }
  async function remove(asset: MediaAsset) {
    if (
      !window.confirm(
        asset.filename.startsWith("external:")
          ? `Remove the saved link "${asset.originalName}"? The original file stays with its host.`
          : `Delete "${asset.originalName}" from storage and the library?`,
      )
    )
      return;
    await action(
      () =>
        adminApiFetch(`/media/${asset.id}`, { method: "DELETE" }).then(
          readMediaResponse,
        ),
      "Media removed.",
    );
  }
  async function copy(asset: MediaAsset) {
    try {
      await navigator.clipboard.writeText(mediaUrl(asset.url));
      setSuccess("Media URL copied. You can paste it into a Nugget.");
    } catch {
      setError("Could not copy automatically. Use Open file to get the URL.");
    }
  }
  const button =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-50";
  const input =
    "mt-2 w-full rounded-lg border border-white/20 bg-[#080808] px-4 py-3 text-sm text-white";
  return (
    <AdminShell>
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <h1 className="font-serif text-[37px]!">Media Library</h1>
            <p className="mt-3 text-sm text-white/50">
              Upload images (up to 10 MB), MP3 or WAV audio (up to 50 MB), or
              save a direct HTTPS media URL.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => setFolderOpen((v) => !v)}
              className={button}
            >
              New Folder
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setUrlOpen((v) => !v)}
              className={button}
            >
              Save URL
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
              className={`${button} border-[#cda762] bg-[#cda762] font-semibold text-black`}
            >
              <Upload size={16} />
              {busy ? "Working…" : "Upload file"}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept={MEDIA_ACCEPT}
              onChange={upload}
              className="hidden"
            />
          </div>
        </section>
        {error && (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-red-400/25 p-4 text-red-300"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="mt-6 rounded-lg border border-green-400/25 p-4 text-green-300"
          >
            {success}
          </p>
        )}
        {folderOpen && (
          <form
            onSubmit={saveFolder}
            className="mt-6 max-w-xl space-y-4 rounded-xl border border-white/20 bg-[#111111] p-5"
          >
            <label className="block">
              Folder name
              <input
                required
                maxLength={100}
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className={input}
              />
            </label>
            <button disabled={busy} className={button}>
              Create folder
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setFolderOpen(false)}
              className={`${button} ml-3`}
            >
              Cancel
            </button>
          </form>
        )}
        {urlOpen && (
          <form
            onSubmit={saveUrl}
            className="mt-6 max-w-xl space-y-4 rounded-xl border border-white/20 bg-[#111111] p-5"
          >
            <p className="text-sm leading-6 text-white/50">
              Use a direct file link, such as an R2 or Cloudinary audio URL.
              This saves the link in the current folder; it does not copy the
              file into your storage.
            </p>
            <label className="block">
              Name
              <input
                required
                maxLength={255}
                value={urlName}
                onChange={(e) => setUrlName(e.target.value)}
                className={input}
              />
            </label>
            <label className="block">
              HTTPS media URL
              <input
                required
                type="url"
                maxLength={2048}
                placeholder="https://example.com/audio.mp3"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={input}
              />
            </label>
            <label className="block">
              File type
              <select
                value={mimeType}
                onChange={(e) => setMimeType(e.target.value)}
                className={input}
              >
                {Object.entries(URL_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button disabled={busy} className={button}>
              Save URL
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setUrlOpen(false)}
              className={`${button} ml-3`}
            >
              Cancel
            </button>
          </form>
        )}
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Folder
            <select
              value={folderId ?? "all"}
              onChange={(e) =>
                setFolderId(
                  e.target.value === "all" ? null : Number(e.target.value),
                )
              }
              className={`${input} ml-3 w-auto!`}
            >
              <option value="all">All Media</option>
              {library.folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Show
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className={`${input} ml-3 w-auto!`}
            >
              <option value="all">All files</option>
              <option value="image">Images</option>
              <option value="audio">Audio</option>
            </select>
          </label>
        </div>
        {loading ? (
          <p role="status" className="mt-8">
            Loading media…
          </p>
        ) : assets.length === 0 ? (
          <p className="mt-8 rounded-xl border border-white/15 p-8 text-center text-white/50">
            No media here yet. Upload a file or save a URL.
          </p>
        ) : (
          <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {assets.map((asset) => (
              <article
                key={asset.id}
                className="min-w-0 overflow-hidden rounded-xl border border-white/15 bg-[#111111]"
              >
                {asset.mimeType.startsWith("audio/") ? (
                  <div className="flex min-h-[180px] flex-col justify-center gap-4 bg-[#191b18] p-4">
                    <Music2 size={32} className="mx-auto text-[#cda762]" />
                    <audio
                      controls
                      preload="none"
                      src={mediaUrl(asset.url)}
                      className="w-full"
                      aria-label={`Preview ${asset.originalName}`}
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-[#191b18]">
                    <Image
                      unoptimized
                      width={640}
                      height={360}
                      src={mediaUrl(asset.url)}
                      alt={asset.originalName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-4">
                  <p className="break-words font-medium">
                    {asset.originalName}
                  </p>
                  <p className="mt-2 text-xs text-white/45">
                    {asset.mimeType} ·{" "}
                    {asset.filename.startsWith("external:")
                      ? "External link"
                      : formatMediaBytes(asset.size)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => copy(asset)}
                      className="text-[#ead2a0]"
                    >
                      Copy URL
                    </button>
                    <a
                      href={mediaUrl(asset.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#ead2a0]"
                    >
                      Open file ↗
                    </a>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => remove(asset)}
                      className="text-red-300 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
        <div className="mt-8 max-w-md">
          <p className="text-sm text-white/45">
            Uploaded storage: {formatMediaBytes(library.storage.usedBytes)} of{" "}
            {formatMediaBytes(library.storage.limitBytes)}. External links use
            no uploaded storage.
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded bg-white/10">
            <div
              className="h-full bg-[#cda762]"
              style={{
                width: `${library.storage.limitBytes ? Math.min(100, (library.storage.usedBytes / library.storage.limitBytes) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </main>
    </AdminShell>
  );
}
