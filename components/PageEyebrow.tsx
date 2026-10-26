import type { ReactNode } from "react";

export default function PageEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-[14px] text-[11px]! font-extrabold leading-[16px]! tracking-[0.25em] text-[#cda762] uppercase">
      <span aria-hidden="true" className="h-px w-9 shrink-0 bg-[#cda762]" />
      <span>{children}</span>
    </div>
  );
}
