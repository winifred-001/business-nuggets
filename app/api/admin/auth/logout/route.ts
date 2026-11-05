import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ADMIN_SESSION_COOKIE,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
) {
  const origin =
    request.headers.get(
      "origin",
    );

  if (
    origin &&
    origin !==
      request.nextUrl.origin
  ) {
    return NextResponse.json(
      {
        message:
          "Cross-origin request rejected",
      },
      {
        status: 403,
      },
    );
  }

  const response =
    NextResponse.json({
      message:
        "Signed out successfully",
    });

  response.cookies.set(
    ADMIN_SESSION_COOKIE,
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
