import Link from "next/link";

export default function NuggetAccessLimitGate({
  message,
}: {
  message: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 py-20 text-center text-[#FAF9F6]">
      <section className="max-w-[560px] rounded-2xl border border-[#E28906]/35 bg-[#111111] p-8 sm:p-10">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#E28906]">Nugget access limit</p>
        <h1 className="mt-4 font-serif text-[32px]">Your current selection is full</h1>
        <p className="mt-4 text-[14px] leading-7 text-white/55">{message}</p>
        <Link href="/library" className="bn-button mt-7 inline-flex rounded-lg bg-[#E28906] px-6 py-3 text-[13px] font-semibold text-[#080808]">Return to Library</Link>
      </section>
    </main>
  );
}
