import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

type LibraryEmptyPageProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export default function LibraryEmptyPage({
  title,
  description,
  actionHref = "/library",
  actionLabel = "Browse the library",
}: LibraryEmptyPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar showAuthLinks={false} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-serif text-3xl sm:text-4xl">
          {title}
        </h1>

        <section className="mx-auto mt-8 max-w-2xl rounded-xl border border-gray-800 bg-neutral-950 p-6 text-center sm:p-10">
          <h2 className="font-serif text-2xl">
            Nothing here yet
          </h2>

          <p className="mt-4 leading-relaxed text-gray-400">
            {description}
          </p>

          <Link
            href={actionHref}
            className="mt-6 inline-block rounded bg-amber-300 px-5 py-3 text-sm font-medium text-black"
          >
            {actionLabel}
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}