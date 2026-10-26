export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  adminRole?: string | null;
  accountStatus?: string;
};

export type PendingAdminLogin = {
  email: string;
  password: string;
  keepSignedIn: boolean;
};

export type PendingAdminSetup = {
  setupToken: string;
  user: AdminUser;
};

let pendingAdminLogin: PendingAdminLogin | null = null;
let pendingAdminSetup: PendingAdminSetup | null = null;

const ADMIN_SESSION_MARKER =
  "http-only-session";

export function isAdminAccount(user?: Partial<AdminUser> | null) {
  return user?.role === "admin" || user?.role === "owner";
}

export function setPendingAdminLogin(value: PendingAdminLogin) {
  pendingAdminLogin = value;
}

export function getPendingAdminLogin() {
  return pendingAdminLogin;
}

export function clearPendingAdminLogin() {
  pendingAdminLogin = null;
}

export function setPendingAdminSetup(value: PendingAdminSetup) {
  pendingAdminSetup = value;
}

export function getPendingAdminSetup() {
  return pendingAdminSetup;
}

export function clearPendingAdminSetup() {
  pendingAdminSetup = null;
}

/*
 * Compatibility helper for legacy admin screens that only check whether
 * an admin session exists before fetching. The value is deliberately NOT
 * a JWT. The real bearer token lives only in the HttpOnly cookie and is
 * injected by the same-origin admin API proxy.
 */
export function getAdminToken() {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken")
  );
}

export function storeAdminSession(
  _token: string,
  user: AdminUser,
  keepSignedIn: boolean,
) {
  if (typeof window === "undefined") return;

  const serializedUser = JSON.stringify(user);

  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
  sessionStorage.removeItem("adminToken");
  sessionStorage.removeItem("adminUser");

  const storage = keepSignedIn ? localStorage : sessionStorage;

  storage.setItem(
    "adminToken",
    ADMIN_SESSION_MARKER,
  );
  storage.setItem("adminUser", serializedUser);
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
  sessionStorage.removeItem("adminToken");
  sessionStorage.removeItem("adminUser");
}
