import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/localDb";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

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
