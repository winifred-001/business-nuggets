import Link from "next/link";

export default function NuggetAccessLimitGate({
  message,
  code,
}: {
  message: string;
  code?: string;
}) {
  const inGrace = code === "SUBSCRIPTION_GRACE";
  const outOfCredits = code === "TOPUP_CREDITS_EXHAUSTED";
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 py-20 text-center text-[#FAF9F6]">
      <section className="max-w-[560px] rounded-2xl border border-[#E28906]/35 bg-[#111111] p-8 sm:p-10">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#E28906]">{inGrace ? "Subscription grace" : "Nugget access limit"}</p>
        <h1 className="mt-4 font-serif text-[32px]">{inGrace ? "Your paid reading grace period" : outOfCredits ? "Top-up credits are used" : "Your current selection is full"}</h1>
        <p className="mt-4 text-[14px] leading-7 text-white/55">{message}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/library" className="bn-button inline-flex rounded-lg border border-white/20 px-6 py-3 text-[13px] font-semibold text-white">Return to Library</Link>
          <Link href="/membership" className="bn-button inline-flex rounded-lg bg-[#E28906] px-6 py-3 text-[13px] font-semibold text-[#080808]">{inGrace ? "Renew Subscription" : "Get More Nuggets"}</Link>
        </div>
      </section>
    </main>
  );
}
