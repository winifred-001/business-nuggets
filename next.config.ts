import type { NextConfig } from "next";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://business-nuggets-api.onrender.com";

const isDevelopment =
  process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${
    isDevelopment
      ? " 'unsafe-eval'"
      : ""
  }`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://api.cloudinary.com https://res.cloudinary.com https://*.r2.dev https://*.r2.cloudflarestorage.com ${apiUrl}${
    isDevelopment
      ? " http://localhost:3001 ws://localhost:*"
      : ""
  }`,
  "media-src 'self' blob: https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Strict-Transport-Security",
    value:
      "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Media Library URLs may use the API proxy, Cloudinary, or external storage.
  // Let browsers load them directly without the optimizer hostname restriction.
  images: { unoptimized: true },
  // Keep old cover URLs saved in the database usable until an admin replaces them.
  async rewrites() {
    return [{
      source: "/images/:asset(audio-player\\.png|cinematic-musical1\\.png|cinematic-musical2\\.png|cinematic-musical3\\.png|collection-main\\.png|musical\\.png|nugget-card1\\.png|nugget-card2\\.png|nugget-card4\\.png|nugget-card5\\.png|nugget-card6\\.png|nuggetCard\\.png|playlist-details\\.png|playlist-details1\\.png|playlist-details2\\.png|playlist-details3\\.png|playlist-details4\\.png|saved-nugget1\\.png|saved-nugget2\\.png|saved-nugget3\\.png|saved-nugget4\\.png|scripture-index\\.png|scripture-index1\\.png|search\\.png|search1\\.png|topic\\.png|unit-information1\\.png|unit-information2\\.png|visiting-homepage\\.png|visiting-homepage1\\.png|visiting-homepage2\\.png|visiting-homepage3\\.png|visiting-homepage4\\.png|visiting-homepage5\\.png|visiting-homepage6\\.png|visiting-homepage7\\.png|nugget\\.jpg)",
      destination: "/media-placeholder.svg",
    }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
