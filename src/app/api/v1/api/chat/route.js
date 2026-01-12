import { handleChat } from "@/sse/handlers/chat.js";
import { initTranslators } from "open-sse/translator/index.js";
import { transformToOllama } from "open-sse/utils/ollamaTransform.js";
import { createOptionsHandler, addCorsHeaders } from "@/lib/cors";
import { apiLimiter } from "@/lib/rateLimit";
import { NextResponse } from "next/server";

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initTranslators();
    initialized = true;
    console.log("[SSE] Translators initialized");
  }
}

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

  await ensureInitialized();

  const clonedReq = request.clone();
  let modelName = "llama3.2";
  try {
    const body = await clonedReq.json();
    modelName = body.model || "llama3.2";
  } catch {}

  const response = await handleChat(request);
  const transformedResponse = await transformToOllama(response, modelName);

  // Add rate limit info to successful responses
  transformedResponse.headers.set('X-RateLimit-Limit', '100');
  transformedResponse.headers.set('X-RateLimit-Remaining', rateCheck.remaining.toString());

  return addCorsHeaders(transformedResponse, request);
}
