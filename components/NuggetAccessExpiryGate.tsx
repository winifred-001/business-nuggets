"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = [hours, minutes, seconds]
    .map(value => String(value).padStart(2, "0"))
    .join(":");
  return days > 0 ? `${days}d ${clock}` : clock;
}

export default function NuggetAccessExpiryGate({
  expiresAt,
  restored = false,
  grace = false,
  children,
}: {
  expiresAt?: string | null;
  durationHours?: number;
  restored?: boolean;
  grace?: boolean;
  children: React.ReactNode;
}) {
  const expiryTime = expiresAt ? new Date(expiresAt).getTime() : null;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!expiryTime) return;
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [expiryTime]);

  if (!expiryTime || now === null) return <>{children}</>;

  const remaining = expiryTime - now;

  if (remaining <= 0) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-5 py-20 text-center">
        <section className="max-w-[560px] rounded-2xl border border-[#E28906]/35 bg-[#111111] p-8 sm:p-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#E28906]">
            Access period ended
          </p>
          <h1 className="mt-4 font-serif text-[32px] text-[#FAF9F6]">
            {grace ? "Your three-day paid reading grace has ended" : restored ? "Your paid subscription access has ended" : "Your monthly Nugget reading allowance has ended"}
          </h1>
          <p className="mt-4 text-[14px] leading-7 text-white/55">
            {grace
              ? "Your paid Nuggets are now locked. Renew your subscription to regain access to your reading history."
              : restored
              ? "Your previously opened Nuggets are locked until a new payment is verified and your subscription is active again."
              : "Your chosen Nuggets have reached the end of their monthly reading period. Return to the Library to select your next set of Nuggets."}
          </p>
          <Link href="/library" className="bn-button mt-7 inline-flex rounded-lg bg-[#E28906] px-6 py-3 text-[13px] font-semibold text-[#080808]">
            Return to Library
          </Link>
        </section>
      </main>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-[60] flex items-center justify-center gap-3 border-b border-[#E28906]/25 bg-[#111111] px-4 py-2.5 text-[12px] text-white/70">
        <span className="uppercase tracking-[0.08em] text-[#E28906]">{grace ? "Paid reading grace ends in" : restored ? "Renewed subscription access ends in" : "Your access ends in"}</span>
        <span className="font-mono text-[14px] font-semibold tabular-nums text-[#FAF9F6]">
          {formatRemaining(remaining)}
        </span>
      </div>
      {children}
    </>
  );
}
