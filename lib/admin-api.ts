const ADMIN_PROXY_BASE =
  "/api/admin/proxy";

export function adminApiFetch(
  path: string,
  init?: RequestInit,
) {
  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return fetch(
    `${ADMIN_PROXY_BASE}${normalizedPath}`,
    {
      ...init,
      credentials:
        "same-origin",
    },
  );
}

/** Read once so empty/proxy HTML responses never leak JSON parser errors. */
export async function readAdminJson<T>(response: Response, options: { allowEmpty?: boolean } = {}): Promise<T | null> {
  const body = await response.text();
  let data: unknown = null;
  if (body.trim()) {
    try { data = JSON.parse(body); }
    catch { throw new Error(`The settings server returned an unreadable response (HTTP ${response.status}). Please retry.`); }
  }
  if (!response.ok) {
    const detail = data && typeof data === "object" && "message" in data ? data.message : undefined;
    const message = response.status === 401 ? "Your admin session has expired. Please log in again."
      : response.status === 403 ? "You need Settings permission to access this page."
      : Array.isArray(detail) ? detail.join("; ") : typeof detail === "string" ? detail : undefined;
    throw new Error(message || `The settings server is unavailable (HTTP ${response.status}). Please retry.`);
  }
  if (data === null && !options.allowEmpty) throw new Error("The settings server returned an empty response. Please retry.");
  return data as T | null;
}
