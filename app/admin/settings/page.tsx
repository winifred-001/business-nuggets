"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { Check, Copy, ImagePlus, RefreshCw, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { adminApiFetch, readAdminJson } from "@/lib/admin-api";
import { mediaUrl, uploadMedia } from "@/lib/media-library";
import type { SiteBranding } from "@/lib/site-branding";
import styles from "./settings.module.css";

type Settings = {
  siteName: string; tagline: string; supportEmail: string; timezone: string;
  defaultLanguage: string; dailyPublishTime: string; twoFactorAdmins: boolean;
  sessionTimeoutMinutes: number; ipAllowListEnabled: boolean; ipAllowList: string[]; maintenanceMode: boolean;
};
type Connections = {
  paystack: { configured: boolean; mode: string }; email: { configured: boolean };
  firebase: { configured: boolean }; cloudinary: { configured: boolean };
};
const tabs = ["General", "Branding", "Payments", "Integrations", "Security"] as const;
type Tab = typeof tabs[number];
const palette = [
  ["Gold", "#CDA762"], ["Background", "#10110F"], ["Surface", "#191B18"],
  ["Card", "#161713"], ["Text", "#F9F5ED"],
];
const emptyBrand: SiteBranding = { logoUrl: "", faviconUrl: "", socialImageUrl: "" };

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>("General");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [branding, setBranding] = useState<SiteBranding>(emptyBrand);
  const [savedBrand, setSavedBrand] = useState<SiteBranding>(emptyBrand);
  const [connections, setConnections] = useState<Connections | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [setup, setSetup] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState("");
  const [brandReady, setBrandReady] = useState(false);

  function refresh() {
    setLoading(true); setError(""); setSuccess(""); setConnectionError(""); setBrandReady(false);
    void load();
  }
  async function load() {
    const results = await Promise.allSettled([
      adminApiFetch("/settings", { cache: "no-store" }).then(response => readAdminJson<Settings>(response)),
      adminApiFetch("/settings/branding", { cache: "no-store" }).then(response => readAdminJson<SiteBranding>(response)),
      adminApiFetch("/settings/connections", { cache: "no-store" }).then(response => readAdminJson<Connections>(response)),
    ]);
    if (results[0].status === "fulfilled" && results[0].value) setSettings({ ...results[0].value, ipAllowList: results[0].value.ipAllowList || [] });
    else if (results[0].status === "rejected") setError(results[0].reason.message);
    if (results[1].status === "fulfilled" && results[1].value) { setBranding(results[1].value); setSavedBrand(results[1].value); setBrandReady(true); }
    else if (results[1].status === "rejected") { const errorMessage = message(results[1].reason); setError(previous => previous || errorMessage); }
    if (results[2].status === "fulfilled") setConnections(results[2].value);
    else setConnectionError(results[2].reason.message);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(previous => previous ? { ...previous, [key]: value } : previous);
    setDirty(true); setSuccess("");
  }
  function updateBrand(key: keyof SiteBranding, value: string) {
    setBranding(previous => ({ ...previous, [key]: value })); setDirty(true); setSuccess("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const path = tab === "Branding" ? "branding" : tab === "Security" ? "security" : "general";
      const body = path === "branding" ? branding : path === "security" ? {
        twoFactorAdmins: settings.twoFactorAdmins, sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        ipAllowListEnabled: settings.ipAllowListEnabled, ipAllowList: settings.ipAllowList,
      } : {
        siteName: settings.siteName, tagline: settings.tagline, supportEmail: settings.supportEmail,
        timezone: settings.timezone, defaultLanguage: settings.defaultLanguage, dailyPublishTime: settings.dailyPublishTime,
      };
      const data = await readAdminJson<Settings | SiteBranding>(await adminApiFetch(`/settings/${path}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      }));
      if (path === "branding") setSavedBrand(data as SiteBranding);
      else setSettings(data as Settings);
      setDirty(false); setSuccess(path === "branding" ? "Branding saved. Public assets update within a minute; reload the website to see them." : "Settings saved successfully.");
    } catch (cause) { setError(message(cause)); }
    finally { setSaving(false); }
  }
  async function maintenance() {
    if (!settings || !window.confirm(`${settings.maintenanceMode ? "Disable" : "Enable"} maintenance mode?`)) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const data = await readAdminJson<Settings>(await adminApiFetch("/settings/maintenance", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !settings.maintenanceMode }),
      }));
      if (data) setSettings(previous => previous ? { ...previous, maintenanceMode: data.maintenanceMode } : data);
      setSuccess("Maintenance setting updated.");
    } catch (cause) { setError(message(cause)); } finally { setSaving(false); }
  }
  async function upload(key: keyof SiteBranding, file?: File) {
    if (!file) return;
    setSaving(true); setError("");
    try {
      if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("Choose a PNG, JPEG, WebP or GIF image, up to 10 MB.");
      const asset = await uploadMedia(file); updateBrand(key, mediaUrl(asset.url));
    } catch (cause) { setError(message(cause)); } finally { setSaving(false); }
  }
  function switchTab(next: Tab) {
    if (tab === next) return;
    if (dirty && !window.confirm("Discard unsaved changes before switching tabs?")) return;
    if (dirty) { setDirty(false); refresh(); }
    setTab(next); setError(""); setSuccess("");
  }
  const saveButton = <div className={styles.actions}><button disabled={saving || !dirty} type="submit" className={styles.primary}>{saving ? "Saving…" : "Save Changes"}</button></div>;
  return <AdminShell><main className={styles.page}>
    <header className={styles.header}><div><h1>Settings</h1><p>Configure Business Nuggets for web and mobile.</p></div>
      <button className={styles.secondary} disabled={loading || saving} onClick={() => { if (!dirty || window.confirm("Discard unsaved changes and refresh?")) { setDirty(false); refresh(); } }}><RefreshCw size={14} /> Refresh</button>
    </header>
    <div className={styles.tabs} role="tablist" aria-label="Settings sections">{tabs.map(value => <button key={value} id={`tab-${value}`} role="tab" aria-selected={tab === value} aria-controls={`panel-${value}`} tabIndex={tab === value ? 0 : -1} disabled={saving} onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault(); const index = tabs.indexOf(value);
      const next = tabs[event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      switchTab(next); document.getElementById(`tab-${next}`)?.focus();
    }} onClick={() => switchTab(value)}>{value}</button>)}</div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {success && <p className={styles.success} role="status"><Check size={16} />{success}</p>}
    {loading ? <p role="status">Loading settings…</p> : !settings ? <p>Settings could not be loaded. Use Refresh to try again.</p> : <section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
      <form onSubmit={save}><fieldset disabled={saving} className={styles.fieldset}>
      {tab === "General" && <div className={styles.columns}>
        <Card title="General Settings"><div className={styles.fields}>
          <Field label="Site Name" value={settings.siteName} required maxLength={160} onChange={value => update("siteName", value)} />
          <Field label="Tagline" value={settings.tagline} maxLength={240} onChange={value => update("tagline", value)} />
          <div className={styles.pair}><Field label="Support Email" type="email" required value={settings.supportEmail} onChange={value => update("supportEmail", value)} /><Field label="Timezone" value={settings.timezone} onChange={value => update("timezone", value)} /></div>
          <div className={styles.pair}><Field label="Default Language" value={settings.defaultLanguage} onChange={value => update("defaultLanguage", value)} /><Field label="Daily Publish Time" type="time" required value={settings.dailyPublishTime} onChange={value => update("dailyPublishTime", value)} /></div>
        </div>{saveButton}</Card>
        <div className={styles.stack}><Card title="Site Pages"><p>Edit About, Contact, FAQs, Privacy Policy and Terms of Use from one place.</p><Link className={`${styles.secondary} bn-button`} href="/admin/pages">Manage Site Pages</Link></Card>
        <Card title="Maintenance Mode"><p>Current setting: {settings.maintenanceMode ? "Enabled" : "Disabled"}.</p><button type="button" className={styles.secondary} onClick={() => void maintenance()}>{settings.maintenanceMode ? "Disable" : "Enable"} Maintenance</button></Card></div>
      </div>}
      {tab === "Branding" && (brandReady ? <div className={styles.columns}>
        <Card title="Brand Identity"><div className={styles.pair}>{(["logoUrl", "faviconUrl"] as const).map(key => <AssetField key={key} label={key === "logoUrl" ? "Logo" : "Favicon"} value={branding[key]} onChange={value => updateBrand(key, value)} onUpload={file => void upload(key, file)} />)}</div>
          <div className={styles.divider}><h3>Brand Colours</h3><div className={styles.swatches}>{palette.map(([name, hex]) => <div key={name}><div style={{ backgroundColor: hex }} className={styles.swatch} /><span>{name}</span><code>{hex}</code></div>)}</div><p>These are the website’s current shared palette values.</p></div>
          <div className={styles.divider}><h3>Typography</h3><div className={styles.pair}><Field label="Heading Font" value="Playfair Display" readOnly /><Field label="Body Font" value="DM Sans" readOnly /></div><p>Buttons use Manrope at 13px. Public hero headings use 45px.</p><div className={styles.typeSample}><h3>Command Your Business with Absolute Clarity</h3><p>Biblical wisdom for modern leadership.</p></div></div>
          <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => { setBranding(savedBrand); setDirty(false); }}>Reset Changes</button>{saveButton}</div>
        </Card>
        <div className={styles.stack}><Card title="Live Preview"><div className={styles.preview}><div className={styles.previewBrand}>{branding.logoUrl ? <Image src={branding.logoUrl} alt="Logo preview" width={26} height={26} unoptimized /> : <b>B</b>}<span>BUSINESS NUGGETS</span></div><h3>Command Your Business<br />with Absolute Clarity</h3><span className={styles.previewButton}>Start Reading</span></div><div className={styles.typeSample}><p>Today’s Business Nugget</p><h3>The Law of Just Balances</h3><span className={styles.badge}>Negotiation</span></div></Card>
        <Card title="Social Share Image"><AssetField label="Social image" value={branding.socialImageUrl} onChange={value => updateBrand("socialImageUrl", value)} onUpload={file => void upload("socialImageUrl", file)} wide /><p>1200 × 630 recommended. Used for website link previews. Uploads are also saved in the Media Library. PNG favicon recommended.</p></Card></div>
      </div> : <p>Branding could not be loaded. Refresh to retry before editing.</p>)}
      {(tab === "Payments" || tab === "Integrations") && <>{connectionError && <p className={styles.error} role="alert">{connectionError}</p>}{!connections ? <p>Connection settings are unavailable. Refresh to retry.</p> : tab === "Payments" ? <div className={styles.columns}>
        <div className={styles.stack}><Card title="Payment Providers">{["Paystack", "Stripe", "Flutterwave"].map(name => <Provider key={name} name={name} description={name === "Paystack" ? "Cards, bank transfer and supported local methods" : "Provider integration not implemented"} status={name === "Paystack" ? connections.paystack.configured ? "Configured" : "Not configured" : "Not available"} onConfigure={() => setSetup(name)} />)}</Card><Card title="Mobile In-App Purchases"><Provider name="Apple App Store" description="Store billing is not integrated yet" status="Not available" onConfigure={() => setSetup("Apple App Store")} /><Provider name="Google Play" description="Store billing is not integrated yet" status="Not available" onConfigure={() => setSetup("Google Play")} /><p>Web subscriptions currently use Paystack.</p></Card></div>
        <div className={styles.stack}><Card title="Currency & Pricing"><p>Currency and prices come from each subscription plan. Tax is not added separately by the current checkout.</p><Link href="/admin/subscriptions" className={`${styles.primary} bn-button`}>Manage Subscription Plans</Link></Card><Card title="Webhooks & Mode"><Field label="Paystack Webhook Path" value="/payments/webhook" readOnly /><p>Use your backend’s public URL followed by this path in Paystack’s dashboard.</p><p>Mode: <span className={styles.badge}>{connections.paystack.configured ? connections.paystack.mode : "Not configured"}</span></p><p>Mode is determined by the server’s Paystack key. Signed webhooks are verified before payments are applied.</p><button type="button" className={styles.secondary} onClick={() => setSetup("Paystack")}>View Setup</button></Card></div>
      </div> : <><div className={styles.integrations}>{([
        ["Firebase Messaging", "Push notifications for the mobile app", connections.firebase.configured],
        ["Google Analytics", "Analytics integration not implemented", false],
        ["Email Service", "Transactional email through SMTP", connections.email.configured],
        ["Slack", "Admin alerts integration not implemented", false],
        ["App Store Connect", "iOS publishing integration not implemented", false],
        ["Google Play Console", "Android publishing integration not implemented", false],
        ["Cloudinary", "Image and audio storage for the Media Library", connections.cloudinary.configured],
      ] as const).map(([name, description, configured]) => <Card key={name}><div className={styles.integrationTop}><span className={styles.initial}>{name[0]}</span><Status label={configured ? "Configured" : ["Firebase Messaging", "Email Service", "Cloudinary"].includes(name) ? "Not configured" : "Not available"} /></div><h3>{name}</h3><p>{description}</p><button type="button" className={styles.secondary} onClick={() => setSetup(name)}>View Setup</button></Card>)}</div><Card title="API Keys"><p>The website and mobile app use authenticated user sessions. There is no general API-key issuing system yet. Provider credentials are managed in the backend deployment environment and are never displayed here.</p></Card></>}</>}
      {tab === "Security" && <Card title="Admin Security"><div className={styles.fields}>
        <Toggle label="Require two-factor authentication for admins" checked={settings.twoFactorAdmins} onChange={value => update("twoFactorAdmins", value)} />
        <Field label="Session Timeout (minutes)" type="number" min={5} max={1440} value={String(settings.sessionTimeoutMinutes)} onChange={value => update("sessionTimeoutMinutes", Number(value))} />
        <label>Allowed IP Addresses<textarea value={settings.ipAllowList.join("\n")} onChange={event => update("ipAllowList", event.target.value.split("\n"))} rows={5} placeholder="One IPv4 or IPv6 address per line" /></label>
        <Toggle label="Enable IP allow-list" checked={settings.ipAllowListEnabled} onChange={value => update("ipAllowListEnabled", value)} />
        <p>Add your current public IP before enabling the allow-list. IP enforcement requires the frontend and backend proxy secret to be configured.</p>
      </div>{saveButton}</Card>}
      </fieldset></form>
    </section>}
    {setup && <SetupDialog name={setup} close={() => setSetup(null)} />}
  </main></AdminShell>;
}
function message(cause: unknown) { return cause instanceof Error ? cause.message : "Could not connect to the settings server. Please retry."; }
function Card({ title, children }: { title?: string; children: ReactNode }) { return <article className={styles.card}>{title && <h2>{title}</h2>}{children}</article>; }
function Field({ label, value, onChange, ...props }: { label: string; value: string; onChange?: (value: string) => void; type?: string; readOnly?: boolean; required?: boolean; min?: number; max?: number; maxLength?: number }) {
  return <label>{label}<input {...props} value={value} onChange={event => onChange?.(event.target.value)} /></label>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className={styles.toggleRow}>{label}<input type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.target.checked)} /></label>;
}
function AssetField({ label, value, onChange, onUpload, wide }: { label: string; value: string; onChange: (value: string) => void; onUpload: (file?: File) => void; wide?: boolean }) {
  return <div className={styles.asset}><span>{label}</span><div className={wide ? styles.wideImage : styles.assetImage}>{value ? <Image src={value} alt={`${label} preview`} width={wide ? 1200 : 60} height={wide ? 630 : 60} unoptimized /> : wide ? "1200 × 630 recommended" : "B"}</div>
    <Field label={`${label} URL`} type="url" value={value} onChange={onChange} maxLength={2048} />
    <label className={styles.fileLabel}><ImagePlus size={15} /> Upload Image<input aria-label={`Upload ${label}`} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => { onUpload(event.target.files?.[0]); event.target.value = ""; }} /></label><span className={styles.hint}>HTTPS image URL or upload; 10 MB maximum.</span>
  </div>;
}
function Status({ label }: { label: string }) { return <span className={label === "Configured" ? styles.configured : styles.badge}>{label}</span>; }
function Provider({ name, description, status, onConfigure }: { name: string; description: string; status: string; onConfigure: () => void }) {
  return <div className={styles.provider}><span className={styles.initial}>{name[0]}</span><div className={styles.providerName}><strong>{name}</strong><p>{description}</p></div><Status label={status} /><button type="button" className={styles.textButton} onClick={onConfigure}>View Setup</button></div>;
}
const guides: Record<string, { description: string; variables?: string[] }> = {
  Paystack: { description: "Paystack is the implemented web checkout provider. Configure its secret key in the backend deployment, then set the webhook URL in Paystack’s dashboard. Use a test key for test payments and a live key for real payments.", variables: ["PAYSTACK_SECRET_KEY", "PAYSTACK_CALLBACK_URL"] },
  "Email Service": { description: "Configure SMTP on the backend deployment for transactional emails. Redeploy after changing credentials.", variables: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] },
  "Firebase Messaging": { description: "Configure the Firebase service account on the backend for mobile push notifications.", variables: ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"] },
  Cloudinary: { description: "Configure Cloudinary on the backend for image and audio uploads. Uploaded files are available in the Media Library.", variables: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] },
};
function SetupDialog({ name, close }: { name: string; close: () => void }) {
  const guide = guides[name]; const [copied, setCopied] = useState(false);
  return <dialog ref={element => { if (element && !element.open) element.showModal(); }} onClose={close} className={styles.dialog} aria-labelledby="setup-title"><div className={styles.dialogHeader}><h2 id="setup-title">{name} Setup</h2><button type="button" aria-label="Close setup" className={styles.secondary} onClick={close}><X size={18} /></button></div><p>{guide?.description || `${name} is shown in the supplied design, but its backend integration is not implemented. Connecting an account requires additional development.`}</p>
    {guide?.variables && <><p>Backend environment variables:</p><pre>{guide.variables.join("\n")}</pre><button type="button" className={styles.secondary} onClick={async () => { try { await navigator.clipboard.writeText(guide.variables!.join("\n")); setCopied(true); } catch { setCopied(false); } }}><Copy size={14} />{copied ? "Copied" : "Copy Variable Names"}</button><p>Configured means the required values are present. It does not confirm a live connection.</p></>}
    <div className={styles.actions}><button type="button" className={styles.primary} onClick={close}>Done</button></div>
  </dialog>;
}
