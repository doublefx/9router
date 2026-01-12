import { callCloudWithMachineId } from "@/shared/utils/cloud.js";
import { handleChat } from "@/sse/handlers/chat.js";
import { initTranslators } from "open-sse/translator/index.js";
import { createOptionsHandler, addCorsHeaders } from "@/lib/cors";
import { apiLimiter } from "@/lib/rateLimit";
import { NextResponse } from "next/server";

let initialized = false;

/**
 * Initialize translators once
 */
async function ensureInitialized() {
  if (!initialized) {
    await initTranslators();
    initialized = true;
    console.log("[SSE] Translators initialized");
  }
}

/**
 * Handle CORS preflight
 */
export const OPTIONS = createOptionsHandler("POST, OPTIONS");

export async function POST(request) {
  // Apply rate limiting
  const rateCheck = apiLimiter(request);
  if (rateCheck.limited) {
    return NextResponse.json(
      { error: rateCheck.message },
      {
        status: 429,
        headers: {
          'Retry-After': rateCheck.retryAfter.toString(),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0'
        }
      }
    );
  }

  // Fallback to local handling
  await ensureInitialized();

  const response = await handleChat(request);

  // Add rate limit info to successful responses
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', rateCheck.remaining.toString());

  return addCorsHeaders(response, request);
}
