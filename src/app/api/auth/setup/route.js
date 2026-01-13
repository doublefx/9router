import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/localDb";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/setup
 * First-time setup endpoint to configure initial password.
 * Can only be used when no password is configured.
 */
export async function POST(request) {
  try {
    const { password } = await request.json();
    const settings = await getSettings();

    // Check if password is already configured
    if (settings.password) {
      return NextResponse.json(
        { error: "Password already configured. Use settings to change it." },
        { status: 400 }
      );
    }

    // Validate password presence
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check for strong password (uppercase, lowercase, number)
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return NextResponse.json(
        {
          error: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        },
        { status: 400 }
      );
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store hashed password
    await updateSettings({ password: hashedPassword });

    return NextResponse.json({
      success: true,
      message: "Password configured successfully. You can now login."
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to configure password" },
      { status: 500 }
    );
  }
}
