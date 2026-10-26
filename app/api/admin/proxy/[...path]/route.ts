import {
  createHmac,
} from "crypto";
import {
  cookies,
} from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { API_URL } from "@/lib/api";
import {
  ADMIN_SESSION_COOKIE,
} from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mutatingMethods =
  new Set([
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ]);

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

function clientIp(
  request: NextRequest,
) {
  return (
    request.headers.get(
      "x-vercel-forwarded-for",
    ) ||
    request.headers.get(
      "x-forwarded-for",
    ) ||
    request.headers.get(
      "x-real-ip",
    ) ||
    ""
  )
    .split(",")[0]
    .trim();
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
      {
        status: 403,
      },
    );
  }

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      ADMIN_SESSION_COOKIE,
    )?.value;

  if (!token) {
    return NextResponse.json(
      {
        message:
          "Admin session required",
      },
      {
        status: 401,
      },
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
    )
  ) {
    return NextResponse.json(
      {
        message:
          "Invalid admin API path",
      },
      {
        status: 400,
      },
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
    `${API_URL}/admin/${encodedPath}${request.nextUrl.search}`;

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

  const ip =
    clientIp(request);

  const proxySecret =
    process.env.ADMIN_PROXY_SECRET;

  if (
    ip &&
    proxySecret
  ) {
    headers.set(
      "x-bn-client-ip",
      ip,
    );

    headers.set(
      "x-bn-client-ip-signature",
      createHmac(
        "sha256",
        proxySecret,
      )
        .update(ip)
        .digest("hex"),
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
          "Admin API is temporarily unavailable",
      },
      {
        status: 502,
      },
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
