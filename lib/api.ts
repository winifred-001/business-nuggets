const backendApiUrl =
  (
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://business-nuggets-api.onrender.com"
      : "http://localhost:3001")
  ).replace(/\/$/, "");

/*
 * Legacy client pages still construct Authorization headers from browser
 * storage. The browser value is now only a harmless marker. Authenticated
 * requests are transparently rerouted through same-origin proxies where
 * the real JWT is read from an HttpOnly cookie server-side.
 */
if (
  typeof window !== "undefined"
) {
  const clientWindow =
    window as Window & {
      __bnSecureApiProxyInstalled?: boolean;
    };

  if (
    !clientWindow.__bnSecureApiProxyInstalled
  ) {
    const nativeFetch =
      window.fetch.bind(window);

    const backendPrefix =
      `${backendApiUrl}/`;

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

        const headers =
          new Headers(
            init?.headers ??
              (input instanceof Request
                ? input.headers
                : undefined),
          );

        const isAdminPage =
          window.location.pathname ===
            "/admin" ||
          window.location.pathname.startsWith(
            "/admin/",
          );

        if (
          isAdminPage &&
          requestUrl.startsWith(
            adminApiPrefix,
          )
        ) {
          const relativePath =
            requestUrl.slice(
              adminApiPrefix.length,
            );

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

        if (
          !isAdminPage &&
          requestUrl.startsWith(
            backendPrefix,
          ) &&
          headers.has(
            "Authorization",
          )
        ) {
          const relativePath =
            requestUrl.slice(
              backendPrefix.length,
            );

          headers.delete(
            "Authorization",
          );

          return nativeFetch(
            `/api/member/proxy/${relativePath}`,
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

    clientWindow.__bnSecureApiProxyInstalled =
      true;
  }
}

export const API_URL =
  backendApiUrl;


/**
 * Retry transient API failures (network errors, rate limits and 5xx responses).
 * Do not retry normal client errors such as 400, 401, 403 or 404.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxAttempts = 3,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      const shouldRetry =
        response.status === 408 ||
        response.status === 425 ||
        response.status === 429 ||
        response.status >= 500;

      if (!shouldRetry || attempt === maxAttempts) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        throw error;
      }
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 500 * 2 ** (attempt - 1)),
    );
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("The API request failed after multiple attempts.");
}
