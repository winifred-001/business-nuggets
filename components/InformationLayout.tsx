import type { ReactNode } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

export default function InformationLayout({ title, introduction, children }: {
  title: string; introduction: string; children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#10110f] text-[#f9f5ed]">
      <Navbar />
      <main className="mx-auto w-full max-w-[1050px] flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <header className="mb-10 border-b border-[#ead2a0]/20 pb-8">
          <h1 className="font-serif text-[45px]! leading-tight">{title}</h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[#b4b2ab]">{introduction}</p>
        </header>
        {children}
      </main>
      <Footer />
    </div>
  );
}
