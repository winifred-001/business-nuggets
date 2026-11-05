import {
  NextResponse,
} from "next/server";
import {
  cookies,
} from "next/headers";

import { API_URL } from "@/lib/api";
import {
  ADMIN_SESSION_COOKIE,
} from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      ADMIN_SESSION_COOKIE,
    )?.value;

  if (!token) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 401,
      },
    );
  }

  let upstream: Response;

  try {
    upstream = await fetch(
      `${API_URL}/admin/test`,
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
        authenticated: false,
        message:
          "Admin session verification is temporarily unavailable",
      },
      {
        status: 502,
      },
    );
  }

  if (!upstream.ok) {
    const response =
      NextResponse.json(
        {
          authenticated: false,
        },
        {
          status: 401,
        },
      );

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

    return response;
  }

  const response =
    NextResponse.json({
      authenticated: true,
    });

  response.headers.set(
    "Cache-Control",
    "no-store",
  );

  return response;
}
