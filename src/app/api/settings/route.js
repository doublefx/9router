import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/localDb";
import bcrypt from "bcryptjs";
import { strictLimiter } from "@/lib/rateLimit";

export async function GET(request) {
  // Apply rate limiting
  const rateCheck = strictLimiter(request);
  if (rateCheck.limited) {
    return NextResponse.json(
      { error: rateCheck.message },
      {
        status: 429,
        headers: {
          'Retry-After': rateCheck.retryAfter.toString(),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0'
        }
      }
    );
  }

  try {
    const settings = await getSettings();
    // Don't return the password hash to the client
    const { password, ...safeSettings } = settings;
    return NextResponse.json(safeSettings);
  } catch (error) {
    console.log("Error getting settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  // Apply rate limiting
  const rateCheck = strictLimiter(request);
  if (rateCheck.limited) {
    return NextResponse.json(
      { error: rateCheck.message },
      {
        status: 429,
        headers: {
          'Retry-After': rateCheck.retryAfter.toString(),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0'
        }
      }
    );
  }

  try {
    const body = await request.json();

    // If updating password, hash it
    if (body.newPassword) {
      const settings = await getSettings();
      const currentHash = settings.password;

      // Verify current password if it exists
      if (currentHash) {
        if (!body.currentPassword) {
          return NextResponse.json({ error: "Current password required" }, { status: 400 });
        }
        const isValid = await bcrypt.compare(body.currentPassword, currentHash);
        if (!isValid) {
          return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
        }
      } else {
        // No password configured yet - this should go through setup wizard, not settings
        return NextResponse.json(
          {
            error: "No password configured. Use setup wizard to set initial password.",
            requiresSetup: true
          },
          { status: 401 }
        );
      }

      const salt = await bcrypt.genSalt(10);
      body.password = await bcrypt.hash(body.newPassword, salt);
      delete body.newPassword;
      delete body.currentPassword;
    }

    const settings = await updateSettings(body);
    const { password, ...safeSettings } = settings;
    return NextResponse.json(safeSettings);
  } catch (error) {
    console.log("Error updating settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
