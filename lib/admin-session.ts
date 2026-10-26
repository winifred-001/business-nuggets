export const ADMIN_SESSION_COOKIE =
  "bn_admin_session";

export const ADMIN_SESSION_MAX_AGE_SECONDS =
  7 * 24 * 60 * 60;

export function isAdminUser(
  user: unknown,
) {
  if (
    !user ||
    typeof user !== "object"
  ) {
    return false;
  }

  const candidate =
    user as {
      role?: unknown;
      adminRole?: unknown;
    };

  return (
    candidate.role === "owner" ||
    candidate.role === "admin" ||
    (typeof candidate.adminRole ===
      "string" &&
      candidate.adminRole.length > 0)
  );
}
