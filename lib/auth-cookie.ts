/*
 * Member bearer tokens are now stored only in an HttpOnly cookie created
 * by server-side auth routes. These legacy exports remain temporarily so
 * older imports cannot accidentally restore JavaScript-readable JWTs.
 */
const MEMBER_TOKEN_COOKIE =
  "bn_member_token";

export function syncMemberTokenCookie(
  _token: string,
) {
  // Intentionally empty. Never write bearer tokens with document.cookie.
}

export function clearMemberTokenCookie() {
  // HttpOnly member cookies are cleared by /api/member/auth/logout.
}

export const MEMBER_TOKEN_COOKIE_NAME =
  MEMBER_TOKEN_COOKIE;
