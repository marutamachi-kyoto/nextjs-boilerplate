import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/api/free-poikatsu" &&
    request.nextUrl.searchParams.get("v") !== "2"
  ) {
    const url = request.nextUrl.clone();
    url.searchParams.set("v", "2");
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/free-poikatsu",
};
