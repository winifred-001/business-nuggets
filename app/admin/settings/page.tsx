"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Check,
} from "lucide-react";

import AdminShell from "@/components/AdminShell";
import { API_URL } from "@/lib/api";

type Settings = {
  id: number;

  siteName: string;
  tagline: string;
  supportEmail: string;

  timezone: string;
  defaultLanguage: string;
  dailyPublishTime: string;

  twoFactorAdmins: boolean;
  sessionTimeoutMinutes: number;
  ipAllowListEnabled: boolean;

  maintenanceMode: boolean;
};

const TABS = [
  "General",
  "Branding",
  "Payments",
  "Integrations",
  "Security",
];

export default function AdminSettingsPage() {
  const [
    settings,
    setSettings,
  ] =
    useState<Settings | null>(
      null,
    );

  const [
    activeTab,
    setActiveTab,
  ] =
    useState("General");

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
    loadSettings();
  }, []);

  async function loadSettings() {
    const token =
      getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/admin/settings`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not load settings.",
        );
      }

      setSettings(
        data,
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

  function updateField<
    K extends keyof Settings,
  >(
    key: K,
    value: Settings[K],
  ) {
    if (!settings) {
      return;
    }

    setSettings({
      ...settings,

      [key]:
        value,
    });
  }

  async function saveChanges() {
    if (!settings) {
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
      const generalResponse =
        await fetch(
          `${API_URL}/admin/settings/general`,
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
                siteName:
                  settings.siteName,

                tagline:
                  settings.tagline,

                supportEmail:
                  settings.supportEmail,

                timezone:
                  settings.timezone,

                defaultLanguage:
                  settings.defaultLanguage,

                dailyPublishTime:
                  settings.dailyPublishTime,
              }),
          },
        );

      const generalData =
        await generalResponse
          .json()
          .catch(() => ({}));

      if (!generalResponse.ok) {
        setError(
          generalData.message ||
            "Could not save general settings.",
        );

        return;
      }

      const securityResponse =
        await fetch(
          `${API_URL}/admin/settings/security`,
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
                twoFactorAdmins:
                  settings.twoFactorAdmins,

                sessionTimeoutMinutes:
                  settings.sessionTimeoutMinutes,

                ipAllowListEnabled:
                  settings.ipAllowListEnabled,
              }),
          },
        );

      const securityData =
        await securityResponse
          .json()
          .catch(() => ({}));

      if (!securityResponse.ok) {
        setError(
          securityData.message ||
            "Could not save security settings.",
        );

        return;
      }

      setSuccess(
        "Settings saved successfully.",
      );

      await loadSettings();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleMaintenance() {
    if (!settings) {
      return;
    }

    const token =
      getToken();

    if (!token) {
      return;
    }

    const enabled =
      !settings.maintenanceMode;

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/settings/maintenance`,
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
                enabled,
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ||
            "Could not update maintenance mode.",
        );

        return;
      }

      setSettings(
        data,
      );

      setSuccess(
        enabled
          ? "Maintenance mode enabled."
          : "Maintenance mode disabled.",
      );
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (
    loading &&
    !settings
  ) {
    return (
      <AdminShell>
        <main className="px-4 py-6 sm:px-6 lg:px-7">
          <p className="text-[10px] text-white/30">
            Loading settings...
          </p>
        </main>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {/* HEADER */}

        <section>
          <h1 className="font-serif text-[32px]">
            Settings
          </h1>

          <p className="mt-2 text-[10px] text-white/35">
            Configure Business
            Nuggets for web and
            mobile.
          </p>
        </section>

        {/* TABS */}

        <div className="mt-5 flex gap-6 overflow-x-auto border-b border-white/[0.07]">
          {TABS.map(
            (tab) => {
              const available =
                tab ===
                  "General" ||
                tab ===
                  "Security";

              return (
                <button
                  key={tab}
                  type="button"
                  disabled={
                    !available
                  }
                  onClick={() => {
                    if (
                      available
                    ) {
                      setActiveTab(
                        tab,
                      );
                    }
                  }}
                  className={`relative shrink-0 pb-3 text-[8px] ${
                    activeTab ===
                    tab
                      ? "text-[#C8A35A]"
                      : available
                        ? "text-white/35 hover:text-white/60"
                        : "cursor-not-allowed text-white/20"
                  }`}
                >
                  {tab}

                  {activeTab ===
                    tab && (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#C8A35A]" />
                  )}
                </button>
              );
            },
          )}
        </div>

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

        {settings &&
          activeTab ===
            "General" && (
            <GeneralSettings
              settings={
                settings
              }
              updateField={
                updateField
              }
              saveChanges={
                saveChanges
              }
              toggleMaintenance={
                toggleMaintenance
              }
              saving={
                saving
              }
            />
          )}

        {settings &&
          activeTab ===
            "Security" && (
            <SecuritySettings
              settings={
                settings
              }
              updateField={
                updateField
              }
              saveChanges={
                saveChanges
              }
              saving={
                saving
              }
            />
          )}
      </main>
    </AdminShell>
  );
}

