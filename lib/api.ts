const backendApiUrl =
  (
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://business-nuggets-api.onrender.com"
      : "http://localhost:3001")
  ).replace(/\/$/, "");

/*
 * Admin pages historically call the Render API directly with a bearer
 * token from browser storage. While those pages are being kept intact,
 * route only backend /admin/* requests through our same-origin Next.js
 * proxy. The proxy injects the real HttpOnly admin session server-side.
 */
if (
  typeof window !== "undefined" &&
  window.location.pathname.startsWith(
    "/admin/",
  )
) {
  const clientWindow =
    window as Window & {
      __bnAdminApiProxyInstalled?: boolean;
    };

  if (
    !clientWindow.__bnAdminApiProxyInstalled
  ) {
    const nativeFetch =
      window.fetch.bind(window);

    const adminApiPrefix =
      `${backendApiUrl}/admin/`;

    const patchedFetch:
      typeof window.fetch =
      (input, init) => {
        const requestUrl =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input instanceof Request
                ? input.url
                : "";

        if (
          requestUrl.startsWith(
            adminApiPrefix,
          )
        ) {
          const relativePath =
            requestUrl.slice(
              adminApiPrefix.length,
            );

          const headers =
            new Headers(
              init?.headers ??
                (input instanceof Request
                  ? input.headers
                  : undefined),
            );

          // Never forward the browser's legacy bearer header.
          // The proxy reads the real token from an HttpOnly cookie.
          headers.delete(
            "Authorization",
          );

          return nativeFetch(
            `/api/admin/proxy/${relativePath}`,
            {
              ...init,
              headers,
              credentials:
                "same-origin",
            },
          );
        }

        return nativeFetch(
          input,
          init,
        );
      };

    window.fetch =
      patchedFetch;

    clientWindow.__bnAdminApiProxyInstalled =
      true;
  }
}

export const API_URL =
  backendApiUrl;
