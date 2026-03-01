import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuth = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/wishlist");

  if (isAuthRoute && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL(isAuth ? "/dashboard" : "/login", req.nextUrl));
  }

  if (isDashboard && !isAuth) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|w/).*)"],
};
