import { loadSiteBranding } from "@/lib/site-branding";
import type { Metadata } from "next";
import { DM_Sans, Manrope, Playfair_Display, Geist_Mono } from "next/font/google";
import AuthCookieSync from "@/components/AuthCookieSync";
import "./globals.css";
import "./corporate-theme.css";
import "./brand-palette.css";
import "./dropdowns.css";
import "./subscription-modal.css";
import "./reference-design-system.css";
import "./visitor-chrome.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await loadSiteBranding();
  return {
    title: "Business Nuggets",
    description: "Biblical business wisdom for the marketplace.",
    ...(branding.faviconUrl && { icons: { icon: branding.faviconUrl } }),
    ...(branding.socialImageUrl && { openGraph: { images: [branding.socialImageUrl] }, twitter: { card: "summary_large_image", images: [branding.socialImageUrl] } }),
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${manrope.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthCookieSync />
        {children}
      </body>
    </html>
  );
}
