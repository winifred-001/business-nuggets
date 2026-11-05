import {
  cookies,
} from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { API_URL } from "@/lib/api";
import {
  MEMBER_SESSION_COOKIE,
} from "@/lib/member-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
) {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      MEMBER_SESSION_COOKIE,
    )?.value;

  if (!token) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      { status: 401 },
    );
  }

  let upstream: Response;

  try {
    upstream = await fetch(
      `${API_URL}/users/me`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
          Accept:
            "application/json",
        },
        cache: "no-store",
      },
    );
  } catch {
    return NextResponse.json(
      {
        message:
          "Session service temporarily unavailable",
      },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const response =
      NextResponse.json(
        {
          authenticated: false,
        },
        { status: upstream.status },
      );

    if (upstream.status === 401) {
      response.cookies.set(
        MEMBER_SESSION_COOKIE,
        "",
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        },
      );
    }

    return response;
  }

  const user =
    await upstream
      .json()
      .catch(() => null);

  const response =
    NextResponse.json({
      authenticated: true,
      user,
    });

  /*
   * Only reissue when the browser has a cookie but no local session marker.
   * This upgrades old JavaScript-readable cookies to HttpOnly without
   * changing the persistence of normal new login sessions.
   */
  if (
    request.nextUrl.searchParams.get(
      "upgradeLegacy",
    ) === "1"
  ) {
    response.cookies.set(
      MEMBER_SESSION_COOKIE,
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
      },
    );
  }

  response.headers.set(
    "Cache-Control",
    "no-store",
  );

  return response;
}
