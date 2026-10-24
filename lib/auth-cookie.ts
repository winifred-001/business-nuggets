const MEMBER_TOKEN_COOKIE =
  "bn_member_token";

export function syncMemberTokenCookie(
  token: string,
) {
  if (
    typeof document ===
    "undefined"
  ) {
    return;
  }

  const secure =
    window.location.protocol ===
    "https:"
      ? "; Secure"
      : "";

  document.cookie =
    `${MEMBER_TOKEN_COOKIE}=${encodeURIComponent(
      token,
    )}; Path=/; Max-Age=604800; SameSite=Lax${secure}`;
}

export function clearMemberTokenCookie() {
  if (
    typeof document ===
    "undefined"
  ) {
    return;
  }

  const secure =
    window.location.protocol ===
    "https:"
      ? "; Secure"
      : "";

  document.cookie =
    `${MEMBER_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export const MEMBER_TOKEN_COOKIE_NAME =
  MEMBER_TOKEN_COOKIE;
