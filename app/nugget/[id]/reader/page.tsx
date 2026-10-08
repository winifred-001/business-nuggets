import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { getNuggetBySlug } from "@/lib/nuggets";

export default async function ReaderViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nugget = getNuggetBySlug(id);

  if (!nugget) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <article>
          <nav
            aria-label="Reader breadcrumb"
            className="mb-6 flex flex-wrap gap-2 text-sm text-gray-600"
          >
            <Link href="/library">Wisdom Archive</Link>

            <span>/</span>

            <Link
              href={`/library?topic=${encodeURIComponent(nugget.topic)}`}
            >
              {nugget.topic}
            </Link>
          </nav>

          <p className="text-xs text-amber-800">
            Nugget #{nugget.number} · {nugget.scriptureRef}
          </p>

          <h1 className="mt-3 break-words font-serif text-3xl leading-tight sm:text-4xl">
            {nugget.title}
          </h1>

          {nugget.scriptureText && (
            <blockquote className="my-8 border-l-4 border-amber-400 bg-amber-50 p-5 font-serif text-lg italic">
              “{nugget.scriptureText}”

              <p className="mt-3 text-xs not-italic text-amber-800">
                {nugget.scriptureRef}
              </p>
            </blockquote>
          )}

          <section className="mt-8">
            <h2 className="font-serif text-2xl">Key Principle</h2>

            <p className="mt-3 leading-8 text-gray-700">
              {nugget.keyPrinciple ||
                "Commentary for this sample nugget will be added soon."}
            </p>
          </section>

          {nugget.marketplaceApplication && (
            <section className="mt-8">
              <h2 className="font-serif text-2xl">
                Marketplace Application
              </h2>

              <p className="mt-3 leading-8 text-gray-700">
                {nugget.marketplaceApplication}
              </p>
            </section>
          )}

          {nugget.practicalActionPlan.length > 0 && (
            <section className="mt-8">
              <h2 className="font-serif text-2xl">
                Practical Action Plan
              </h2>

              <ol className="mt-4 list-decimal space-y-3 pl-5 leading-8 text-gray-700">
                {nugget.practicalActionPlan.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ol>
            </section>
          )}

          <Link
            href={`/nugget/${nugget.slug}`}
            className="mt-10 inline-block rounded bg-amber-300 px-5 py-3 text-sm font-medium text-black"
          >
            Back to nugget
          </Link>
        </article>
      </main>

      <Footer />
    </div>
  );
}