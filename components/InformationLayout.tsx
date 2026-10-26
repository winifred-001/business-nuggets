import type { ReactNode } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import PageEyebrow from "@/components/PageEyebrow";

export default function InformationLayout({ title, introduction, eyebrow, children }: {
  title: string; introduction: string; eyebrow?: string; children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#10110f] text-[#f9f5ed]">
      <Navbar />
      <main className={eyebrow
        ? "mx-auto w-[calc(100%-38px)] max-w-[1190px] flex-1 pt-16 pb-12 sm:pt-24 sm:pb-16 lg:w-[calc(100%-64px)]"
        : "mx-auto w-full max-w-[1050px] flex-1 px-5 py-12 sm:px-8 sm:py-16"}>
        <header className="mb-10 border-b border-[#ead2a0]/20 pb-8">
          {eyebrow && <PageEyebrow>{eyebrow}</PageEyebrow>}
          <h1 className={`font-serif text-[45px]! leading-tight ${eyebrow ? "mt-[27px]" : ""}`}>{title}</h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[#b4b2ab]">{introduction}</p>
        </header>
        {children}
      </main>
      <Footer />
    </div>
  );
}
