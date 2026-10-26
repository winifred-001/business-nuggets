"use client";

import PasswordInput from "@/components/PasswordInput";
import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  Loader2,
  LockKeyhole,
  Plus,
  ShieldOff,
  UserPlus,
  X,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import { API_URL } from "@/lib/api";

type AdminRole =
  | "super-admin"
  | "editor"
  | "moderator"
  | "support";

type PermissionKey =
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

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  adminRole: AdminRole;
  accountStatus: string;
  lastLoginAt: string | null;
  createdAt: string;
};

type PromotableUser = {
  id: number;
  name: string;
  email: string;
  membershipTier: string;
  accountStatus: string;
  createdAt: string;
};

type PermissionSet = Record<
  PermissionKey,
  boolean
>;

type PermissionMatrix = Record<
  AdminRole,
  PermissionSet
>;

type RolesResponse = {
  admins: AdminUser[];
  permissions: PermissionMatrix;
  message?: string | string[];
};

type PermissionUpdateResponse = {
  message?: string | string[];
  permissions?: PermissionMatrix;
};

const ROLE_LABELS: Record<
  AdminRole,
  string
> = {
  "super-admin": "Super Admin",
  editor: "Editor",
  moderator: "Moderator",
  support: "Support",
};

const MATRIX: Array<{
  key: PermissionKey;
  label: string;
}> = [
  {
    key: "manageNuggets",
    label: "Manage Nuggets",
  },
  {
    key: "moderateComments",
    label: "Moderate Comments",
  },
  {
    key: "billing",
    label: "Billing",
  },
  {
    key: "manageAdmins",
    label: "Manage Admins",
  },
  {
    key: "manageUsers",
    label: "Manage Users",
  },
  {
    key: "settings",
    label: "Settings",
  },
  {
    key: "viewAnalytics",
    label: "View Analytics",
  },
  {
    key: "manageMobile",
    label: "Manage Mobile",
  },
  {
    key: "manageNotifications",
    label: "Manage Notifications",
  },
  {
    key: "viewAuditLogs",
    label: "View Audit Logs",
  },
];

const ROLES: AdminRole[] = [
  "super-admin",
  "editor",
  "moderator",
  "support",
];

function messageFrom(
  value: {
    message?: string | string[];
  },
  fallback: string,
) {
  if (
    Array.isArray(
      value.message,
    )
  ) {
    return value.message.join(
      ", ",
    );
  }

  return value.message || fallback;
}

