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

  let body: Record<string, unknown>;

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

  let upstream: Response;

  try {
    upstream = await fetch(
      `${API_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Accept:
            "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
  } catch {
    return NextResponse.json(
      {
        message:
          "Registration service temporarily unavailable",
      },
      { status: 502 },
    );
  }

  const data =
    await upstream
      .json()
      .catch(() => ({
        message:
          "Registration failed",
      }));

  if (!upstream.ok) {
    return NextResponse.json(
      data,
      { status: upstream.status },
    );
  }

  const token =
    typeof data?.token === "string"
      ? data.token
      : null;

  if (!token) {
    return NextResponse.json(
      {
        message:
          "Registration service returned an incomplete session",
      },
      { status: 502 },
    );
  }

  const {
    token: _token,
    ...safeData
  } = data;

  const response =
    NextResponse.json({
      ...safeData,
      authenticated: true,
      token:
        MEMBER_BROWSER_SESSION_MARKER,
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
