"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

export default function VisitorOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [ready, setReady] =
    useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (token) {
      router.replace("/home");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#080808]" />
    );
  }

  return <>{children}</>;
}