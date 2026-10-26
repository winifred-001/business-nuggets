import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#10110f] px-0 pb-7 pt-12 text-[#b8b5aa]">
      <div className="mx-auto w-[calc(100%-38px)] max-w-[1190px] lg:w-[calc(100%-64px)]">
        <div className="flex flex-col items-start justify-between gap-7 border-b border-[rgba(234,210,160,.19)] pb-10 md:flex-row">
          <div>
            <Link
              href="/"
              className="flex items-center gap-[13px]"
              aria-label="Business Nuggets home"
            >
              <span className="grid h-[46px] w-[46px] shrink-0 place-items-center border border-[#d9b870] font-serif text-[26px] font-normal text-[#e5c98e]">
                B
              </span>

              <span className="block">
                <strong className="block text-[13px] font-bold tracking-[0.13em] text-[#f9f5ed] max-[600px]:text-[11px]">
                  BUSINESS NUGGETS
                </strong>
                <em className="block font-serif text-[14px] font-normal text-[#cda762]">
                  from the Bible
                </em>
              </span>
            </Link>

            <p className="mt-4 max-w-[340px] text-[12px] leading-[1.8] text-[#96938b]">
              Biblical principles. Practical wisdom. Purposeful enterprise.
            </p>
          </div>

          <nav
            className="flex flex-wrap gap-x-[26px] gap-y-3 text-[12px] text-[#b8b5aa]"
            aria-label="Footer navigation"
          >
            <Link href="/" className="transition hover:text-[#ead2a0]">
              Home
            </Link>
            <Link href="/library" className="transition hover:text-[#ead2a0]">
              Library
            </Link>
            <Link href="/#approach" className="transition hover:text-[#ead2a0]">
              Our Approach
            </Link>
            <Link
              href="/library?tab=Topics+Index"
              className="transition hover:text-[#ead2a0]"
            >
              Explore
            </Link>
            <Link
              href="/privacy-policy"
              className="transition hover:text-[#ead2a0]"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-use"
              className="transition hover:text-[#ead2a0]"
            >
              Terms of Use
            </Link>
          </nav>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-2 text-[11px] text-[#77776f] md:flex-row md:items-center">
          <span>© {year} Business Nuggets from the Bible. All rights reserved.</span>
          <span>Faith • Wisdom • Enterprise</span>
        </div>
      </div>
    </footer>
  );
}
