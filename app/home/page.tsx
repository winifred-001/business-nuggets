import Link from "next/link";
import AuthRouteGuard from "@/components/AuthRouteGuard";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import NuggetCard from "@/components/NuggetCard";
import { getPublishedNuggets } from "@/lib/nuggets-api";
import { getServerMemberToken } from "@/lib/server-member-token";
import type { Nugget } from "@/types/nugget";

export default async function HomePage() {
  const token =
    await getServerMemberToken();

  let items: Nugget[] = [];

  try {
    items = (
      await getPublishedNuggets(
        token,
      )
    ).slice(0, 6);
  } catch (error) {
    console.error(
      "Could not load member home Nuggets:",
      error,
    );
  }

  return (
    <AuthRouteGuard type="protected">
      <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
        <Navbar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
          <h1 className="bn-hero-title font-serif text-[34px] leading-tight sm:text-[40px]">
            Your wisdom workspace
          </h1>

          <p className="mt-3 text-[16px] leading-7 text-white/50">
            Continue learning and discover your next Business Nugget.
          </p>

          <section className="mt-8 rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-6">
            <h2 className="font-serif text-[28px]">
              Continue listening
            </h2>

            <p className="mt-3 text-[14px] leading-6 text-white/45">
              Your recent listening activity will appear here as you use the audio library.
            </p>

            <Link
              href="/library"
              className="bn-button mt-4 inline-flex min-h-11 items-center text-[14px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              Browse Nuggets to read →
            </Link>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-[28px]">
              Discover your next Nugget
            </h2>

            {items.length > 0 ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((nugget) => (
                  <NuggetCard
                    key={nugget.slug}
                    nugget={nugget}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-white/10 bg-[#111111] p-6 text-[14px] text-white/45">
                No published Nuggets are available yet.
              </p>
            )}

            <Link
              href="/library"
              className="bn-button mt-6 inline-flex min-h-11 items-center text-[14px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              Explore the full library →
            </Link>
          </section>
        </main>

        <Footer />
      </div>
    </AuthRouteGuard>
  );
}
