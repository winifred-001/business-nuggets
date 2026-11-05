"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type AuthRouteGuardProps = {
  children: React.ReactNode;

  /*
   * protected:
   * Only logged-in users can see the page.
   *
   * guest:
   * Only logged-out visitors should see it.
   */
  type: "protected" | "guest";
};

export default function AuthRouteGuard({
  children,
  type,
}: AuthRouteGuardProps) {
  const router = useRouter();

  const [checking, setChecking] =
    useState(true);

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const loggedIn =
      Boolean(token);

    /*
     * Logged-out user trying to access
     * the member homepage.
     */
    if (
      type === "protected" &&
      !loggedIn
    ) {
      router.replace("/");
      return;
    }

    /*
     * Logged-in user visiting the
     * visitor landing page.
     */
    if (
      type === "guest" &&
      loggedIn
    ) {
      router.replace("/home");
      return;
    }

    setChecking(false);
  }, [router, type]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] text-[14px] text-white/45">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}