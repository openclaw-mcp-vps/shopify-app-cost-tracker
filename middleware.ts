import { NextRequest, NextResponse } from "next/server";

const PAID_COOKIE = "ct_paid";

export function middleware(request: NextRequest) {
  const paid = request.cookies.get(PAID_COOKIE)?.value === "1";

  if (!paid) {
    const url = new URL("/", request.url);
    url.searchParams.set("paywall", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/stores/:path*", "/apps/:path*"]
};