function GeneralSettings({
  settings,
  updateField,
  saveChanges,
  toggleMaintenance,
  saving,
}: {
  settings: Settings;

  updateField:
    <K extends keyof Settings>(
      key: K,
      value: Settings[K],
    ) => void;

  saveChanges:
    () => void;

  toggleMaintenance:
    () => void;

  saving: boolean;
}) {
  return (
    <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(240px,0.8fr)]">
      {/* GENERAL */}

      <article className="flex min-h-[520px] flex-col rounded-[10px] border border-white/10 bg-[#111111] p-6">
        <h2 className="font-serif text-[18px]">
          General Settings
        </h2>

        <div className="mt-6 space-y-4">
          <Field
            label="Site Name"
            value={
              settings.siteName
            }
            onChange={(
              value,
            ) =>
              updateField(
                "siteName",
                value,
              )
            }
          />

          <Field
            label="Tagline"
            value={
              settings.tagline
            }
            onChange={(
              value,
            ) =>
              updateField(
                "tagline",
                value,
              )
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Support Email"
              value={
                settings.supportEmail
              }
              onChange={(
                value,
              ) =>
                updateField(
                  "supportEmail",
                  value,
                )
              }
            />

            <Field
              label="Timezone"
              value={
                settings.timezone
              }
              onChange={(
                value,
              ) =>
                updateField(
                  "timezone",
                  value,
                )
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Default Language"
              value={
                settings.defaultLanguage
              }
              onChange={(
                value,
              ) =>
                updateField(
                  "defaultLanguage",
                  value,
                )
              }
            />

            <Field
              label="Daily Publish Time"
              type="time"
              value={
                settings.dailyPublishTime
              }
              onChange={(
                value,
              ) =>
                updateField(
                  "dailyPublishTime",
                  value,
                )
              }
            />
          </div>
        </div>

        <div className="mt-auto flex justify-end pt-8">
          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              saveChanges
            }
            className="h-9 rounded-md bg-[#C8A35A] px-6 text-[8px] font-semibold text-[#080808] hover:bg-[#E0C48A] disabled:opacity-40"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </article>

      {/* RIGHT COLUMN */}

      <div className="space-y-5">
        <article className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
          <h2 className="font-serif text-[18px]">
            Security
          </h2>

          <div className="mt-5 space-y-6">
            <ToggleRow
              label="Two-factor for admins"
              checked={
                settings.twoFactorAdmins
              }
              onChange={() =>
                updateField(
                  "twoFactorAdmins",
                  !settings.twoFactorAdmins,
                )
              }
            />

            <div className="flex items-center justify-between gap-4">
              <span className="text-[8px] text-white/50">
                Session timeout
              </span>

              <select
                value={
                  settings.sessionTimeoutMinutes
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "sessionTimeoutMinutes",
                    Number(
                      event
                        .target
                        .value,
                    ),
                  )
                }
                className="h-8 rounded-md border border-white/10 bg-[#080808] px-2 text-[8px] text-white/55 outline-none"
              >
                <option value={15}>
                  15 min
                </option>

                <option value={30}>
                  30 min
                </option>

                <option value={60}>
                  60 min
                </option>

                <option value={120}>
                  2 hours
                </option>
              </select>
            </div>

            <ToggleRow
              label="IP allow-list"
              checked={
                settings.ipAllowListEnabled
              }
              onChange={() =>
                updateField(
                  "ipAllowListEnabled",
                  !settings.ipAllowListEnabled,
                )
              }
            />
          </div>

          <p className="mt-5 text-[7px] leading-4 text-white/20">
            These security policy
            values are stored now.
            Full 2FA and IP
            enforcement will be
            connected during the
            security-hardening
            phase.
          </p>
        </article>

        {/* DANGER ZONE */}

        <article className="rounded-[10px] border border-[#C8A35A]/20 bg-[#2C2515] p-5">
          <h2 className="text-[12px] font-semibold text-[#C8A35A]">
            Danger Zone
          </h2>

          <p className="mt-3 text-[8px] leading-4 text-white/35">
            Maintenance mode
            hides the site and
            app.
          </p>

          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              toggleMaintenance
            }
            className={`mt-6 h-9 rounded-md px-4 text-[8px] font-medium ${
              settings.maintenanceMode
                ? "border border-red-500/30 bg-red-500/10 text-red-400"
                : "border border-[#C8A35A]/25 bg-[#C8A35A]/10 text-[#E0C48A]"
            }`}
          >
            {settings.maintenanceMode
              ? "Disable Maintenance"
              : "Enable Maintenance"}
          </button>
        </article>
      </div>
    </section>
  );
}

