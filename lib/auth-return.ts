/** Accept only local destinations, never external redirects. */
export function safeReturnPath(value: string | null, fallback = "/home") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return fallback;
  return value;
}

export function postAuthDestination() {
  const fallback = window.location.pathname === "/register" ? "/onboarding" : "/home";
  return safeReturnPath(
    new URLSearchParams(window.location.search).get("next"),
    fallback,
  );
}

export function loginFor(destination: string) {
  return `/login?next=${encodeURIComponent(safeReturnPath(destination))}`;
}
