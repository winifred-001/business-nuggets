"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Laptop,
  LogOut,
} from "lucide-react";

import AuthRouteGuard from "@/components/AuthRouteGuard";
import BusinessCategoryPreferences from "@/components/BusinessCategoryPreferences";
import Footer from "@/components/Footer";
import Navbar from "@/components/navbar";
import { ProfileImageEditor } from "@/components/ProfileImage";

const navItems = [
  "Personal Details",
  "Interests & Goals",
  "Following Channels",
  "Playback Preferences",
  "Download Settings",
  "Notification Channels",
  "Account Security",
  "Devices & Sessions",
  "Data Export",
  "Delete Account",
  "Sign Out",
] as const;

type NavItem = (typeof navItems)[number];

type NotificationPreference = {
  email: boolean;
  inApp: boolean;
};

type NotificationPreferences = {
  dailyNugget: NotificationPreference;
  followedTopics: NotificationPreference;
  wisdomMusicals: NotificationPreference;
  accountAlerts: NotificationPreference;
};

type ExportSelection = {
  profile: boolean;
  notes: boolean;
  playlists: boolean;
  saved: boolean;
  history: boolean;
  following: boolean;
};

type UserProfile = {
  id?: number;
  name?: string;
  email?: string;
};

const defaultNotificationPreferences: NotificationPreferences = {
  dailyNugget: { email: true, inApp: true },
  followedTopics: { email: false, inApp: true },
  wisdomMusicals: { email: false, inApp: true },
  accountAlerts: { email: true, inApp: true },
};

const defaultExportSelection: ExportSelection = {
  profile: true,
  notes: true,
  playlists: true,
  saved: true,
  history: true,
  following: true,
};

