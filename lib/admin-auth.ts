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
  challengeToken: string;
  keepSignedIn: boolean;
};

let pendingAdminLogin: PendingAdminLogin | null = null;

const pendingLoginKey =
  "pendingAdminEmailVerification";

export function isAdminAccount(
  user?: Partial<AdminUser> | null,
) {
  return (
    user?.role === "admin" ||
    user?.role === "owner" ||
    Boolean(user?.adminRole)
  );
}

export function setPendingAdminLogin(
  value: PendingAdminLogin,
) {
  pendingAdminLogin =
    value;

  if (
    typeof window !==
    "undefined"
  ) {
    sessionStorage.setItem(
      pendingLoginKey,
      JSON.stringify(value),
    );
  }
}

export function getPendingAdminLogin() {
  if (pendingAdminLogin) {
    return pendingAdminLogin;
  }

  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const serialized =
    sessionStorage.getItem(
      pendingLoginKey,
    );

  if (!serialized) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(
        serialized,
      ) as PendingAdminLogin;

    if (
      !parsed.email ||
      !parsed.challengeToken
    ) {
      clearPendingAdminLogin();
      return null;
    }

    pendingAdminLogin =
      parsed;

    return parsed;
  } catch {
    clearPendingAdminLogin();
    return null;
  }
}

export function clearPendingAdminLogin() {
  pendingAdminLogin =
    null;

  if (
    typeof window !==
    "undefined"
  ) {
    sessionStorage.removeItem(
      pendingLoginKey,
    );
  }
}

export function getAdminToken() {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  return (
    localStorage.getItem(
      "adminToken",
    ) ||
    sessionStorage.getItem(
      "adminToken",
    )
  );
}

export function storeAdminSession(
  token: string,
  user: AdminUser,
  keepSignedIn: boolean,
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const serializedUser =
    JSON.stringify(
      user,
    );

  localStorage.removeItem(
    "adminToken",
  );
  localStorage.removeItem(
    "adminUser",
  );
  sessionStorage.removeItem(
    "adminToken",
  );
  sessionStorage.removeItem(
    "adminUser",
  );

  const storage =
    keepSignedIn
      ? localStorage
      : sessionStorage;

  storage.setItem(
    "adminToken",
    token,
  );
  storage.setItem(
    "adminUser",
    serializedUser,
  );
}

export function clearAdminSession() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    "adminToken",
  );
  localStorage.removeItem(
    "adminUser",
  );
  sessionStorage.removeItem(
    "adminToken",
  );
  sessionStorage.removeItem(
    "adminUser",
  );
}
