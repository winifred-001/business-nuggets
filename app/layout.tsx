import type { Metadata } from "next";
import { Inter, Geist_Mono, EB_Garamond } from "next/font/google";
import AuthCookieSync from "@/components/AuthCookieSync";
import "./globals.css";
import "./corporate-theme.css";
import "./brand-palette.css";
import "./dropdowns.css";
import "./subscription-modal.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const eBGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Business Nuggets",
  description: "Biblical business wisdom for the marketplace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${eBGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthCookieSync />
        {children}
      </body>
    </html>
  );
}