export default function AccountSettingsPage() {
  const router = useRouter();
  const [active, setActive] = useState<NavItem>("Personal Details");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [originalProfile, setOriginalProfile] = useState({ name: "", email: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const [followedTopicList, setFollowedTopicList] = useState<string[]>([]);
  const [followingLoading, setFollowingLoading] = useState(true);
  const [followingMessage, setFollowingMessage] = useState("");
  const [unfollowingTopic, setUnfollowingTopic] = useState<string | null>(null);

  const [audioSpeed, setAudioSpeed] = useState("1.0x (Normal)");
  const [autoplay, setAutoplay] = useState(true);
  const [playbackMessage, setPlaybackMessage] = useState("");

  const [downloadAudio, setDownloadAudio] = useState(true);
  const [downloadWifiOnly, setDownloadWifiOnly] = useState(true);
  const [downloadMessage, setDownloadMessage] = useState("");

  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(defaultNotificationPreferences);
  const [notificationSnapshot, setNotificationSnapshot] =
    useState<NotificationPreferences>(defaultNotificationPreferences);
  const [notificationMessage, setNotificationMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [deviceLabel, setDeviceLabel] = useState("Current Browser");
  const [deviceDetail, setDeviceDetail] = useState("Active now");

  const [exportSelection, setExportSelection] =
    useState<ExportSelection>(defaultExportSelection);
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const [deletePassword, setDeletePassword] = useState("");
  const [deletePhrase, setDeletePhrase] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/member/proxy/users/me", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as UserProfile & {
          message?: string | string[];
        };

        if (!response.ok) {
          setProfileMessage(
            Array.isArray(data.message)
              ? data.message.join(", ")
              : data.message || "Could not load profile.",
          );
          return;
        }

        const name = data.name || "";
        const profileEmail = data.email || "";
        setFullName(name);
        setEmail(profileEmail);
        setOriginalProfile({ name, email: profileEmail });
      } catch {
        setProfileMessage("Could not connect to the server.");
      } finally {
        setProfileLoading(false);
      }
    }

    async function loadFollowing() {
      try {
        const response = await fetch("/api/member/proxy/following/topics", {
          cache: "no-store",
        });
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          setFollowingMessage(
            Array.isArray(data?.message)
              ? data.message.join(", ")
              : data?.message || "Could not load followed categories.",
          );
          return;
        }

        const topics = Array.isArray(data)
          ? data
              .map((item) =>
                typeof item === "string" ? item : item?.topic,
              )
              .filter((value): value is string => Boolean(value))
          : [];

        setFollowedTopicList(topics);
      } catch {
        setFollowingMessage("Could not connect to the server.");
      } finally {
        setFollowingLoading(false);
      }
    }

    void loadProfile();
    void loadFollowing();

    try {
      const playback = localStorage.getItem("playbackPreferences");
      if (playback) {
        const parsed = JSON.parse(playback);
        setAudioSpeed(parsed.audioSpeed ?? "1.0x (Normal)");
        setAutoplay(parsed.autoplay ?? true);
      }

      const downloads = localStorage.getItem("downloadPreferences");
      if (downloads) {
        const parsed = JSON.parse(downloads);
        setDownloadAudio(parsed.downloadAudio ?? true);
        setDownloadWifiOnly(parsed.wifiOnly ?? true);
      }

      const notifications = localStorage.getItem("notificationPreferences");
      if (notifications) {
        const parsed = JSON.parse(notifications);
        setNotificationPreferences(parsed);
        setNotificationSnapshot(parsed);
      }
    } catch {
      // Ignore invalid local device preferences.
    }

    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|Mobile/i.test(userAgent);
    let browser = "Browser";

    if (/Edg/i.test(userAgent)) browser = "Microsoft Edge";
    else if (/Chrome/i.test(userAgent)) browser = "Chrome";
    else if (/Firefox/i.test(userAgent)) browser = "Firefox";
    else if (/Safari/i.test(userAgent)) browser = "Safari";

    setDeviceLabel(isMobile ? "Mobile Browser" : "Desktop Browser");
    setDeviceDetail(`${browser} · Active now`);
  }, []);

  function handleNavigation(item: NavItem) {
    setActive(item);
    setMobileNavOpen(false);
  }

  async function saveProfile() {
    setProfileSaving(true);
    setProfileMessage("");

    try {
      const response = await fetch("/api/member/proxy/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setProfileMessage(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Could not update profile.",
        );
        return;
      }

      const name = data.name || fullName.trim();
      const profileEmail = data.email || email.trim();
      setFullName(name);
      setEmail(profileEmail);
      setOriginalProfile({ name, email: profileEmail });
      localStorage.setItem("user", JSON.stringify(data));
      window.dispatchEvent(new Event("auth-change"));
      setProfileMessage("Profile updated successfully.");
    } catch {
      setProfileMessage("Could not update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  function cancelProfileChanges() {
    setFullName(originalProfile.name);
    setEmail(originalProfile.email);
    setProfileMessage("");
  }

  async function handleUnfollowTopic(topic: string) {
    setUnfollowingTopic(topic);
    setFollowingMessage("");

    try {
      const response = await fetch(
        `/api/member/proxy/following/topics/${encodeURIComponent(topic)}`,
        { method: "DELETE" },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFollowingMessage(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Could not unfollow category.",
        );
        return;
      }

      setFollowedTopicList((current) =>
        current.filter((item) => item !== topic),
      );
    } catch {
      setFollowingMessage("Could not connect to the server.");
    } finally {
      setUnfollowingTopic(null);
    }
  }

  function savePlayback() {
    localStorage.setItem(
      "playbackPreferences",
      JSON.stringify({ audioSpeed, autoplay }),
    );
    setPlaybackMessage("Playback preferences saved.");
  }

  function saveDownloads() {
    localStorage.setItem(
      "downloadPreferences",
      JSON.stringify({ downloadAudio, wifiOnly: downloadWifiOnly }),
    );
    setDownloadMessage("Download settings saved.");
  }

  function updateNotificationPreference(
    row: keyof NotificationPreferences,
    channel: keyof NotificationPreference,
  ) {
    setNotificationPreferences((current) => ({
      ...current,
      [row]: {
        ...current[row],
        [channel]: !current[row][channel],
      },
    }));
  }

  function saveNotificationPreferences() {
    localStorage.setItem(
      "notificationPreferences",
      JSON.stringify(notificationPreferences),
    );
    setNotificationSnapshot(notificationPreferences);
    setNotificationMessage("Notification preferences saved.");
  }

  function cancelNotificationChanges() {
    setNotificationPreferences(notificationSnapshot);
    setNotificationMessage("");
  }

  async function changePassword() {
    setPasswordMessage("");
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordMessage("Enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch("/api/member/proxy/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPasswordMessage(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Could not change password.",
        );
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setPasswordMessage(
        data.message || "Password changed successfully. Please sign in again.",
      );
    } catch {
      setPasswordMessage("Could not connect to the server.");
    } finally {
      setPasswordSaving(false);
    }
  }

  const selectedExportCount = useMemo(
    () => Object.values(exportSelection).filter(Boolean).length,
    [exportSelection],
  );

  async function exportWorkspace() {
    setExportLoading(true);
    setExportMessage("");

    try {
      const requests: Record<string, Promise<Response>> = {};
      if (exportSelection.profile) {
        requests.profile = fetch("/api/member/proxy/users/me", {
          cache: "no-store",
        });
        requests.preferences = fetch(
          "/api/member/proxy/users/me/preferences",
          { cache: "no-store" },
        );
      }
      if (exportSelection.notes) {
        requests.notes = fetch("/api/member/proxy/notes", { cache: "no-store" });
      }
      if (exportSelection.playlists) {
        requests.playlists = fetch("/api/member/proxy/playlists", {
          cache: "no-store",
        });
      }
      if (exportSelection.saved) {
        requests.savedNuggets = fetch("/api/member/proxy/saved-nuggets", {
          cache: "no-store",
        });
      }
      if (exportSelection.history) {
        requests.history = fetch("/api/member/proxy/history", {
          cache: "no-store",
        });
      }
      if (exportSelection.following) {
        requests.followedCategories = fetch(
          "/api/member/proxy/following/topics",
          { cache: "no-store" },
        );
      }

      const results = await Promise.all(
        Object.entries(requests).map(async ([key, request]) => {
          const response = await request;
          const data = await response.json().catch(() => null);
          if (!response.ok) throw new Error(`Could not export ${key}.`);
          return [key, data] as const;
        }),
      );

      const payload = {
        exportedAt: new Date().toISOString(),
        ...Object.fromEntries(results),
      };

      let content = "";
      let extension = "";
      let mimeType = "";

      if (exportFormat === "json") {
        content = JSON.stringify(payload, null, 2);
        extension = "json";
        mimeType = "application/json";
      } else {
        const rows = Object.entries(payload).map(([key, value]) => [
          key,
          typeof value === "string" ? value : JSON.stringify(value),
        ]);
        content = [
          "section,value",
          ...rows.map(([key, value]) => {
            const cleanKey = String(key).replace(/"/g, '""');
            const cleanValue = String(value).replace(/"/g, '""');
            return `"${cleanKey}","${cleanValue}"`;
          }),
        ].join("\n");
        extension = "csv";
        mimeType = "text/csv";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `business-nuggets-workspace.${extension}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setExportMessage("Your workspace export has been prepared.");
    } catch (error) {
      setExportMessage(
        error instanceof Error
          ? error.message
          : "Could not export your workspace.",
      );
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deletePhrase !== "DELETE") {
      setDeleteMessage("Type DELETE exactly to confirm.");
      return;
    }
    if (!deletePassword) {
      setDeleteMessage("Enter your password to continue.");
      return;
    }
    if (!confirmDelete) {
      setDeleteMessage("Confirm that you understand this action is permanent.");
      return;
    }

    setDeleteLoading(true);
    setDeleteMessage("");

    try {
      const response = await fetch("/api/member/proxy/users/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setDeleteMessage(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Could not delete account.",
        );
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth-change"));
      router.replace("/");
      router.refresh();
    } catch {
      setDeleteMessage("Could not connect to the server.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await fetch("/api/member/auth/logout", { method: "POST" });
    } catch {
      // Clear browser session markers even if the logout request fails.
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
    router.replace("/");
    router.refresh();
  }

  return (
    <AuthRouteGuard type="protected">
      <div className="min-h-screen bg-[#080808] text-[#F5F0E8]">
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
          <Link
            href="/home"
            className="text-[11px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
          >
            ← My Wisdom Workspace
          </Link>

          <div className="mt-4">
            <h1 className="bn-hero-title font-serif text-[40px] leading-[1.05] text-[#FAF9F6]">
              Account &amp; Workspace Settings
            </h1>
            <p className="mt-3 max-w-[700px] text-[13px] leading-6 text-white/40">
              Manage your personal details, categories, preferences, access, devices and
              workspace data.
            </p>
          </div>

          <div className="relative z-30 mt-8 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen((current) => !current)}
              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#111111] px-4 py-3"
            >
              <span className="text-[13px] font-medium text-white">{active}</span>
              <ChevronDown
                size={17}
                className={`text-white/50 transition ${
                  mobileNavOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {mobileNavOpen && (
              <div className="absolute left-0 right-0 top-[52px] overflow-hidden rounded-lg border border-white/10 bg-[#111111] shadow-2xl">
                {navItems.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleNavigation(item)}
                    className={`block w-full px-4 py-3 text-left text-[13px] transition ${
                      active === item
                        ? "bg-[#C8A35A]/10 text-[#C8A35A]"
                        : item === "Delete Account"
                          ? "text-red-400"
                          : "text-white/55 hover:bg-white/[0.04]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <nav className="sticky top-28 space-y-1">
                {navItems.map((item) => {
                  const selected = active === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleNavigation(item)}
                      className={`relative block w-full px-3 py-3 text-left text-[12px] transition ${
                        selected
                          ? "text-[#C8A35A]"
                          : item === "Delete Account"
                            ? "text-red-400/90 hover:text-red-300"
                            : "text-white/45 hover:text-white/75"
                      }`}
                    >
                      {item}
                      {selected && (
                        <span className="absolute bottom-0 left-3 h-px w-[70px] bg-[#C8A35A]" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>

            <section className="min-w-0">
              {active === "Personal Details" && (
                <div className="space-y-6">
                  <SettingsCard title="Personal Details">
                    <div className="space-y-6">
                      <ProfileImageEditor />

                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="FULL NAME">
                          <input
                            type="text"
                            value={fullName}
                            disabled={profileLoading}
                            onChange={(event) => setFullName(event.target.value)}
                            className={inputClass}
                          />
                        </Field>

                        <Field label="EMAIL ADDRESS">
                          <input
                            type="email"
                            value={email}
                            disabled={profileLoading}
                            onChange={(event) => setEmail(event.target.value)}
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    </div>
                  </SettingsCard>

                  <SettingsCard
                    title="Core Business Categories"
                    description="Choose from the current Business Nuggets categories. These are the same categories used during onboarding and for your personalized recommendations."
                  >
                    <BusinessCategoryPreferences variant="chips" />
                  </SettingsCard>

                  <SettingsCard title="Playback & Streaming Preferences">
                    <PreferenceRow
                      title="Default Audio Speed"
                      description="Playback speed for commentary and wisdom musicals."
                      control={
                        <select
                          value={audioSpeed}
                          onChange={(event) => setAudioSpeed(event.target.value)}
                          className="rounded-md border border-white/10 bg-[#19191D] px-3 py-2 text-[12px] text-white outline-none"
                        >
                          <option>0.75x</option>
                          <option>1.0x (Normal)</option>
                          <option>1.25x</option>
                          <option>1.5x</option>
                          <option>2.0x</option>
                        </select>
                      }
                    />
                    <PreferenceRow
                      title="Autoplay Next Segment"
                      description="Continue automatically after the current teaching."
                      control={<Switch checked={autoplay} onChange={setAutoplay} />}
                    />
                  </SettingsCard>

                  {profileMessage && <StatusMessage text={profileMessage} />}

                  <div className="flex flex-wrap justify-end gap-3">
                    <SecondaryButton onClick={cancelProfileChanges}>
                      Cancel Changes
                    </SecondaryButton>
                    <PrimaryButton
                      onClick={saveProfile}
                      disabled={
                        profileSaving ||
                        profileLoading ||
                        !fullName.trim() ||
                        !email.trim()
                      }
                    >
                      {profileSaving ? "Saving..." : "Save Profile Changes"}
                    </PrimaryButton>
                  </div>
                </div>
              )}

              {active === "Interests & Goals" && (
                <div className="space-y-6">
                  <SettingsCard
                    title="Business Categories & Goals"
                    description="Choose the current categories you want your wisdom stream, Recommendation Guide and homepage recommendations to prioritize."
                  >
                    <BusinessCategoryPreferences variant="cards" />
                  </SettingsCard>
                </div>
              )}

              {active === "Following Channels" && (
                <div className="space-y-6">
                  <SettingsCard
                    title="Following Channels"
                    description="Manage the business categories you currently follow."
                  >
                    {followingLoading ? (
                      <p className="text-[12px] text-white/40">
                        Loading followed categories...
                      </p>
                    ) : followedTopicList.length === 0 ? (
                      <EmptyState
                        icon={<BookOpen size={18} />}
                        title="No followed categories yet"
                        text="Categories you follow will appear here."
                      />
                    ) : (
                      <div className="space-y-3">
                        {followedTopicList.map((topic) => (
                          <div
                            key={topic}
                            className="flex flex-col gap-4 rounded-lg border border-white/10 bg-[#141414] p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-[13px] text-white/75">{topic}</p>
                              <p className="mt-1 text-[11px] text-white/30">
                                Followed category
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={unfollowingTopic === topic}
                              onClick={() => void handleUnfollowTopic(topic)}
                              className="rounded-md border border-white/10 px-4 py-2 text-[11px] text-white/55 hover:border-red-400/40 hover:text-red-400 disabled:opacity-50"
                            >
                              {unfollowingTopic === topic
                                ? "Unfollowing..."
                                : "Unfollow"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </SettingsCard>
                  {followingMessage && (
                    <StatusMessage text={followingMessage} error />
                  )}
                </div>
              )}

              {active === "Playback Preferences" && (
                <div className="space-y-6">
                  <SettingsCard title="Playback Preferences">
                    <PreferenceRow
                      title="Default Audio Speed"
                      description="Choose your preferred listening speed."
                      control={
                        <select
                          value={audioSpeed}
                          onChange={(event) => setAudioSpeed(event.target.value)}
                          className="rounded-md border border-white/10 bg-[#19191D] px-3 py-2 text-[12px] text-white"
                        >
                          <option>0.75x</option>
                          <option>1.0x (Normal)</option>
                          <option>1.25x</option>
                          <option>1.5x</option>
                          <option>2.0x</option>
                        </select>
                      }
                    />
                    <PreferenceRow
                      title="Autoplay Next Segment"
                      description="Automatically continue to the next teaching."
                      control={<Switch checked={autoplay} onChange={setAutoplay} />}
                    />
                  </SettingsCard>
                  {playbackMessage && <StatusMessage text={playbackMessage} />}
                  <div className="flex justify-end">
                    <PrimaryButton onClick={savePlayback}>Save Changes</PrimaryButton>
                  </div>
                </div>
              )}

              {active === "Download Settings" && (
                <div className="space-y-6">
                  <SettingsCard
                    title="Download Settings"
                    description="Choose how offline listening should work on this device."
                  >
                    <PreferenceRow
                      title="Download Audio"
                      description="Allow commentary and Musical audio to be stored for offline listening."
                      control={
                        <Switch checked={downloadAudio} onChange={setDownloadAudio} />
                      }
                    />
                    <PreferenceRow
                      title="Wi-Fi Only"
                      description="Avoid large audio downloads when using mobile data."
                      control={
                        <Switch
                          checked={downloadWifiOnly}
                          onChange={setDownloadWifiOnly}
                        />
                      }
                    />
                  </SettingsCard>
                  {downloadMessage && <StatusMessage text={downloadMessage} />}
                  <div className="flex justify-end">
                    <PrimaryButton onClick={saveDownloads}>Save Changes</PrimaryButton>
                  </div>
                </div>
              )}

              {active === "Notification Channels" && (
                <div className="space-y-6">
                  <SettingsCard
                    title="Notification Channels"
                    description="Choose the wisdom updates you want to receive and where they appear."
                  >
                    <div className="overflow-x-auto">
                      <div className="min-w-[620px]">
                        <div className="grid grid-cols-[1fr_120px_120px] gap-3 px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                          <span>Update Type</span>
                          <span>Email</span>
                          <span>In-App</span>
                        </div>
                        <NotificationRow
                          title="Daily Nugget"
                          description="Daily biblical business teaching"
                          email={notificationPreferences.dailyNugget.email}
                          inApp={notificationPreferences.dailyNugget.inApp}
                          onEmail={() =>
                            updateNotificationPreference("dailyNugget", "email")
                          }
                          onInApp={() =>
                            updateNotificationPreference("dailyNugget", "inApp")
                          }
                        />
                        <NotificationRow
                          title="Followed Categories"
                          description="Updates from categories you follow"
                          email={notificationPreferences.followedTopics.email}
                          inApp={notificationPreferences.followedTopics.inApp}
                          onEmail={() =>
                            updateNotificationPreference("followedTopics", "email")
                          }
                          onInApp={() =>
                            updateNotificationPreference("followedTopics", "inApp")
                          }
                        />
                        <NotificationRow
                          title="Wisdom Musicals"
                          description="New cinematic audio releases"
                          email={notificationPreferences.wisdomMusicals.email}
                          inApp={notificationPreferences.wisdomMusicals.inApp}
                          onEmail={() =>
                            updateNotificationPreference("wisdomMusicals", "email")
                          }
                          onInApp={() =>
                            updateNotificationPreference("wisdomMusicals", "inApp")
                          }
                        />
                        <NotificationRow
                          title="Account Alerts"
                          description="Membership and account notices"
                          email={notificationPreferences.accountAlerts.email}
                          inApp={notificationPreferences.accountAlerts.inApp}
                          onEmail={() =>
                            updateNotificationPreference("accountAlerts", "email")
                          }
                          onInApp={() =>
                            updateNotificationPreference("accountAlerts", "inApp")
                          }
                        />
                      </div>
                    </div>
                    <p className="mt-5 text-[11px] leading-5 text-white/30">
                      Important security or service communications may still be required
                      for your account.
                    </p>
                  </SettingsCard>

                  {notificationMessage && (
                    <StatusMessage text={notificationMessage} />
                  )}
                  <div className="flex flex-wrap justify-end gap-3">
                    <SecondaryButton onClick={cancelNotificationChanges}>
                      Cancel Changes
                    </SecondaryButton>
                    <PrimaryButton onClick={saveNotificationPreferences}>
                      Save Changes
                    </PrimaryButton>
                  </div>
                </div>
              )}

              {active === "Account Security" && (
                <div className="space-y-6">
                  <SettingsCard title="Change Password">
                    <div className="space-y-5">
                      <PasswordField
                        label="Current Password"
                        value={currentPassword}
                        show={showCurrentPassword}
                        onShow={() => setShowCurrentPassword((current) => !current)}
                        onChange={setCurrentPassword}
                        placeholder="Enter your current password"
                      />
                      <PasswordField
                        label="New Password"
                        value={newPassword}
                        show={showNewPassword}
                        onShow={() => setShowNewPassword((current) => !current)}
                        onChange={setNewPassword}
                        placeholder="Create a unique password"
                      />
                      <p className="-mt-3 text-[11px] leading-5 text-white/30">
                        Use a long password with letters, numbers and symbols. Do not
                        reuse another account&apos;s password.
                      </p>
                      <PasswordField
                        label="Confirm New Password"
                        value={confirmPassword}
                        show={showConfirmPassword}
                        onShow={() => setShowConfirmPassword((current) => !current)}
                        onChange={setConfirmPassword}
                        placeholder="Re-enter your new password"
                      />
                      <Link href="/forgot-password" className="text-[11px] text-[#C8A35A]">
                        Forgot Password? → Request Reset Link
                      </Link>
                    </div>
                  </SettingsCard>

                  <SettingsCard title="Two-Factor Authentication">
                    <div className="rounded-md border border-[#C8A35A]/20 bg-[#C8A35A]/15 p-4">
                      <p className="text-[11px] font-semibold text-[#E0C48A]">
                        Not enabled — upcoming status
                      </p>
                      <p className="mt-2 text-[11px] leading-5 text-white/40">
                        An additional verification step helps protect your account if your
                        password is compromised.
                      </p>
                    </div>
                    <button
                      disabled
                      type="button"
                      className="mt-5 rounded-md border border-white/10 px-4 py-2.5 text-[11px] text-white/30"
                    >
                      Set Up Two-Factor Authentication
                    </button>
                  </SettingsCard>

                  {passwordMessage && (
                    <StatusMessage text={passwordMessage} error={!passwordSuccess} />
                  )}

                  <div className="flex flex-wrap justify-end gap-3">
                    <SecondaryButton
                      onClick={() => {
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordMessage("");
                      }}
                    >
                      Cancel Changes
                    </SecondaryButton>
                    <PrimaryButton
                      onClick={() => void changePassword()}
                      disabled={
                        passwordSaving ||
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword
                      }
                    >
                      {passwordSaving ? "Saving..." : "Save Changes"}
                    </PrimaryButton>
                  </div>
                </div>
              )}

              {active === "Devices & Sessions" && (
                <div className="space-y-6">
                  <SettingsCard title="Devices & Sessions">
                    <DeviceRow
                      title={deviceLabel}
                      description={deviceDetail}
                      action="Current Device"
                      highlighted
                    />
                    <p className="mt-5 text-[11px] leading-5 text-white/35">
                      Session history for other devices will appear here when
                      multi-session tracking is added to the backend.
                    </p>
                  </SettingsCard>

                  <SettingsCard title="Review Before Signing Out">
                    <div className="rounded-md border border-[#C8A35A]/20 bg-[#C8A35A]/15 p-4">
                      <p className="text-[11px] font-medium text-[#E0C48A]">
                        Sign out this browser?
                      </p>
                      <p className="mt-2 text-[11px] leading-5 text-white/40">
                        This ends your current session on this device.
                      </p>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        className="rounded-md bg-[#C8A35A] px-4 py-2.5 text-[11px] font-semibold text-[#080808]"
                      >
                        Sign Out Current Device
                      </button>
                      <SecondaryButton
                        onClick={() => handleNavigation("Account Security")}
                      >
                        Cancel
                      </SecondaryButton>
                    </div>
                  </SettingsCard>
                </div>
              )}

              {active === "Data Export" && (
                <div className="space-y-6">
                  <SettingsCard
                    title="Export Your Workspace"
                    description="Select what to include. An export contains your account information and references to your workspace content."
                  >
                    <div className="space-y-3">
                      <ExportOption
                        checked={exportSelection.profile}
                        title="Profile & Categories"
                        description="Name, email and selected business categories"
                        onChange={(value) =>
                          setExportSelection((current) => ({
                            ...current,
                            profile: value,
                          }))
                        }
                      />
                      <ExportOption
                        checked={exportSelection.notes}
                        title="My Journal & Notes"
                        description="Notes, reflections and linked Nuggets"
                        onChange={(value) =>
                          setExportSelection((current) => ({
                            ...current,
                            notes: value,
                          }))
                        }
                      />
                      <ExportOption
                        checked={exportSelection.playlists}
                        title="My Playlists"
                        description="Playlist details and ordered items"
                        onChange={(value) =>
                          setExportSelection((current) => ({
                            ...current,
                            playlists: value,
                          }))
                        }
                      />
                      <ExportOption
                        checked={exportSelection.saved}
                        title="Saved Nuggets"
                        description="Saved teachings and library organization"
                        onChange={(value) =>
                          setExportSelection((current) => ({
                            ...current,
                            saved: value,
                          }))
                        }
                      />
                      <ExportOption
                        checked={exportSelection.history}
                        title="Listening History"
                        description="Study sessions and listening progress"
                        onChange={(value) =>
                          setExportSelection((current) => ({
                            ...current,
                            history: value,
                          }))
                        }
                      />
                      <ExportOption
                        checked={exportSelection.following}
                        title="Followed Categories"
                        description="Business categories currently followed"
                        onChange={(value) =>
                          setExportSelection((current) => ({
                            ...current,
                            following: value,
                          }))
                        }
                      />
                    </div>

                    <div className="mt-6">
                      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.06em] text-white/40">
                        Export Format
                      </label>
                      <select
                        value={exportFormat}
                        onChange={(event) =>
                          setExportFormat(event.target.value as "json" | "csv")
                        }
                        className="h-11 w-full rounded-md border border-white/10 bg-[#19191D] px-4 text-[12px] text-white outline-none"
                      >
                        <option value="json">JSON - Structured Archive</option>
                        <option value="csv">CSV - Tabular Export</option>
                      </select>
                    </div>

                    <p className="mt-3 text-[10px] text-white/30">
                      {selectedExportCount} workspace categories selected.
                    </p>

                    {exportMessage && <StatusMessage text={exportMessage} />}

                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                      <SecondaryButton
                        onClick={() => setExportSelection(defaultExportSelection)}
                      >
                        Reset Selection
                      </SecondaryButton>
                      <PrimaryButton
                        onClick={() => void exportWorkspace()}
                        disabled={exportLoading || selectedExportCount === 0}
                      >
                        {exportLoading ? "Preparing..." : "Request Export"}
                      </PrimaryButton>
                    </div>
                  </SettingsCard>
                </div>
              )}

              {active === "Delete Account" && (
                <div className="space-y-6">
                  <SettingsCard title="Delete Account">
                    <div className="rounded-md border border-red-500/50 bg-red-500/[0.06] p-5">
                      <p className="text-[11px] font-semibold text-red-400">
                        Permanent loss of your workspace
                      </p>
                      <p className="mt-3 text-[11px] leading-5 text-white/40">
                        Deleting your account removes access to your personal notes,
                        playlists, saved Nuggets, followed categories and listening
                        history.
                      </p>
                    </div>

                    <p className="mt-5 text-[11px] leading-5 text-white/40">
                      Export your data first if you want to keep a copy before continuing.
                    </p>

                    <button
                      type="button"
                      onClick={() => handleNavigation("Data Export")}
                      className="mt-4 rounded-md border border-white/10 px-4 py-2.5 text-[11px] text-white/65"
                    >
                      Export My Data First →
                    </button>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <Field label="TYPE DELETE TO CONFIRM">
                        <input
                          value={deletePhrase}
                          onChange={(event) => setDeletePhrase(event.target.value)}
                          placeholder="Enter DELETE"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="CONFIRM YOUR PASSWORD">
                        <div className="relative">
                          <input
                            type={showDeletePassword ? "text" : "password"}
                            value={deletePassword}
                            onChange={(event) => setDeletePassword(event.target.value)}
                            placeholder="Enter your password"
                            className={`${inputClass} pr-11`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowDeletePassword((current) => !current)
                            }
                            aria-label={
                              showDeletePassword
                                ? "Hide account password"
                                : "Show account password"
                            }
                            aria-pressed={showDeletePassword}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35"
                          >
                            {showDeletePassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </Field>
                    </div>

                    <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-md border border-white/10 bg-[#19191D] p-4">
                      <input
                        type="checkbox"
                        checked={confirmDelete}
                        onChange={(event) => setConfirmDelete(event.target.checked)}
                        className="accent-red-500"
                      />
                      <span className="text-[11px] text-white/55">
                        I understand I will lose my notes, playlists and history.
                      </span>
                    </label>

                    {deleteMessage && <StatusMessage text={deleteMessage} error />}

                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                      <SecondaryButton
                        onClick={() => handleNavigation("Personal Details")}
                      >
                        Cancel — Keep My Account
                      </SecondaryButton>
                      <button
                        type="button"
                        onClick={() => void handleDeleteAccount()}
                        disabled={
                          deleteLoading ||
                          deletePhrase !== "DELETE" ||
                          !deletePassword ||
                          !confirmDelete
                        }
                        className="rounded-md bg-red-500 px-5 py-2.5 text-[11px] font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {deleteLoading ? "Deleting..." : "Permanently Delete Account"}
                      </button>
                    </div>
                  </SettingsCard>
                </div>
              )}

              {active === "Sign Out" && (
                <SettingsCard title="Sign Out">
                  <div className="flex items-start gap-4 rounded-lg border border-white/10 bg-[#141414] p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#0B0B0B] text-[#C8A35A]">
                      <LogOut size={17} />
                    </div>
                    <div>
                      <p className="text-[13px] text-white/75">
                        Sign out of this browser
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-white/35">
                        You&apos;ll need to sign in again to access your workspace, saved
                        Nuggets, playlists and notes.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <PrimaryButton onClick={() => void handleSignOut()}>
                      <span className="inline-flex items-center gap-2">
                        <LogOut size={14} />
                        Sign Out
                      </span>
                    </PrimaryButton>
                  </div>
                </SettingsCard>
              )}
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}

const inputClass =
  "h-11 w-full rounded-md border border-white/10 bg-[#19191D] px-4 text-[12px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/60";

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[10px] border border-white/10 bg-[#111111] p-5 sm:p-6">
      <h2 className="font-serif text-[20px] leading-tight text-[#FAF9F6]">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-[760px] text-[11px] leading-5 text-white/35">
          {description}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.06em] text-white/40">
        {label}
      </span>
      {children}
    </label>
  );
}

function PreferenceRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/[0.06] py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[13px] text-white/75">{title}</p>
        <p className="mt-1 text-[11px] leading-5 text-white/35">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-[#C8A35A]" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#080808] transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function PasswordField({
  label,
  value,
  show,
  onShow,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  show: boolean;
  onShow: () => void;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={onShow}
          aria-label={`${show ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={show}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>
  );
}

function NotificationRow({
  title,
  description,
  email,
  inApp,
  onEmail,
  onInApp,
}: {
  title: string;
  description: string;
  email: boolean;
  inApp: boolean;
  onEmail: () => void;
  onInApp: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_120px_120px] gap-3 border-t border-white/[0.06] px-3 py-4 first:border-t-0">
      <div>
        <p className="text-[12px] font-medium text-white/75">{title}</p>
        <p className="mt-1 text-[10px] text-white/30">{description}</p>
      </div>
      <ChannelToggle enabled={email} onClick={onEmail} />
      <ChannelToggle enabled={inApp} onClick={onInApp} />
    </div>
  );
}

function ChannelToggle({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 items-center gap-2 rounded-md border px-3 text-[10px] transition ${
        enabled
          ? "border-[#C8A35A]/45 bg-[#C8A35A]/15 text-[#E0C48A]"
          : "border-white/10 bg-[#19191D] text-white/35"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
          enabled
            ? "border-[#C8A35A] bg-[#C8A35A] text-black"
            : "border-white/20"
        }`}
      >
        {enabled && <Check size={11} />}
      </span>
      {enabled ? "Enabled" : "Off"}
    </button>
  );
}

function DeviceRow({
  title,
  description,
  action,
  highlighted,
}: {
  title: string;
  description: string;
  action: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
        highlighted
          ? "border-[#C8A35A]/60 bg-[#C8A35A]/[0.04]"
          : "border-white/10 bg-[#141414]"
      }`}
    >
      <div className="flex items-start gap-3">
        <Laptop size={17} className="mt-0.5 text-[#C8A35A]" />
        <div>
          <p className="text-[13px] text-white/75">{title}</p>
          <p className="mt-1 text-[11px] text-white/35">{description}</p>
        </div>
      </div>
      <span className="text-[10px] font-medium text-[#C8A35A]">{action}</span>
    </div>
  );
}

function ExportOption({
  checked,
  title,
  description,
  onChange,
}: {
  checked: boolean;
  title: string;
  description: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 ${
        checked
          ? "border-[#C8A35A]/45 bg-[#C8A35A]/15"
          : "border-white/10 bg-[#141414]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-[#C8A35A]"
      />
      <span>
        <span className="block text-[12px] text-white/75">{title}</span>
        <span className="mt-1 block text-[10px] text-white/35">{description}</span>
      </span>
    </label>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#141414] p-8 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#C8A35A]/10 text-[#C8A35A]">
        {icon}
      </div>
      <h3 className="mt-4 font-serif text-[18px] text-white/75">{title}</h3>
      <p className="mx-auto mt-2 max-w-[420px] text-[11px] leading-5 text-white/35">
        {text}
      </p>
    </div>
  );
}

function StatusMessage({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return (
    <p className={`text-[12px] ${error ? "text-red-400" : "text-[#C8A35A]"}`}>
      {text}
    </p>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md bg-[#C8A35A] px-5 py-2.5 text-[11px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-white/10 px-4 py-2.5 text-[11px] text-white/60 transition hover:border-white/20 hover:text-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}
