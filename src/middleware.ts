import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuth = !!req.auth;
  const pathname = req.nextUrl.pathname;

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboard =
    pathname.startsWith("/dashboard") || pathname.startsWith("/wishlist");

  if (isAuthRoute && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuth ? "/dashboard" : "/login", req.nextUrl)
    );
  }

  if (isDashboard && !isAuth) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|w/).*)",
  ],
};
