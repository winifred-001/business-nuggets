"use client";

import {
  useEffect,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  MEMBER_BROWSER_SESSION_MARKER,
} from "@/lib/member-session";

function clearLocalMemberSession() {
  localStorage.removeItem(
    "token",
  );
  localStorage.removeItem(
    "user",
  );
}

export default function AuthCookieSync() {
  const router = useRouter();

  useEffect(() => {
    if (
      window.location.pathname ===
        "/admin" ||
      window.location.pathname.startsWith(
        "/admin/",
      )
    ) {
      return;
    }

    let cancelled = false;
    let syncing = false;

    async function sync() {
      if (
        cancelled ||
        syncing
      ) {
        return;
      }

      syncing = true;

      try {
        const token =
          localStorage.getItem(
            "token",
          );

        if (
          token &&
          token !==
            MEMBER_BROWSER_SESSION_MARKER
        ) {
          const response =
            await fetch(
              "/api/member/auth/migrate",
              {
                method:
                  "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    token,
                  }),
              },
            );

          const data =
            await response
              .json()
              .catch(() => ({}));

          if (
            !response.ok ||
            !data.authenticated
          ) {
            clearLocalMemberSession();
            window.dispatchEvent(
              new Event(
                "auth-change",
              ),
            );
            router.refresh();
            return;
          }

          localStorage.setItem(
            "token",
            MEMBER_BROWSER_SESSION_MARKER,
          );

          if (data.user) {
            localStorage.setItem(
              "user",
              JSON.stringify(
                data.user,
              ),
            );
          }

          window.dispatchEvent(
            new Event(
              "auth-change",
            ),
          );
          router.refresh();
          return;
        }

        const response =
          await fetch(
            "/api/member/auth/session",
            {
              cache:
                "no-store",
            },
          );

        if (!response.ok) {
          if (token) {
            clearLocalMemberSession();
            window.dispatchEvent(
              new Event(
                "auth-change",
              ),
            );
            router.refresh();
          }
          return;
        }

        const data =
          await response
            .json()
            .catch(() => ({}));

        const hadMarker =
          token ===
          MEMBER_BROWSER_SESSION_MARKER;

        localStorage.setItem(
          "token",
          MEMBER_BROWSER_SESSION_MARKER,
        );

        if (data.user) {
          localStorage.setItem(
            "user",
            JSON.stringify(
              data.user,
            ),
          );
        }

        if (!hadMarker) {
          window.dispatchEvent(
            new Event(
              "auth-change",
            ),
          );
          router.refresh();
        }
      } finally {
        syncing = false;
      }
    }

    void sync();

    const handleSync = () => {
      void sync();
    };

    window.addEventListener(
      "auth-change",
      handleSync,
    );

    window.addEventListener(
      "storage",
      handleSync,
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "auth-change",
        handleSync,
      );

      window.removeEventListener(
        "storage",
        handleSync,
      );
    };
  }, [router]);

  return null;
}
