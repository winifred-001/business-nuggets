/** Accept only local destinations, never external redirects. */
export function safeReturnPath(value: string | null, fallback = "/home") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
export function postAuthDestination() {
  return safeReturnPath(new URLSearchParams(window.location.search).get("next"));
}
export function loginFor(destination: string) {
  return `/login?next=${encodeURIComponent(safeReturnPath(destination))}`;
}