function SecuritySettings({
  settings,
  updateField,
  saveChanges,
  saving,
}: {
  settings: Settings;

  updateField:
    <K extends keyof Settings>(
      key: K,
      value: Settings[K],
    ) => void;

  saveChanges:
    () => void;

  saving: boolean;
}) {
  return (
    <section className="mt-5 max-w-[700px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
      <h2 className="font-serif text-[18px]">
        Security
      </h2>

      <div className="mt-6 space-y-6">
        <ToggleRow
          label="Two-factor for admins"
          checked={
            settings.twoFactorAdmins
          }
          onChange={() =>
            updateField(
              "twoFactorAdmins",
              !settings.twoFactorAdmins,
            )
          }
        />

        <div>
          <label className="block text-[8px] text-white/35">
            Session Timeout
          </label>

          <select
            value={
              settings.sessionTimeoutMinutes
            }
            onChange={(
              event,
            ) =>
              updateField(
                "sessionTimeoutMinutes",
                Number(
                  event.target
                    .value,
                ),
              )
            }
            className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[9px] text-white/60 outline-none"
          >
            <option value={15}>
              15 minutes
            </option>

            <option value={30}>
              30 minutes
            </option>

            <option value={60}>
              1 hour
            </option>

            <option value={120}>
              2 hours
            </option>
          </select>
        </div>

        <ToggleRow
          label="IP allow-list"
          checked={
            settings.ipAllowListEnabled
          }
          onChange={() =>
            updateField(
              "ipAllowListEnabled",
              !settings.ipAllowListEnabled,
            )
          }
        />
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          disabled={
            saving
          }
          onClick={
            saveChanges
          }
          className="h-9 rounded-md bg-[#C8A35A] px-6 text-[8px] font-semibold text-[#080808] disabled:opacity-40"
        >
          Save Changes
        </button>
      </div>
    </section>
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
      <label className="block text-[7px] text-white/30">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
        className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[9px] text-white outline-none focus:border-[#C8A35A]/30"
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange:
    () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span className="text-[8px] text-white/50">
        {label}
      </span>

      <button
        type="button"
        onClick={
          onChange
        }
        className={`relative h-[20px] w-[36px] rounded-full ${
          checked
            ? "bg-[#4E3D17]"
            : "bg-white/[0.06]"
        }`}
      >
        <span
          className={`absolute top-[4px] h-[12px] w-[12px] rounded-full transition-all ${
            checked
              ? "left-[20px] bg-[#D4AF5A]"
              : "left-[4px] bg-white/45"
          }`}
        />
      </button>
    </div>
  );
}