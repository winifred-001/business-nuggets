"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
let brandingRequest: Promise<string> | undefined;
export default function BrandMark() {
  const [logo, setLogo] = useState("");
  useEffect(() => {
    brandingRequest ??= fetch("/api/site-branding").then(async response => response.ok ? (await response.json()).logoUrl || "" : "").catch(() => "");
    let active = true;
    void brandingRequest.then(value => { if (active) setLogo(value); });
    return () => { active = false; };
  }, []);
  if (!logo) {
    return <Image src="/images/business-nuggets-logo.webp" alt="" width={168} height={56}
      className="h-auto w-[132px] shrink-0 rounded bg-[#f9f5ed] px-2 py-1.5 sm:w-[168px]" />;
  }
  return <span className="grid h-[46px] w-[46px] shrink-0 place-items-center border border-[#d9b870] font-serif text-[26px] font-normal text-[#e5c98e]">
    {logo ? <Image src={logo} alt="" width={46} height={46} unoptimized className="h-full w-full object-contain" onError={() => setLogo("")} /> : "B"}
  </span>;
}
