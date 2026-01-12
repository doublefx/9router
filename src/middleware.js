import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Validate JWT_SECRET environment variable
if (!process.env.JWT_SECRET) {
  throw new Error(
    "FATAL: JWT_SECRET environment variable is required.\n" +
    "Generate a strong secret with: openssl rand -base64 32\n" +
    "Then add to .env: JWT_SECRET=<generated_secret>"
  );
}

// Validate secret strength (minimum 32 characters)
if (process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "FATAL: JWT_SECRET must be at least 32 characters long.\n" +
    "Generate a strong secret with: openssl rand -base64 32"
  );
}

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Warn if HTTPS not configured in production
if (process.env.NODE_ENV === 'production' && !process.env.HTTPS_ENABLED) {
  console.warn('⚠️  WARNING: HTTPS should be enabled in production');
  console.warn('   Secure cookies will not work over HTTP');
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect all dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      await jwtVerify(token, SECRET);
      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect / to /dashboard if logged in, or /dashboard if it's the root
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
