import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar showAuthLinks={false} />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl rounded-xl border border-gray-800 p-6 text-center sm:p-10">
          <p className="text-sm text-amber-300">404</p>

          <h1 className="mt-3 font-serif text-3xl">
            Page not found
          </h1>

          <p className="mt-4 text-gray-400">
            This nugget or page isn&apos;t in the library.
            Browse the archive to find another nugget.
          </p>

          <Link
            href="/library"
            className="mt-6 inline-block rounded bg-amber-300 px-5 py-3 font-medium text-black"
          >
            Browse the library
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}