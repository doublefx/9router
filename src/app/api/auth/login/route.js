import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/localDb";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { authLimiter } from "@/lib/rateLimit";

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

export async function POST(request) {
  // Apply rate limiting
  const rateCheck = authLimiter(request);
  if (rateCheck.limited) {
    return NextResponse.json(
      { error: rateCheck.message },
      {
        status: 429,
        headers: {
          'Retry-After': rateCheck.retryAfter.toString(),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateCheck.resetTime).toISOString()
        }
      }
    );
  }

  try {
    const { password } = await request.json();
    const settings = await getSettings();

    const storedHash = settings.password;

    // Reject login if no password has been configured yet
    if (!storedHash) {
      return NextResponse.json(
        {
          error: "No password configured. Please run the setup wizard first.",
          requiresSetup: true
        },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    const isValid = await bcrypt.compare(password, storedHash);

    if (isValid) {
      const token = await new SignJWT({ authenticated: true })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("24h")
        .sign(SECRET);

      const cookieStore = await cookies();
      cookieStore.set("auth_token", token, {
        httpOnly: true,
        secure: true,  // Always use secure flag
        sameSite: "strict",  // Stricter CSRF protection
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      // Log warning if not using HTTPS in production
      if (!request.url.startsWith('https://') && process.env.NODE_ENV === 'production') {
        console.warn('⚠️  WARNING: Authentication over HTTP detected in production!');
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
