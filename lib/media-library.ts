import { API_URL } from "@/lib/api";
import { adminApiFetch } from "@/lib/admin-api";

export type MediaAsset = {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  folderId: number | null;
  url: string;
  createdAt: string;
};
export const MEDIA_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,.mp3,.wav";
export function mediaUrl(url: string) {
  return url.startsWith("/") ? `${API_URL}${url}` : url;
}
export async function readMediaResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || data.error?.message || "The media request failed.",
    );
  return data;
}
export async function uploadMedia(
  file: File,
  folderId?: number | null,
): Promise<MediaAsset> {
  let mimeType = file.type;
  if (!mimeType || mimeType === "application/octet-stream") {
    const ext = file.name.split(".").pop()?.toLowerCase();
    mimeType =
      (
        {
          mp3: "audio/mpeg",
          wav: "audio/wav",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          gif: "image/gif",
        } as Record<string, string>
      )[ext ?? ""] ?? "";
  }
  const audio = mimeType.startsWith("audio/");
  if (file.size > (audio ? 50 : 10) * 1024 * 1024)
    throw new Error(
      audio
        ? "Audio must be 50 MB or smaller."
        : "Images must be 10 MB or smaller.",
    );
  const signed = await readMediaResponse(
    await adminApiFetch("/media/sign-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originalName: file.name,
        mimeType,
        size: file.size,
        ...(folderId ? { folderId } : {}),
      }),
    }),
  );
  const body = new FormData();
  body.append("file", file);
  for (const [key, value] of Object.entries(signed.fields))
    body.append(key, String(value));
  await readMediaResponse(
    await fetch(signed.uploadUrl, { method: "POST", body }),
  );
  return readMediaResponse(
    await adminApiFetch("/media/complete-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: signed.token }),
    }),
  );
}
export function formatMediaBytes(bytes: number) {
  if (!bytes) return "0 B";
  const index = Math.min(3, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${["B", "KB", "MB", "GB"][index]}`;
}
