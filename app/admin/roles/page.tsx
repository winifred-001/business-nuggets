"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  Plus,
  X,
} from "lucide-react";

import AdminShell from "@/components/AdminShell";
import { API_URL } from "@/lib/api";

type AdminRole =
  | "super-admin"
  | "editor"
  | "moderator"
  | "support";

type AdminUser = {
  id: number;

  name: string;
  email: string;

  role: string;

  adminRole:
    AdminRole;

  accountStatus:
    string;

  lastLoginAt:
    | string
    | null;

  createdAt: string;
};

type PermissionSet = {
  manageNuggets: boolean;
  moderateComments: boolean;
  billing: boolean;
  manageAdmins: boolean;
  settings: boolean;
};

type RolesResponse = {
  admins:
    AdminUser[];

  permissions: Record<
    AdminRole,
    PermissionSet
  >;
};

const ROLE_LABELS:
  Record<
    AdminRole,
    string
  > = {
  "super-admin":
    "Super Admin",

  editor:
    "Editor",

  moderator:
    "Moderator",

  support:
    "Support",
};

const MATRIX = [
  {
    key:
      "manageNuggets",
    label:
      "Manage Nuggets",
  },

  {
    key:
      "moderateComments",
    label:
      "Moderate Comments",
  },

  {
    key:
      "billing",
    label:
      "Billing",
  },

  {
    key:
      "manageAdmins",
    label:
      "Manage Admins",
  },

  {
    key:
      "settings",
    label:
      "Settings",
  },
] as const;

const ROLES:
  AdminRole[] = [
  "super-admin",
  "editor",
  "moderator",
  "support",
];

