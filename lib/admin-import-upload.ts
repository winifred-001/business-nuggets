import { API_URL } from "./api";
import { adminApiFetch } from "./admin-api";
export const ADMIN_IMPORT_LIMIT = 5 * 1024 * 1024;
export async function uploadAdminImport(
  kind: "topics" | "nuggets",
  stage: "preview" | "commit",
  file: File,
) {
  if (!file.size || file.size > ADMIN_IMPORT_LIMIT)
    throw new Error("Choose a file between 1 byte and 5 MB.");
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const sha256 = Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const response = await adminApiFetch("/imports/ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, stage, size: file.size, sha256 }),
  });
  if (!response.ok) return response;
  let data;
  try {
    data = JSON.parse(await response.text());
  } catch {
    throw new Error(
      "The import server returned an unreadable upload authorization. Please retry.",
    );
  }
  if (typeof data.ticket !== "string")
    throw new Error(
      "The import server did not authorize the upload. Please retry.",
    );
  const body = new FormData();
  body.append("file", file);
  return fetch(`${API_URL}/admin-imports/${kind}/${stage}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${data.ticket}` },
    body,
    credentials: "omit",
  });
}
