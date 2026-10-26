"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { safeReturnPath } from "@/lib/auth-return";
function ContinueLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const params = useSearchParams();
  const next = params.get("next");
  return <Link href={next ? `${href}?next=${encodeURIComponent(safeReturnPath(next))}` : href} className={className}>{children}</Link>;
}
export default function AuthContinueLink(props: { href: string; children: ReactNode; className?: string }) {
  return <Suspense fallback={<Link href={props.href} className={props.className}>{props.children}</Link>}><ContinueLink {...props} /></Suspense>;
}
