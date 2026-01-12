import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/localDb";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { authLimiter } from "@/lib/rateLimit";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "9router-default-secret-change-me"
);

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

    // Default password is '123456' if not set
    const storedHash = settings.password;

    let isValid = false;
    if (!storedHash) {
      isValid = password === "123456";
    } else {
      isValid = await bcrypt.compare(password, storedHash);
    }

    if (isValid) {
      const token = await new SignJWT({ authenticated: true })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("24h")
        .sign(SECRET);

      const cookieStore = await cookies();
      cookieStore.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