export default function AdminRolesPage() {
  const [admins, setAdmins] =
    useState<AdminUser[]>([]);

  const [
    permissions,
    setPermissions,
  ] =
    useState<PermissionMatrix | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    permissionSaving,
    setPermissionSaving,
  ] = useState<string | null>(
    null,
  );

  const [
    canEditPermissions,
    setCanEditPermissions,
  ] = useState(false);

  const [
    currentAdminId,
    setCurrentAdminId,
  ] = useState<number | null>(
    null,
  );

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [addOpen, setAddOpen] =
    useState(false);

  const [
    promoteOpen,
    setPromoteOpen,
  ] = useState(false);

  const [
    promotableUsers,
    setPromotableUsers,
  ] = useState<PromotableUser[]>(
    [],
  );

  const [
    promotableLoading,
    setPromotableLoading,
  ] = useState(false);

  const [
    promoteUserId,
    setPromoteUserId,
  ] = useState("");

  const [
    promoteRole,
    setPromoteRole,
  ] = useState<AdminRole>(
    "editor",
  );

  const [
    editingAdmin,
    setEditingAdmin,
  ] =
    useState<AdminUser | null>(
      null,
    );

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    newRole,
    setNewRole,
  ] =
    useState<AdminRole>(
      "editor",
    );

  const [
    editRole,
    setEditRole,
  ] =
    useState<AdminRole>(
      "editor",
    );

  const [
    editStatus,
    setEditStatus,
  ] = useState<
    "active" | "suspended"
  >("active");

  function getToken() {
    return (
      localStorage.getItem(
        "adminToken",
      ) ||
      sessionStorage.getItem(
        "adminToken",
      )
    );
  }

  useEffect(() => {
    const rawUser =
      localStorage.getItem(
        "adminUser",
      ) ||
      sessionStorage.getItem(
        "adminUser",
      );

    if (rawUser) {
      try {
        const user =
          JSON.parse(
            rawUser,
          ) as Partial<AdminUser>;

        setCurrentAdminId(
          typeof user.id ===
          "number"
            ? user.id
            : null,
        );

        setCanEditPermissions(
          user.role === "owner" ||
            user.adminRole ===
              "super-admin",
        );
      } catch {
        setCurrentAdminId(null);
        setCanEditPermissions(
          false,
        );
      }
    }

    void loadRoles();
  }, []);

  async function loadRoles() {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/admin/roles`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data: RolesResponse =
        await response
          .json()
          .catch(
            () =>
              ({
                admins: [],
                permissions:
                  null,
              }) as unknown as RolesResponse,
          );

      if (!response.ok) {
        throw new Error(
          messageFrom(
            data,
            "Could not load admin roles.",
          ),
        );
      }

      setAdmins(
        data.admins ?? [],
      );

      setPermissions(
        data.permissions,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPromotableUsers() {
    const token = getToken();

    if (!token) {
      return;
    }

    setPromotableLoading(true);

    try {
      const response =
        await fetch(
          `${API_URL}/admin/roles/promotable-users`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response
          .json()
          .catch(() => []);

      if (!response.ok) {
        setError(
          messageFrom(
            data,
            "Could not load users available for promotion.",
          ),
        );
        return;
      }

      setPromotableUsers(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setPromotableLoading(false);
    }
  }

  async function openPromotion() {
    setError("");
    setSuccess("");
    setPromoteUserId("");
    setPromoteRole("editor");
    setPromoteOpen(true);
    await loadPromotableUsers();
  }

  async function togglePermission(
    role: AdminRole,
    permission: PermissionKey,
  ) {
    if (
      !permissions ||
      role === "super-admin" ||
      !canEditPermissions
    ) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    const currentValue =
      permissions[role][permission];

    const savingKey =
      `${role}:${permission}`;

    setPermissionSaving(
      savingKey,
    );
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/roles/permissions`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              role,
              permission,
              enabled:
                !currentValue,
            }),
          },
        );

      const data:
        PermissionUpdateResponse =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (
        !response.ok ||
        !data.permissions
      ) {
        setError(
          messageFrom(
            data,
            "Could not update role permission.",
          ),
        );
        return;
      }

      setPermissions(
        data.permissions,
      );

      setSuccess(
        `${ROLE_LABELS[role]} permissions updated.`,
      );
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setPermissionSaving(
        null,
      );
    }
  }

  async function addAdmin() {
    if (
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      setError(
        "Name, email and initial password are required.",
      );
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/roles/admins`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              name:
                name.trim(),
              email:
                email
                  .trim()
                  .toLowerCase(),
              password,
              adminRole:
                newRole,
            }),
          },
        );

      const data =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (!response.ok) {
        setError(
          messageFrom(
            data,
            "Could not create admin.",
          ),
        );
        return;
      }

      setAddOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setNewRole("editor");
      setSuccess(
        "Admin account created.",
      );

      await loadRoles();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function promoteExistingUser() {
    if (!promoteUserId) {
      setError(
        "Select a registered user to promote.",
      );
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/roles/users/${promoteUserId}/promote`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              adminRole:
                promoteRole,
            }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          messageFrom(
            data,
            "Could not promote user.",
          ),
        );
        return;
      }

      const promoted =
        promotableUsers.find(
          (user) =>
            String(user.id) ===
            promoteUserId,
        );

      setPromoteOpen(false);
      setPromoteUserId("");
      setPromoteRole("editor");
      setSuccess(
        promoted
          ? `${promoted.name} is now ${ROLE_LABELS[promoteRole]}.`
          : "User promoted to admin successfully.",
      );

      await loadRoles();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openEdit(
    admin: AdminUser,
  ) {
    if (
      admin.role === "owner" ||
      admin.id ===
        currentAdminId
    ) {
      return;
    }

    setEditingAdmin(admin);
    setEditRole(
      admin.adminRole,
    );
    setEditStatus(
      admin.accountStatus ===
        "suspended"
        ? "suspended"
        : "active",
    );
  }

  async function saveAdmin() {
    if (!editingAdmin) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/roles/admins/${editingAdmin.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              adminRole:
                editRole,
              accountStatus:
                editStatus,
            }),
          },
        );

      const data =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (!response.ok) {
        setError(
          messageFrom(
            data,
            "Could not update admin.",
          ),
        );
        return;
      }

      setEditingAdmin(null);
      setSuccess(
        "Admin access updated.",
      );

      await loadRoles();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeAdminAccess() {
    if (!editingAdmin) {
      return;
    }

    const confirmed =
      window.confirm(
        `Remove admin access from ${editingAdmin.name}? Their normal user account and existing data will remain.`,
      );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/roles/admins/${editingAdmin.id}/demote`,
          {
            method: "PATCH",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          messageFrom(
            data,
            "Could not remove admin access.",
          ),
        );
        return;
      }

      const name =
        editingAdmin.name;

      setEditingAdmin(null);
      setSuccess(
        `${name} no longer has admin access.`,
      );

      await loadRoles();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[40px] leading-tight">
              Roles & Access
            </h1>
            <p className="mt-2 text-[14px] text-white/40">
              Control admin access, promote registered users, and manage what each role can do.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                void openPromotion()
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#C8A35A]/40 px-4 text-[14px] font-semibold text-[#E0C48A] transition hover:bg-[#C8A35A]/10"
            >
              <UserPlus size={16} />
              Promote User
            </button>

            <button
              type="button"
              onClick={() =>
                setAddOpen(true)
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#C8A35A] px-4 text-[14px] font-semibold text-[#080808] hover:bg-[#E0C48A]"
            >
              <Plus size={15} />
              Add New Admin
            </button>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[14px] text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3">
            <Check
              size={15}
              className="text-emerald-400"
            />
            <span className="text-[14px] text-emerald-400">
              {success}
            </span>
          </div>
        )}

        <section className="mt-6 overflow-hidden rounded-[10px] border border-white/10 bg-[#111111]">
          <div className="border-b border-white/[0.07] px-5 py-4">
            <h2 className="font-serif text-[28px]">
              Admin Team
            </h2>
            <p className="mt-1 text-[14px] text-white/35">
              Existing users keep their account data when promoted. Removing admin access returns them to a standard user account.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[14px] text-white/35">
                  <th className="px-5 py-3 font-medium">
                    Name
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Email
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Role
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Last Login
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({
                    length: 4,
                  }).map(
                    (_, index) => (
                      <tr
                        key={index}
                        className="border-b border-white/[0.05]"
                      >
                        <td
                          colSpan={5}
                          className="px-5 py-4"
                        >
                          <div className="h-5 animate-pulse rounded bg-white/[0.04]" />
                        </td>
                      </tr>
                    ),
                  )
                ) : admins.length > 0 ? (
                  admins.map(
                    (admin) => {
                      const editable =
                        admin.role !==
                          "owner" &&
                        admin.id !==
                          currentAdminId;

                      return (
                        <tr
                          key={
                            admin.id
                          }
                          onClick={() =>
                            openEdit(
                              admin,
                            )
                          }
                          className={`border-b border-white/[0.05] last:border-0 ${
                            editable
                              ? "cursor-pointer hover:bg-white/[0.02]"
                              : ""
                          }`}
                        >
                          <td className="px-5 py-4 text-[14px] text-white/70">
                            {admin.name}
                            {admin.id ===
                              currentAdminId && (
                              <span className="ml-2 text-[12px] text-[#C8A35A]">
                                You
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-[14px] text-white/45">
                            {admin.email}
                          </td>
                          <td className="px-4 py-4 text-[14px] text-white/55">
                            {
                              ROLE_LABELS[
                                admin.adminRole
                              ]
                            }
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge
                              status={
                                admin.accountStatus
                              }
                            />
                          </td>
                          <td className="px-4 py-4 text-[14px] text-white/45">
                            {formatLastLogin(
                              admin.lastLoginAt,
                            )}
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-[14px] text-white/35"
                    >
                      No admin accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 overflow-x-auto rounded-[10px] border border-white/10 bg-[#111111] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-serif text-[28px]">
                Permissions Matrix
              </h2>
              <p className="mt-2 max-w-[760px] text-[14px] leading-6 text-white/40">
                Check or uncheck permissions for Editor, Moderator and Support. Changes save immediately and control the backend access guard.
              </p>
            </div>

            {!canEditPermissions && (
              <div className="inline-flex items-center gap-2 text-[14px] text-white/35">
                <LockKeyhole
                  size={14}
                />
                Super Admin only
              </div>
            )}
          </div>

          <div className="mt-5 min-w-[860px]">
            <div className="grid grid-cols-[1.8fr_repeat(4,1fr)] border-b border-white/[0.07] pb-3">
              <div />

              {ROLES.map(
                (role) => (
                  <div
                    key={role}
                    className="text-center"
                  >
                    <p className="text-[14px] font-medium text-[#C8A35A]">
                      {
                        ROLE_LABELS[
                          role
                        ]
                      }
                    </p>
                    {role ===
                      "super-admin" && (
                      <p className="mt-1 text-[12px] text-white/25">
                        Locked
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>

            {MATRIX.map(
              (row) => (
                <div
                  key={row.key}
                  className="grid grid-cols-[1.8fr_repeat(4,1fr)] items-center border-b border-white/[0.05] py-3 last:border-0"
                >
                  <p className="text-[14px] text-white/60">
                    {row.label}
                  </p>

                  {ROLES.map(
                    (role) => {
                      const enabled =
                        permissions?.[
                          role
                        ]?.[
                          row.key
                        ] ?? false;

                      const savingKey =
                        `${role}:${row.key}`;

                      const isSaving =
                        permissionSaving ===
                        savingKey;

                      const disabled =
                        role ===
                          "super-admin" ||
                        !canEditPermissions ||
                        !permissions ||
                        Boolean(
                          permissionSaving,
                        );

                      return (
                        <div
                          key={role}
                          className="flex justify-center"
                        >
                          <button
                            type="button"
                            aria-label={`${
                              enabled
                                ? "Disable"
                                : "Enable"
                            } ${row.label} for ${ROLE_LABELS[role]}`}
                            aria-pressed={
                              enabled
                            }
                            disabled={
                              disabled
                            }
                            onClick={() =>
                              void togglePermission(
                                role,
                                row.key,
                              )
                            }
                            className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
                              enabled
                                ? "border-[#C8A35A]/45 bg-[#C8A35A]/15 text-[#C8A35A]"
                                : "border-white/10 bg-[#080808] text-white/20"
                            } ${
                              disabled
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer hover:border-[#C8A35A]/60 hover:bg-[#C8A35A]/10"
                            }`}
                          >
                            {isSaving ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : enabled ? (
                              <Check
                                size={14}
                              />
                            ) : null}
                          </button>
                        </div>
                      );
                    },
                  )}
                </div>
              ),
            )}
          </div>
        </section>

        {promoteOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[500px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
              <ModalHeader
                title="Promote Existing User"
                onClose={() =>
                  setPromoteOpen(false)
                }
              />

              <p className="mt-2 text-[14px] leading-6 text-white/40">
                Promote an existing active Business Nuggets user. Their password, membership, saved content and profile stay unchanged.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-[14px] text-white/45">
                    Registered User
                  </label>

                  <select
                    value={
                      promoteUserId
                    }
                    onChange={(event) =>
                      setPromoteUserId(
                        event.target.value,
                      )
                    }
                    disabled={
                      promotableLoading
                    }
                    className="mt-2 min-h-11 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[14px] text-white/70 outline-none focus:border-[#C8A35A]/40"
                  >
                    <option value="">
                      {promotableLoading
                        ? "Loading users..."
                        : "Select a user"}
                    </option>
                    {promotableUsers.map(
                      (user) => (
                        <option
                          key={user.id}
                          value={user.id}
                        >
                          {user.name} · {user.email}
                        </option>
                      ),
                    )}
                  </select>

                  {!promotableLoading &&
                    promotableUsers.length ===
                      0 && (
                      <p className="mt-2 text-[13px] text-white/30">
                        There are no active standard users available for promotion.
                      </p>
                    )}
                </div>

                <RoleSelect
                  value={promoteRole}
                  onChange={
                    setPromoteRole
                  }
                  allowSuperAdmin={
                    canEditPermissions
                  }
                />

                {promoteRole ===
                  "super-admin" && (
                  <div className="rounded-md border border-[#B7791F]/30 bg-[#B7791F]/10 px-4 py-3 text-[13px] leading-5 text-[#E0C48A]">
                    Super Admin has full administrative authority. Only an existing Super Admin can assign this role.
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setPromoteOpen(false)
                  }
                  className="min-h-11 rounded-md border border-white/10 px-4 text-[14px] text-white/50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    saving ||
                    !promoteUserId
                  }
                  onClick={() =>
                    void promoteExistingUser()
                  }
                  className="min-h-11 rounded-md bg-[#C8A35A] px-5 text-[14px] font-semibold text-[#080808] disabled:opacity-50"
                >
                  {saving
                    ? "Promoting..."
                    : "Promote User"}
                </button>
              </div>
            </div>
          </div>
        )}

        {addOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[470px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
              <ModalHeader
                title="Add New Admin"
                onClose={() =>
                  setAddOpen(false)
                }
              />

              <p className="mt-2 text-[14px] leading-6 text-white/40">
                Use this only for a person who does not already have a Business Nuggets account. Existing users should be promoted instead.
              </p>

              <div className="mt-6 space-y-4">
                <Field
                  label="Name"
                  value={name}
                  onChange={setName}
                />
                <Field
                  label="Email"
                  value={email}
                  onChange={setEmail}
                />
                <Field
                  label="Initial Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                />
                <RoleSelect
                  value={newRole}
                  onChange={
                    setNewRole
                  }
                  allowSuperAdmin={false}
                />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setAddOpen(false)
                  }
                  className="min-h-11 rounded-md border border-white/10 px-4 text-[14px] text-white/50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void addAdmin()
                  }
                  className="min-h-11 rounded-md bg-[#C8A35A] px-5 text-[14px] font-semibold text-[#080808] disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Add Admin"}
                </button>
              </div>
            </div>
          </div>
        )}

        {editingAdmin && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[470px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
              <ModalHeader
                title="Manage Admin"
                onClose={() =>
                  setEditingAdmin(
                    null,
                  )
                }
              />

              <p className="mt-2 text-[14px] text-white/35">
                {editingAdmin.name}{" "}
                · {editingAdmin.email}
              </p>

              <div className="mt-6 space-y-4">
                <RoleSelect
                  value={editRole}
                  onChange={
                    setEditRole
                  }
                  allowSuperAdmin={
                    canEditPermissions
                  }
                />

                <div>
                  <label className="block text-[14px] text-white/45">
                    Status
                  </label>
                  <select
                    value={
                      editStatus
                    }
                    onChange={(
                      event,
                    ) =>
                      setEditStatus(
                        event.target
                          .value as
                          | "active"
                          | "suspended",
                      )
                    }
                    className="mt-2 min-h-11 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[14px] text-white/70 outline-none"
                  >
                    <option value="active">
                      Active
                    </option>
                    <option value="suspended">
                      Suspended
                    </option>
                  </select>
                </div>
              </div>

              <div className="mt-6 border-t border-white/[0.07] pt-5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void removeAdminAccess()
                  }
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[#B54A4A]/35 bg-[#B54A4A]/[0.06] px-4 text-[14px] font-medium text-red-300 transition hover:bg-[#B54A4A]/10 disabled:opacity-50"
                >
                  <ShieldOff size={16} />
                  Remove Admin Access
                </button>
                <p className="mt-2 text-[12px] leading-5 text-white/25">
                  This does not delete the person. Their account returns to a standard user account.
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setEditingAdmin(
                      null,
                    )
                  }
                  className="min-h-11 rounded-md border border-white/10 px-4 text-[14px] text-white/50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void saveAdmin()
                  }
                  className="min-h-11 rounded-md bg-[#C8A35A] px-5 text-[14px] font-semibold text-[#080808] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  type?: string;
}) {
  const Input = type === "password" ? PasswordInput : "input";

  return (
    <div>
      <label className="block text-[14px] text-white/45">
        {label}
      </label>
      <Input
        {...(type === "password" ? { visibilityLabel: label.toLowerCase(), "aria-label": label } : { type })}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="mt-2 min-h-11 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[14px] text-white outline-none focus:border-[#C8A35A]/30"
      />
    </div>
  );
}

