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

const mutatingMethods =
  new Set([
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ]);

const blockedRoots =
  new Set([
    "admin",
    "docs",
    "health",
    "callback",
  ]);

const allowedAuthRoots =
  new Set([
    "logout",
    "sessions",
  ]);

function isBlockedPath(
  path: string[],
) {
  const root =
    path[0]?.toLowerCase() ??
    "";

  if (
    blockedRoots.has(root)
  ) {
    return true;
  }

  if (
    root === "auth" &&
    !allowedAuthRoots.has(
      path[1]?.toLowerCase() ??
        "",
    )
  ) {
    return true;
  }

  if (
    root === "payments" &&
    path[1]?.toLowerCase() ===
      "webhook"
  ) {
    return true;
  }

  return false;
}

function isSameOriginMutation(
  request: NextRequest,
) {
  if (
    !mutatingMethods.has(
      request.method,
    )
  ) {
    return true;
  }

  const origin =
    request.headers.get(
      "origin",
    );

  const fetchSite =
    request.headers.get(
      "sec-fetch-site",
    );

  if (
    origin &&
    origin !==
      request.nextUrl.origin
  ) {
    return false;
  }

  if (
    fetchSite &&
    fetchSite !==
      "same-origin" &&
    fetchSite !== "none"
  ) {
    return false;
  }

  return true;
}

async function proxyRequest(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  },
) {
  if (
    !isSameOriginMutation(
      request,
    )
  ) {
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

  if (!token) {
    return NextResponse.json(
      {
        message:
          "Member session required",
      },
      { status: 401 },
    );
  }

  const {
    path = [],
  } = await context.params;

  if (
    path.length === 0 ||
    path.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === "..",
    ) ||
    isBlockedPath(path)
  ) {
    return NextResponse.json(
      {
        message:
          "Invalid member API path",
      },
      { status: 400 },
    );
  }

  const encodedPath =
    path
      .map((segment) =>
        encodeURIComponent(
          segment,
        ),
      )
      .join("/");

  const target =
    `${API_URL}/${encodedPath}${request.nextUrl.search}`;

  const headers =
    new Headers();

  headers.set(
    "Authorization",
    `Bearer ${token}`,
  );

  headers.set(
    "Accept",
    request.headers.get(
      "accept",
    ) ||
      "application/json",
  );

  const contentType =
    request.headers.get(
      "content-type",
    );

  if (contentType) {
    headers.set(
      "Content-Type",
      contentType,
    );
  }

  const hasBody =
    request.method !== "GET" &&
    request.method !== "HEAD";

  let upstream: Response;

  try {
    upstream = await fetch(
      target,
      {
        method:
          request.method,
        headers,
        body: hasBody
          ? await request.arrayBuffer()
          : undefined,
        cache: "no-store",
        redirect: "manual",
      },
    );
  } catch {
    return NextResponse.json(
      {
        message:
          "Member API is temporarily unavailable",
      },
      { status: 502 },
    );
  }

  const responseHeaders =
    new Headers();

  for (
    const headerName of [
      "content-type",
      "content-disposition",
      "location",
    ]
  ) {
    const value =
      upstream.headers.get(
        headerName,
      );

    if (value) {
      responseHeaders.set(
        headerName,
        value,
      );
    }
  }

  responseHeaders.set(
    "Cache-Control",
    "no-store",
  );

  const response =
    new NextResponse(
      upstream.status === 204
        ? null
        : await upstream.arrayBuffer(),
      {
        status:
          upstream.status,
        headers:
          responseHeaders,
      },
    );

  if (
    upstream.status === 401
  ) {
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

export function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  },
) {
  return proxyRequest(
    request,
    context,
  );
}

export function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  },
) {
  return proxyRequest(
    request,
    context,
  );
}

export function PUT(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  },
) {
  return proxyRequest(
    request,
    context,
  );
}

export function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  },
) {
  return proxyRequest(
    request,
    context,
  );
}

export function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  },
) {
  return proxyRequest(
    request,
    context,
  );
}