export default function AdminRolesPage() {
  const [
    admins,
    setAdmins,
  ] =
    useState<
      AdminUser[]
    >([]);

  const [
    permissions,
    setPermissions,
  ] =
    useState<
      RolesResponse["permissions"] | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    addOpen,
    setAddOpen,
  ] =
    useState(false);

  const [
    editingAdmin,
    setEditingAdmin,
  ] =
    useState<AdminUser | null>(
      null,
    );

  /* ADD ADMIN */

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    newRole,
    setNewRole,
  ] =
    useState<AdminRole>(
      "editor",
    );

  /* EDIT ADMIN */

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
  ] =
    useState<
      "active" |
      "suspended"
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
    loadRoles();
  }, []);

  async function loadRoles() {
    const token =
      getToken();

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

      const data:
        RolesResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          "Could not load admin roles.",
        );
      }

      setAdmins(
        data.admins ??
          [],
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

  /* =========================================
     ADD ADMIN
  ========================================= */

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

    const token =
      getToken();

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
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
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
          data.message ||
            "Could not create admin.",
        );

        return;
      }

      setAddOpen(
        false,
      );

      setName("");
      setEmail("");
      setPassword("");
      setNewRole(
        "editor",
      );

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

  /* =========================================
     MANAGE ADMIN
  ========================================= */

  function openEdit(
    admin: AdminUser,
  ) {
    if (
      admin.role ===
      "owner"
    ) {
      return;
    }

    setEditingAdmin(
      admin,
    );

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

    const token =
      getToken();

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
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
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
          data.message ||
            "Could not update admin.",
        );

        return;
      }

      setEditingAdmin(
        null,
      );

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

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {/* HEADER */}

        <section className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[32px]">
              Roles & Access
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Control what each
              admin can see and
              do.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setAddOpen(
                true,
              )
            }
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#C8A35A] px-4 text-[8px] font-semibold text-[#080808] hover:bg-[#E0C48A]"
          >
            <Plus
              size={11}
            />

            Add Admin
          </button>
        </section>

        {error && (
          <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[10px] text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3">
            <Check
              size={12}
              className="text-emerald-400"
            />

            <span className="text-[10px] text-emerald-400">
              {success}
            </span>
          </div>
        )}

        {/* ADMIN TEAM */}

        <section className="mt-6 overflow-hidden rounded-[10px] border border-white/10 bg-[#111111]">
          <div className="border-b border-white/[0.07] px-5 py-4">
            <h2 className="font-serif text-[18px]">
              Admin Team
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[7px] uppercase tracking-[0.06em] text-white/25">
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
                    (
                      _,
                      index,
                    ) => (
                      <tr
                        key={
                          index
                        }
                        className="border-b border-white/[0.05]"
                      >
                        <td
                          colSpan={
                            5
                          }
                          className="px-5 py-4"
                        >
                          <div className="h-4 animate-pulse rounded bg-white/[0.04]" />
                        </td>
                      </tr>
                    ),
                  )
                ) : (
                  admins.map(
                    (
                      admin,
                    ) => (
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
                          admin.role !==
                          "owner"
                            ? "cursor-pointer hover:bg-white/[0.02]"
                            : ""
                        }`}
                      >
                        <td className="px-5 py-4 text-[8px] text-white/60">
                          {
                            admin.name
                          }
                        </td>

                        <td className="px-4 py-4 text-[8px] text-white/35">
                          {
                            admin.email
                          }
                        </td>

                        <td className="px-4 py-4 text-[8px] text-white/40">
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

                        <td className="px-4 py-4 text-[8px] text-white/35">
                          {formatLastLogin(
                            admin.lastLoginAt,
                          )}
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* PERMISSION MATRIX */}

        <section className="mt-5 overflow-x-auto rounded-[10px] border border-white/10 bg-[#111111] p-5">
          <h2 className="font-serif text-[18px]">
            Permissions Matrix
          </h2>

          <div className="mt-4 min-w-[700px]">
            <div className="grid grid-cols-[1.6fr_repeat(4,1fr)] border-b border-white/[0.07] pb-3">
              <div />

              {ROLES.map(
                (role) => (
                  <p
                    key={
                      role
                    }
                    className="text-center text-[7px] font-medium text-[#C8A35A]"
                  >
                    {
                      ROLE_LABELS[
                        role
                      ]
                    }
                  </p>
                ),
              )}
            </div>

            {MATRIX.map(
              (row) => (
                <div
                  key={
                    row.key
                  }
                  className="grid grid-cols-[1.6fr_repeat(4,1fr)] items-center border-b border-white/[0.05] py-3 last:border-0"
                >
                  <p className="text-[8px] text-white/55">
                    {
                      row.label
                    }
                  </p>

                  {ROLES.map(
                    (role) => {
                      const enabled =
                        permissions?.[
                          role
                        ]?.[
                          row.key
                        ] ??
                        false;

                      return (
                        <div
                          key={
                            role
                          }
                          className="flex justify-center"
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded-[3px] border ${
                              enabled
                                ? "border-[#C8A35A]/35 bg-[#C8A35A]/15"
                                : "border-white/[0.08] bg-[#080808]"
                            }`}
                          >
                            {enabled && (
                              <Check
                                size={
                                  9
                                }
                                className="text-[#C8A35A]"
                              />
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              ),
            )}
          </div>
        </section>

        {/* ADD ADMIN MODAL */}

        {addOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[470px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
              <ModalHeader
                title="Add Admin"
                onClose={() =>
                  setAddOpen(
                    false,
                  )
                }
              />

              <div className="mt-6 space-y-4">
                <Field
                  label="Name"
                  value={
                    name
                  }
                  onChange={
                    setName
                  }
                />

                <Field
                  label="Email"
                  value={
                    email
                  }
                  onChange={
                    setEmail
                  }
                />

                <Field
                  label="Initial Password"
                  type="password"
                  value={
                    password
                  }
                  onChange={
                    setPassword
                  }
                />

                <RoleSelect
                  value={
                    newRole
                  }
                  onChange={
                    setNewRole
                  }
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setAddOpen(
                      false,
                    )
                  }
                  className="h-9 rounded-md border border-white/10 px-4 text-[9px] text-white/40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    addAdmin
                  }
                  className="h-9 rounded-md bg-[#C8A35A] px-5 text-[9px] font-semibold text-[#080808] disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Add Admin"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT ADMIN */}

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

              <p className="mt-2 text-[8px] text-white/30">
                {
                  editingAdmin.name
                }{" "}
                ·{" "}
                {
                  editingAdmin.email
                }
              </p>

              <div className="mt-6 space-y-4">
                <RoleSelect
                  value={
                    editRole
                  }
                  onChange={
                    setEditRole
                  }
                />

                <div>
                  <label className="block text-[8px] text-white/35">
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
                        event
                          .target
                          .value as
                          | "active"
                          | "suspended",
                      )
                    }
                    className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[9px] text-white/65 outline-none"
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

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEditingAdmin(
                      null,
                    )
                  }
                  className="h-9 rounded-md border border-white/10 px-4 text-[9px] text-white/40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    saveAdmin
                  }
                  className="h-9 rounded-md bg-[#C8A35A] px-5 text-[9px] font-semibold text-[#080808] disabled:opacity-50"
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

  onChange:
    (
      value: string,
    ) => void;

  type?: string;
}) {
  return (
    <div>
      <label className="block text-[8px] text-white/35">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[9px] text-white outline-none focus:border-[#C8A35A]/30"
      />
    </div>
  );
}

function RoleSelect({
  value,
  onChange,
}: {
  value: AdminRole;

  onChange:
    (
      value:
        AdminRole,
    ) => void;
}) {
  return (
    <div>
      <label className="block text-[8px] text-white/35">
        Role
      </label>

      <select
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value as
              AdminRole,
          )
        }
        className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[9px] text-white/65 outline-none"
      >
        {ROLES.map(
          (role) => (
            <option
              key={
                role
              }
              value={
                role
              }
            >
              {
                ROLE_LABELS[
                  role
                ]
              }
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

  onClose:
    () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-serif text-[24px]">
        {title}
      </h2>

      <button
        type="button"
        onClick={
          onClose
        }
        className="text-white/30 hover:text-white"
      >
        <X
          size={16}
        />
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
    status !==
    "suspended";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[6px] ${
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
  value:
    | string
    | null,
) {
  if (!value) {
    return "Never";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  const today =
    new Date();

  if (
    date.toDateString() ===
    today.toDateString()
  ) {
    return "Today";
  }

  const yesterday =
    new Date();

  yesterday.setDate(
    yesterday.getDate() -
      1,
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
      month:
        "short",

      day:
        "2-digit",
    },
  ).format(date);
}