function RoleSelect({
  value,
  onChange,
  allowSuperAdmin = true,
}: {
  value: AdminRole;
  onChange: (
    value: AdminRole,
  ) => void;
  allowSuperAdmin?: boolean;
}) {
  const roles =
    allowSuperAdmin
      ? ROLES
      : ROLES.filter(
          (role) =>
            role !==
            "super-admin",
        );

  return (
    <div>
      <label className="block text-[14px] text-white/45">
        Role
      </label>
      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target
              .value as AdminRole,
          )
        }
        className="mt-2 min-h-11 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[14px] text-white/70 outline-none"
      >
        {roles.map(
          (role) => (
            <option
              key={role}
              value={role}
            >
              {ROLE_LABELS[role]}
            </option>
          ),
        )}
      </select>
    </div>
  );
}

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-serif text-[28px]">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="text-white/30 hover:text-white"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const active =
    status !== "suspended";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[12px] ${
        active
          ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400"
          : "border-red-500/20 bg-red-500/[0.08] text-red-400"
      }`}
    >
      {active
        ? "Active"
        : "Suspended"}
    </span>
  );
}

function formatLastLogin(
  value: string | null,
) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  const today = new Date();

  if (
    date.toDateString() ===
    today.toDateString()
  ) {
    return "Today";
  }

  const yesterday =
    new Date();

  yesterday.setDate(
    yesterday.getDate() - 1,
  );

  if (
    date.toDateString() ===
    yesterday.toDateString()
  ) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "2-digit",
    },
  ).format(date);
}
