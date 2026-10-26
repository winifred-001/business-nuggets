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

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      MEMBER_SESSION_COOKIE,
    )?.value;

  if (token) {
    try {
      await fetch(
        `${API_URL}/auth/logout`,
        {
          method: "POST",
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
      // The local session cookie is still cleared below.
    }
  }

  const response =
    NextResponse.json({
      message:
        "Logged out successfully",
    });

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

  response.headers.set(
    "Cache-Control",
    "no-store",
  );

  return response;
}
