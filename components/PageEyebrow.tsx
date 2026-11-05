import type { ReactNode } from "react";

export default function PageEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-[14px] text-[11px]! font-extrabold leading-[16px]! tracking-[0.25em] text-[#E28906] uppercase">
      <span aria-hidden="true" className="h-px w-9 shrink-0 bg-[#E28906]" />
      <span>{children}</span>
    </div>
  );
}
