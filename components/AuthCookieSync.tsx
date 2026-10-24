"use client";

import {
  useEffect,
} from "react";

import {
  clearMemberTokenCookie,
  syncMemberTokenCookie,
} from "@/lib/auth-cookie";

export default function AuthCookieSync() {
  useEffect(() => {
    function sync() {
      const token =
        localStorage.getItem(
          "token",
        );

      if (token) {
        syncMemberTokenCookie(
          token,
        );
      } else {
        clearMemberTokenCookie();
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
  }, []);

  return null;
}
