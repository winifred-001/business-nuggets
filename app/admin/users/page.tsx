"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import { API_URL } from "@/lib/api";

type AdminUser = {
  id: number;

  name: string;
  email: string;

  role: string;

  membershipTier:
    | "free"
    | "premium";

  accountStatus:
    | "active"
    | "overdue"
    | "suspended";

  createdAt: string;
  updatedAt?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] =
    useState<AdminUser[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    editingUser,
    setEditingUser,
  ] =
    useState<AdminUser | null>(
      null,
    );

  const [
    inviteOpen,
    setInviteOpen,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    menuUserId,
    setMenuUserId,
  ] =
    useState<number | null>(
      null,
    );

  /* =========================================
     EDIT FORM
  ========================================= */

  const [
    editName,
    setEditName,
  ] = useState("");

  const [
    editEmail,
    setEditEmail,
  ] = useState("");

  const [
    editMembership,
    setEditMembership,
  ] =
    useState<
      "free" | "premium"
    >("free");

  const [
    editStatus,
    setEditStatus,
  ] =
    useState<
      | "active"
      | "overdue"
      | "suspended"
    >("active");

  /* =========================================
     CREATE FORM
  ========================================= */

  const [
    inviteName,
    setInviteName,
  ] = useState("");

  const [
    inviteEmail,
    setInviteEmail,
  ] = useState("");

  const [
    invitePassword,
    setInvitePassword,
  ] = useState("");

  const [
    inviteMembership,
    setInviteMembership,
  ] =
    useState<
      "free" | "premium"
    >("free");

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

  /* =========================================
     LOAD
  ========================================= */

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const token =
      getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/admin/users`,
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
        throw new Error(
          data.message ||
            "Could not load users.",
        );
      }

      setUsers(
        Array.isArray(data)
          ? data
          : [],
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
     COUNTS
  ========================================= */

  const stats =
    useMemo(() => {
      return {
        total:
          users.length,

        premium:
          users.filter(
            (user) =>
              user.membershipTier ===
              "premium",
          ).length,

        free:
          users.filter(
            (user) =>
              user.membershipTier ===
              "free",
          ).length,

        suspended:
          users.filter(
            (user) =>
              user.accountStatus ===
              "suspended",
          ).length,
      };
    }, [users]);

  /* =========================================
     FILTER
  ========================================= */

  const filteredUsers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return users;
      }

      return users.filter(
        (user) =>
          user.name
            .toLowerCase()
            .includes(
              query,
            ) ||
          user.email
            .toLowerCase()
            .includes(
              query,
            ) ||
          user.membershipTier
            .toLowerCase()
            .includes(
              query,
            ),
      );
    }, [
      users,
      search,
    ]);

  /* =========================================
     EDIT
  ========================================= */

  function openEdit(
    user: AdminUser,
  ) {
    setEditingUser(
      user,
    );

    setEditName(
      user.name,
    );

    setEditEmail(
      user.email,
    );

    setEditMembership(
      user.membershipTier ||
        "free",
    );

    setEditStatus(
      user.accountStatus ||
        "active",
    );

    setMenuUserId(
      null,
    );
  }

  async function saveUser() {
    if (!editingUser) {
      return;
    }

    const token =
      getToken();

    if (!token) return;

    if (
      !editName.trim() ||
      !editEmail.trim()
    ) {
      setError(
        "Name and email are required.",
      );

      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/users/${editingUser.id}`,
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
                name:
                  editName.trim(),

                email:
                  editEmail
                    .trim()
                    .toLowerCase(),

                membershipTier:
                  editMembership,

                accountStatus:
                  editStatus,
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          Array.isArray(
            data.message,
          )
            ? data.message.join(
                ", ",
              )
            : data.message ||
                "Could not update user.",
        );

        return;
      }

      setEditingUser(null);

      setSuccess(
        "User updated successfully.",
      );

      await loadUsers();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     CREATE USER
  ========================================= */

  async function inviteUser() {
    if (
      !inviteName.trim() ||
      !inviteEmail.trim() ||
      !invitePassword
    ) {
      setError(
        "Name, email and initial password are required.",
      );

      return;
    }

    const token =
      getToken();

    if (!token) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/users`,
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
                  inviteName.trim(),

                email:
                  inviteEmail
                    .trim()
                    .toLowerCase(),

                password:
                  invitePassword,

                membershipTier:
                  inviteMembership,

                accountStatus:
                  "active",
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          Array.isArray(
            data.message,
          )
            ? data.message.join(
                ", ",
              )
            : data.message ||
                "Could not create user.",
        );

        return;
      }

      setInviteOpen(
        false,
      );

      setInviteName("");
      setInviteEmail("");
      setInvitePassword("");
      setInviteMembership(
        "free",
      );

      setSuccess(
        "User account created.",
      );

      await loadUsers();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     EXPORT CSV
  ========================================= */

  function exportCsv() {
    const rows = [
      [
        "Name",
        "Email",
        "Plan",
        "Status",
        "Role",
        "Joined",
      ],

      ...filteredUsers.map(
        (user) => [
          user.name,
          user.email,
          user.membershipTier,
          user.accountStatus,
          user.role,
          user.createdAt,
        ],
      ),
    ];

    const csv =
      rows
        .map((row) =>
          row
            .map(
              (value) =>
                `"${String(
                  value,
                ).replace(
                  /"/g,
                  '""',
                )}"`,
            )
            .join(","),
        )
        .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8",
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const link =
      document.createElement(
        "a",
      );

    link.href = url;

    link.download =
      "business-nuggets-users.csv";

    link.click();

    URL.revokeObjectURL(
      url,
    );
  }

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {/* HEADER */}

        <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[32px]">
              Users
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Manage web and
              mobile app members.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={
                exportCsv
              }
              className="h-9 rounded-md border border-white/10 px-4 text-[9px] text-white/50 transition hover:border-[#C8A35A]/30 hover:text-white"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={() =>
                setInviteOpen(
                  true,
                )
              }
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#C8A35A] px-4 text-[9px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
            >
              <Plus
                size={12}
              />

              Invite User
            </button>
          </div>
        </section>

        {/* MESSAGE */}

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

        {/* STATS */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Members"
            value={
              stats.total
            }
          />

          <StatCard
            label="Premium"
            value={
              stats.premium
            }
          />

          <StatCard
            label="Free Tier"
            value={
              stats.free
            }
          />

          <StatCard
            label="Suspended"
            value={
              stats.suspended
            }
          />
        </section>

        {/* SEARCH */}

        <div className="relative mt-5 max-w-[360px]">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
          />

          <input
            value={
              search
            }
            onChange={(
              event,
            ) =>
              setSearch(
                event
                  .target
                  .value,
              )
            }
            placeholder="Search members..."
            className="h-9 w-full rounded-md border border-white/10 bg-[#111111] pl-9 pr-4 text-[9px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/35"
          />
        </div>

        {/* TABLE */}

        <section className="mt-4 overflow-visible rounded-[10px] border border-white/10 bg-[#111111]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-white/[0.07] text-[7px] uppercase tracking-[0.07em] text-white/25">
                  <th className="px-5 py-3 font-medium">
                    Member
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Email
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Plan
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Joined
                  </th>

                  <th className="w-[55px]" />
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({
                    length: 6,
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
                            6
                          }
                          className="px-5 py-4"
                        >
                          <div className="h-5 animate-pulse rounded bg-white/[0.04]" />
                        </td>
                      </tr>
                    ),
                  )
                ) : filteredUsers.length >
                  0 ? (
                  filteredUsers.map(
                    (user) => (
                      <tr
                        key={
                          user.id
                        }
                        className="border-b border-white/[0.05] last:border-0"
                      >
                        <td className="px-5 py-4">
                          <p className="text-[9px] text-white/65">
                            {
                              user.name
                            }
                          </p>

                          {user.role ===
                            "admin" && (
                            <p className="mt-1 text-[7px] text-[#C8A35A]">
                              Admin
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 text-[8px] text-white/40">
                          {
                            user.email
                          }
                        </td>

                        <td className="px-4 py-4 text-[8px] capitalize text-white/45">
                          {
                            user.membershipTier
                          }
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={
                              user.accountStatus
                            }
                          />
                        </td>

                        <td className="px-4 py-4 text-[8px] text-white/35">
                          {formatJoined(
                            user.createdAt,
                          )}
                        </td>

                        <td className="relative px-4 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuUserId(
                                (
                                  current,
                                ) =>
                                  current ===
                                  user.id
                                    ? null
                                    : user.id,
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded text-white/25 transition hover:bg-white/[0.04] hover:text-white"
                          >
                            <MoreHorizontal
                              size={
                                14
                              }
                            />
                          </button>

                          {menuUserId ===
                            user.id && (
                            <div className="absolute right-4 top-[46px] z-40 w-[130px] rounded-md border border-white/10 bg-[#181818] py-1 shadow-xl">
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    user,
                                  )
                                }
                                className="w-full px-4 py-2.5 text-left text-[8px] text-white/55 hover:bg-white/[0.04] hover:text-white"
                              >
                                Manage User
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ),
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-14 text-center text-[10px] text-white/30"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* EDIT USER MODAL */}

        {editingUser && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[470px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[24px]">
                  Manage User
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setEditingUser(
                      null,
                    )
                  }
                  className="text-white/30 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                <Field
                  label="Name"
                  value={
                    editName
                  }
                  onChange={
                    setEditName
                  }
                />

                <Field
                  label="Email"
                  value={
                    editEmail
                  }
                  onChange={
                    setEditEmail
                  }
                />

                <SelectField
                  label="Plan"
                  value={
                    editMembership
                  }
                  onChange={(
                    value,
                  ) =>
                    setEditMembership(
                      value as
                        | "free"
                        | "premium",
                    )
                  }
                  options={[
                    [
                      "free",
                      "Free",
                    ],
                    [
                      "premium",
                      "Premium",
                    ],
                  ]}
                />

                <SelectField
                  label="Status"
                  value={
                    editStatus
                  }
                  onChange={(
                    value,
                  ) =>
                    setEditStatus(
                      value as
                        | "active"
                        | "overdue"
                        | "suspended",
                    )
                  }
                  options={[
                    [
                      "active",
                      "Active",
                    ],
                    [
                      "overdue",
                      "Overdue",
                    ],
                    [
                      "suspended",
                      "Suspended",
                    ],
                  ]}
                />

                <div className="rounded-md border border-[#C8A35A]/20 bg-[#C8A35A]/[0.05] px-4 py-3 text-[10px] leading-5 text-white/40">
                  Admin access and role changes are managed securely from Roles &amp; Access.
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser(
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
                    saveUser
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

        {/* INVITE USER */}

        {inviteOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[470px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[24px]">
                  Invite User
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setInviteOpen(
                      false,
                    )
                  }
                  className="text-white/30 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="mt-2 text-[8px] leading-4 text-white/25">
                Email invitations are
                not connected yet.
                This creates the
                account directly
                using an initial
                password.
              </p>

              <div className="mt-6 grid gap-4">
                <Field
                  label="Name"
                  value={
                    inviteName
                  }
                  onChange={
                    setInviteName
                  }
                />

                <Field
                  label="Email"
                  value={
                    inviteEmail
                  }
                  onChange={
                    setInviteEmail
                  }
                />

                <Field
                  label="Initial Password"
                  value={
                    invitePassword
                  }
                  onChange={
                    setInvitePassword
                  }
                  type="password"
                />

                <SelectField
                  label="Plan"
                  value={
                    inviteMembership
                  }
                  onChange={(
                    value,
                  ) =>
                    setInviteMembership(
                      value as
                        | "free"
                        | "premium",
                    )
                  }
                  options={[
                    [
                      "free",
                      "Free",
                    ],
                    [
                      "premium",
                      "Premium",
                    ],
                  ]}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setInviteOpen(
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
                    inviteUser
                  }
                  className="h-9 rounded-md bg-[#C8A35A] px-5 text-[9px] font-semibold text-[#080808] disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Create User"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
      <p className="text-[8px] text-white/30">
        {label}
      </p>

      <p className="mt-3 font-serif text-[25px] text-white/90">
        {value.toLocaleString()}
      </p>
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status:
    | "active"
    | "overdue"
    | "suspended";
}) {
  const styles = {
    active:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

    overdue:
      "border-red-500/20 bg-red-500/10 text-red-400",

    suspended:
      "border-red-500/20 bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[7px] capitalize ${
        styles[
          status
        ]
      }`}
    >
      {status}
    </span>
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
        className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none focus:border-[#C8A35A]/35"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;

  onChange:
    (
      value: string,
    ) => void;

  options:
    [
      string,
      string,
    ][];
}) {
  return (
    <div>
      <label className="block text-[8px] text-white/35">
        {label}
      </label>

      <select
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white/70 outline-none"
      >
        {options.map(
          ([
            optionValue,
            optionLabel,
          ]) => (
            <option
              key={
                optionValue
              }
              value={
                optionValue
              }
            >
              {
                optionLabel
              }
            </option>
          ),
        )}
      </select>
    </div>
  );
}

function formatJoined(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "2-digit",
      year: "numeric",
    },
  ).format(date);
}
