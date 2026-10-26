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
