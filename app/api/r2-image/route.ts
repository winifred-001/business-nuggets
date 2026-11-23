import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validKey(key: string): boolean {
  return key.length > 0 && key.length <= 1024 && !key.startsWith('/') &&
    !/[\x00-\x1f\x7f\\]/.test(key) &&
    !key.split('/').some(part => !part || part === '.' || part === '..') &&
    /\.(?:jpe?g|png|webp|gif)$/i.test(key);
}

// Stable public cover URL. R2 tokens and the private bucket stay on the API.
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key') ?? '';
  if (!validKey(key)) return new Response('Invalid image key', { status: 400 });

  const backend = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  try {
    const upstream = await fetch(
      `${backend}/r2-images/cover?key=${encodeURIComponent(key)}`,
      { cache: 'no-store', signal: AbortSignal.timeout(20000) },
    );
    if (!upstream.ok || !upstream.body) {
      return new Response('Cover image unavailable', {
        status: upstream.status >= 400 ? upstream.status : 502,
      });
    }
    const type = upstream.headers.get('content-type') ?? '';
    if (!/^image\/(?:jpeg|png|webp|gif)$/.test(type)) {
      return new Response('Invalid image response', { status: 502 });
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Cover image unavailable', { status: 502 });
  }
}
