"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  X,
} from "lucide-react";

import AdminShell from "@/components/AdminShell";

import {
  API_URL,
} from "@/lib/api";

type MobileSettings = {
  id: number;

  forceUpdate: boolean;
  maintenanceMode: boolean;
  offlineReading: boolean;
  dailyNuggetWidget: boolean;

  homeBannerTitle: string;

  publishedAt:
    | string
    | null;
};

type MobileVersion = {
  id: number;

  platform: string;
  version: string;

  installCount: number;

  status: string;
};

type OnboardingScreen = {
  id: number;

  step: number;

  title: string;

  description:
    | string
    | null;
};

type MobileResponse = {
  settings:
    | MobileSettings
    | null;

  versions:
    MobileVersion[];

  onboarding:
    OnboardingScreen[];
};

export default function AdminMobilePage() {
  const [
    settings,
    setSettings,
  ] =
    useState<MobileSettings | null>(
      null,
    );

  const [
    versions,
    setVersions,
  ] =
    useState<MobileVersion[]>(
      [],
    );

  const [
    onboarding,
    setOnboarding,
  ] =
    useState<OnboardingScreen[]>(
      [],
    );

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
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    bannerOpen,
    setBannerOpen,
  ] = useState(false);

  const [
    bannerTitle,
    setBannerTitle,
  ] = useState("");

  const [
    editingScreen,
    setEditingScreen,
  ] =
    useState<OnboardingScreen | null>(
      null,
    );

  const [
    screenTitle,
    setScreenTitle,
  ] = useState("");

  const [
    screenDescription,
    setScreenDescription,
  ] = useState("");

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

  /* =========================================================
     LOAD
  ========================================================= */

  useEffect(() => {
    loadMobileConfig();
  }, []);

  async function loadMobileConfig() {
    const token =
      getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/admin/mobile`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data:
        MobileResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          "Could not load mobile app settings.",
        );
      }

      setSettings(
        data.settings,
      );

      setVersions(
        data.versions ??
          [],
      );

      setOnboarding(
        data.onboarding ??
          [],
      );

      setBannerTitle(
        data.settings
          ?.homeBannerTitle ??
          "",
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

  /* =========================================================
     TOGGLE
  ========================================================= */

  function toggleSetting(
    key:
      | "forceUpdate"
      | "maintenanceMode"
      | "offlineReading"
      | "dailyNuggetWidget",
  ) {
    if (!settings) {
      return;
    }

    setSettings({
      ...settings,

      [key]:
        !settings[key],
    });
  }

  /* =========================================================
     PUBLISH
  ========================================================= */

  async function publishChanges() {
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
      const response =
        await fetch(
          `${API_URL}/admin/mobile/settings`,
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
                forceUpdate:
                  settings.forceUpdate,

                maintenanceMode:
                  settings.maintenanceMode,

                offlineReading:
                  settings.offlineReading,

                dailyNuggetWidget:
                  settings.dailyNuggetWidget,

                homeBannerTitle:
                  bannerTitle.trim(),
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
            "Could not publish changes.",
        );

        return;
      }

      setSettings(
        data,
      );

      setBannerTitle(
        data.homeBannerTitle,
      );

      setSuccess(
        "Mobile app changes published.",
      );
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     BANNER
  ========================================================= */

  function openBanner() {
    setBannerTitle(
      settings
        ?.homeBannerTitle ??
        "",
    );

    setBannerOpen(true);
  }

  function saveBannerLocally() {
    if (
      !bannerTitle.trim() ||
      !settings
    ) {
      setError(
        "Banner title cannot be empty.",
      );

      return;
    }

    setSettings({
      ...settings,

      homeBannerTitle:
        bannerTitle.trim(),
    });

    setBannerOpen(false);

    setSuccess(
      "Banner updated. Publish changes to make it live.",
    );
  }

  /* =========================================================
     ONBOARDING
  ========================================================= */

  function openOnboarding(
    screen: OnboardingScreen,
  ) {
    setEditingScreen(
      screen,
    );

    setScreenTitle(
      screen.title,
    );

    setScreenDescription(
      screen.description ??
        "",
    );
  }

  async function saveOnboarding() {
    if (
      !editingScreen ||
      !screenTitle.trim()
    ) {
      return;
    }

    const token =
      getToken();

    if (!token) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/mobile/onboarding/${editingScreen.id}`,
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
                title:
                  screenTitle.trim(),

                description:
                  screenDescription.trim(),
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
            "Could not update onboarding screen.",
        );

        return;
      }

      setEditingScreen(
        null,
      );

      setSuccess(
        "Onboarding screen updated.",
      );

      await loadMobileConfig();
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
            Loading mobile app
            settings...
          </p>
        </main>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {/* HEADER */}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[32px]">
              Mobile App
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Control the iOS
              and Android app,
              mirrored from the
              web experience.
            </p>
          </div>

          <button
            type="button"
            onClick={
              publishChanges
            }
            disabled={
              saving ||
              !settings
            }
            className="h-9 w-fit rounded-md bg-[#C8A35A] px-5 text-[8px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:opacity-40"
          >
            {saving
              ? "Publishing..."
              : "Publish Changes"}
          </button>
        </section>

        {/* MESSAGES */}

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

        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.9fr)]">
          {/* VERSIONS */}

          <article className="overflow-hidden rounded-[10px] border border-white/10 bg-[#111111]">
            <div className="border-b border-white/[0.07] px-5 py-4">
              <h2 className="font-serif text-[18px]">
                Mobile App
                Versions
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[7px] uppercase tracking-[0.06em] text-white/25">
                    <th className="px-5 py-3 font-medium">
                      Platform
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Version
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Installs
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {versions.map(
                    (
                      version,
                    ) => (
                      <tr
                        key={
                          version.id
                        }
                        className="border-b border-white/[0.05] last:border-0"
                      >
                        <td className="px-5 py-4 text-[8px] text-white/55">
                          {
                            version.platform
                          }
                        </td>

                        <td className="px-4 py-4 text-[8px] text-white/40">
                          {
                            version.version
                          }
                        </td>

                        <td className="px-4 py-4 text-[8px] text-white/40">
                          {version.installCount.toLocaleString()}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={
                              version.status
                            }
                          />
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {versions.length ===
              0 && (
              <p className="px-5 py-10 text-center text-[9px] text-white/25">
                No app versions
                recorded.
              </p>
            )}
          </article>

          {/* APP SETTINGS */}

          <article className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h2 className="font-serif text-[18px]">
              App Settings
            </h2>

            {settings && (
              <div className="mt-5 space-y-5">
                <SettingToggle
                  label="Force update"
                  checked={
                    settings.forceUpdate
                  }
                  onChange={() =>
                    toggleSetting(
                      "forceUpdate",
                    )
                  }
                />

                <SettingToggle
                  label="Maintenance mode"
                  checked={
                    settings.maintenanceMode
                  }
                  onChange={() =>
                    toggleSetting(
                      "maintenanceMode",
                    )
                  }
                />

                <SettingToggle
                  label="Offline reading"
                  checked={
                    settings.offlineReading
                  }
                  onChange={() =>
                    toggleSetting(
                      "offlineReading",
                    )
                  }
                />

                <SettingToggle
                  label="Daily nugget widget"
                  checked={
                    settings.dailyNuggetWidget
                  }
                  onChange={() =>
                    toggleSetting(
                      "dailyNuggetWidget",
                    )
                  }
                />
              </div>
            )}
          </article>
        </section>

        {/* BOTTOM */}

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.9fr)]">
          {/* BANNER */}

          <article className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h2 className="font-serif text-[18px]">
              Home Banner
              Preview
            </h2>

            <div className="mt-4 flex min-h-[160px] items-center justify-center rounded-md border border-white/[0.07] bg-[#080808] px-6 text-center">
              <div>
                <h3 className="max-w-[410px] font-serif text-[24px] leading-[1.15] text-[#FAF9F6]">
                  {settings
                    ?.homeBannerTitle ||
                    "Command Your Business with Absolute Clarity"}
                </h3>

                <button
                  type="button"
                  onClick={
                    openBanner
                  }
                  className="mt-5 h-9 rounded-md bg-[#C8A35A] px-7 text-[8px] font-semibold text-[#080808]"
                >
                  Edit Banner
                </button>
              </div>
            </div>
          </article>

          {/* ONBOARDING */}

          <article className="rounded-[10px] border border-white/10 bg-[#111111] p-5">
            <h2 className="font-serif text-[18px]">
              Onboarding Screens
            </h2>

            <div className="mt-4 space-y-3">
              {onboarding.map(
                (screen) => (
                  <div
                    key={
                      screen.id
                    }
                    className="flex items-center justify-between gap-3 rounded-md border border-white/[0.07] bg-[#080808] px-4 py-4"
                  >
                    <p className="text-[8px] text-white/55">
                      {screen.step}.{" "}
                      {
                        screen.title
                      }
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        openOnboarding(
                          screen,
                        )
                      }
                      className="text-[7px] text-[#C8A35A] hover:text-[#E0C48A]"
                    >
                      Edit
                    </button>
                  </div>
                ),
              )}
            </div>
          </article>
        </section>

        {/* BANNER MODAL */}

        {bannerOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[470px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[24px]">
                  Edit Home Banner
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setBannerOpen(
                      false,
                    )
                  }
                  className="text-white/30 hover:text-white"
                >
                  <X
                    size={
                      16
                    }
                  />
                </button>
              </div>

              <label className="mt-6 block text-[8px] text-white/35">
                Banner Title
              </label>

              <textarea
                rows={4}
                value={
                  bannerTitle
                }
                onChange={(
                  event,
                ) =>
                  setBannerTitle(
                    event
                      .target
                      .value,
                  )
                }
                className="mt-2 w-full resize-none rounded-md border border-white/10 bg-[#080808] px-3 py-3 text-[10px] leading-5 text-white outline-none focus:border-[#C8A35A]/35"
              />

              <p className="mt-3 text-[7px] text-white/25">
                Save here, then
                use Publish
                Changes to make
                it live.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setBannerOpen(
                      false,
                    )
                  }
                  className="h-9 rounded-md border border-white/10 px-4 text-[9px] text-white/40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    saveBannerLocally
                  }
                  className="h-9 rounded-md bg-[#C8A35A] px-5 text-[9px] font-semibold text-[#080808]"
                >
                  Save Banner
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ONBOARDING MODAL */}

        {editingScreen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[470px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-[24px]">
                    Onboarding
                    Screen{" "}
                    {
                      editingScreen.step
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditingScreen(
                      null,
                    )
                  }
                  className="text-white/30 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <label className="mt-6 block text-[8px] text-white/35">
                Title
              </label>

              <input
                value={
                  screenTitle
                }
                onChange={(
                  event,
                ) =>
                  setScreenTitle(
                    event
                      .target
                      .value,
                  )
                }
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[9px] text-white outline-none"
              />

              <label className="mt-4 block text-[8px] text-white/35">
                Description
              </label>

              <textarea
                rows={5}
                value={
                  screenDescription
                }
                onChange={(
                  event,
                ) =>
                  setScreenDescription(
                    event
                      .target
                      .value,
                  )
                }
                className="mt-2 w-full resize-none rounded-md border border-white/10 bg-[#080808] px-3 py-3 text-[9px] leading-5 text-white outline-none"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEditingScreen(
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
                    saveOnboarding
                  }
                  className="h-9 rounded-md bg-[#C8A35A] px-5 text-[9px] font-semibold text-[#080808] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Screen"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}

function SettingToggle({
  label,
  checked,
  onChange,
}: {
  label: string;

  checked: boolean;

  onChange: () => void;
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
        className={`relative h-[20px] w-[36px] rounded-full transition ${
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

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const value =
    status.toLowerCase();

  if (value === "live") {
    return (
      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2.5 py-1 text-[6px] text-emerald-400">
        Live
      </span>
    );
  }

  return (
    <span className="rounded-full border border-[#C8A35A]/20 bg-[#C8A35A]/[0.08] px-2.5 py-1 text-[6px] text-[#C8A35A]">
      Review
    </span>
  );
}