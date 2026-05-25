export const dynamic = "force-dynamic";
export const revalidate = 0;

const headers = {
  "Content-Type": "text/plain; charset=utf-8",
  "X-Robots-Tag": "noindex, nofollow",
  "Cache-Control": "public, max-age=0, s-maxage=3600",
};

export function GET() {
  return new Response("This offer page has been retired.", {
    status: 410,
    headers,
  });
}

export function HEAD() {
  return new Response(null, {
    status: 410,
    headers,
  });
}
