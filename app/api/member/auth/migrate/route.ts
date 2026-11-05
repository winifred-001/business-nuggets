import {
  NextRequest,
  NextResponse,
} from "next/server";

import { API_URL } from "@/lib/api";
import {
  MEMBER_BROWSER_SESSION_MARKER,
  MEMBER_SESSION_COOKIE,
  MEMBER_SESSION_MAX_AGE_SECONDS,
} from "@/lib/member-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(
  request: NextRequest,
) {
  const origin =
    request.headers.get("origin");

  return (
    !origin ||
    origin ===
      request.nextUrl.origin
  );
}

export async function POST(
  request: NextRequest,
) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      {
        message:
          "Cross-origin request rejected",
      },
      { status: 403 },
    );
  }

  let body: {
    token?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        message:
          "Invalid request body",
      },
      { status: 400 },
    );
  }

  const token =
    typeof body.token === "string"
      ? body.token.trim()
      : "";

  if (
    !token ||
    token.length > 8192
  ) {
    return NextResponse.json(
      {
        message:
          "Invalid legacy session",
      },
      { status: 400 },
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
    return NextResponse.json(
      {
        message:
          "Legacy session is no longer valid",
      },
      { status: 401 },
    );
  }

  const user =
    await upstream
      .json()
      .catch(() => null);

  const response =
    NextResponse.json({
      authenticated: true,
      token:
        MEMBER_BROWSER_SESSION_MARKER,
      user,
    });

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
      maxAge:
        MEMBER_SESSION_MAX_AGE_SECONDS,
    },
  );

  response.headers.set(
    "Cache-Control",
    "no-store",
  );

  return response;
}
