import { db } from "../prisma/db";

export type AdminRole =
  | "super-admin"
  | "editor"
  | "moderator"
  | "support";

export const ADMIN_PERMISSION_KEYS = [
  "manageNuggets",
  "moderateComments",
  "billing",
  "manageAdmins",
  "manageUsers",
  "settings",
  "viewAnalytics",
  "manageMobile",
  "manageNotifications",
  "viewAuditLogs",
] as const;

export type AdminPermission =
  (typeof ADMIN_PERMISSION_KEYS)[number];

export type AdminPermissionMatrix = Record<
  AdminRole,
  Record<AdminPermission, boolean>
>;

export const ADMIN_PERMISSIONS: AdminPermissionMatrix = {
  "super-admin": {
    manageNuggets: true,
    moderateComments: true,
    billing: true,
    manageAdmins: true,
    manageUsers: true,
    settings: true,
    viewAnalytics: true,
    manageMobile: true,
    manageNotifications: true,
    viewAuditLogs: true,
  },

  editor: {
    manageNuggets: true,
    moderateComments: false,
    billing: false,
    manageAdmins: false,
    manageUsers: false,
    settings: false,
    viewAnalytics: true,
    manageMobile: false,
    manageNotifications: false,
    viewAuditLogs: false,
  },

  moderator: {
    manageNuggets: false,
    moderateComments: true,
    billing: false,
    manageAdmins: false,
    manageUsers: false,
    settings: false,
    viewAnalytics: false,
    manageMobile: false,
    manageNotifications: false,
    viewAuditLogs: false,
  },

  support: {
    manageNuggets: false,
    moderateComments: false,
    billing: true,
    manageAdmins: false,
    manageUsers: true,
    settings: false,
    viewAnalytics: false,
    manageMobile: false,
    manageNotifications: false,
    viewAuditLogs: false,
  },
};

const ADMIN_ROLES: AdminRole[] = [
  "super-admin",
  "editor",
  "moderator",
  "support",
];

let permissionsTableReady = false;

function cloneDefaultPermissions(): AdminPermissionMatrix {
  return {
    "super-admin": {
      ...ADMIN_PERMISSIONS["super-admin"],
    },
    editor: {
      ...ADMIN_PERMISSIONS.editor,
    },
    moderator: {
      ...ADMIN_PERMISSIONS.moderator,
    },
    support: {
      ...ADMIN_PERMISSIONS.support,
    },
  };
}

export function isAdminRole(
  value: string,
): value is AdminRole {
  return ADMIN_ROLES.includes(
    value as AdminRole,
  );
}

export function isAdminPermission(
  value: string,
): value is AdminPermission {
  return ADMIN_PERMISSION_KEYS.includes(
    value as AdminPermission,
  );
}

async function ensurePermissionsTable() {
  if (permissionsTableReady) {
    return;
  }

  await db.runtime().execute(
    db.raw.sql`
      CREATE TABLE IF NOT EXISTS "AdminRolePermission" (
        "role" text NOT NULL,
        "permission" text NOT NULL,
        "enabled" boolean NOT NULL,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("role", "permission")
      )
    `
      .affectedCount()
      .build(),
  );

  permissionsTableReady = true;
}

export async function getAdminPermissionMatrix(): Promise<AdminPermissionMatrix> {
  const matrix =
    cloneDefaultPermissions();

  try {
    await ensurePermissionsTable();

    const rows =
      await db.runtime().query(
        db.raw.sql`
          SELECT "role", "permission", "enabled"
          FROM "AdminRolePermission"
        `
          .returnsRow({
            role: "pg/text@1",
            permission: "pg/text@1",
            enabled: "pg/bool@1",
          })
          .build(),
      );

    for (const row of rows) {
      const role = row.role;
      const permission = row.permission;

      if (
        !isAdminRole(role) ||
        !isAdminPermission(permission) ||
        role === "super-admin"
      ) {
        continue;
      }

      matrix[role][permission] =
        row.enabled;
    }
  } catch (error) {
    console.error(
      "Could not load persisted admin permissions; using defaults:",
      error,
    );
  }

  // Super Admin is intentionally immutable to prevent console lockout.
  matrix["super-admin"] = {
    ...ADMIN_PERMISSIONS["super-admin"],
  };

  return matrix;
}

export async function setAdminRolePermission(
  role: AdminRole,
  permission: AdminPermission,
  enabled: boolean,
) {
  if (role === "super-admin") {
    throw new Error(
      "Super Admin permissions cannot be changed",
    );
  }

  await ensurePermissionsTable();

  await db.runtime().execute(
    db.raw.sql`
      INSERT INTO "AdminRolePermission" (
        "role",
        "permission",
        "enabled",
        "updatedAt"
      )
      VALUES (
        ${role},
        ${permission},
        ${enabled},
        now()
      )
      ON CONFLICT ("role", "permission")
      DO UPDATE SET
        "enabled" = EXCLUDED."enabled",
        "updatedAt" = now()
    `
      .affectedCount()
      .build(),
  );

  return getAdminPermissionMatrix();
}
