export type AdminRole =
  | "super-admin"
  | "editor"
  | "moderator"
  | "support";

export type AdminPermission =
  | "manageNuggets"
  | "moderateComments"
  | "billing"
  | "manageAdmins"
  | "manageUsers"
  | "settings"
  | "viewAnalytics"
  | "manageMobile"
  | "manageNotifications"
  | "viewAuditLogs";

export const ADMIN_PERMISSIONS: Record<
  AdminRole,
  Record<AdminPermission, boolean>
> = {
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