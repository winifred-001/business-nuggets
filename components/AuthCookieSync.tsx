"use client";

import {
  useEffect,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  clearMemberTokenCookie,
  MEMBER_TOKEN_COOKIE_NAME,
  syncMemberTokenCookie,
} from "@/lib/auth-cookie";

function readCookie(
  name: string,
) {
  const prefix =
    `${name}=`;

  const match =
    document.cookie
      .split("; ")
      .find((entry) =>
        entry.startsWith(
          prefix,
        ),
      );

  return match
    ? decodeURIComponent(
        match.slice(
          prefix.length,
        ),
      )
    : null;
}

export default function AuthCookieSync() {
  const router = useRouter();

  useEffect(() => {
    function sync() {
      const token =
        localStorage.getItem(
          "token",
        );

      const cookieToken =
        readCookie(
          MEMBER_TOKEN_COOKIE_NAME,
        );

      if (token) {
        if (
          cookieToken !== token
        ) {
          syncMemberTokenCookie(
            token,
          );
          router.refresh();
        }
        return;
      }

      if (cookieToken) {
        clearMemberTokenCookie();
        router.refresh();
      }
    }

    sync();

    window.addEventListener(
      "auth-change",
      sync,
    );

    window.addEventListener(
      "storage",
      sync,
    );

    return () => {
      window.removeEventListener(
        "auth-change",
        sync,
      );

      window.removeEventListener(
        "storage",
        sync,
      );
    };
  }, [router]);

  return null;
}
