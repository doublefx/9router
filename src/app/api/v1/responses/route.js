import { handleChat } from "@/sse/handlers/chat.js";
import { initTranslators } from "open-sse/translator/index.js";
import { createOptionsHandler, addCorsHeaders } from "@/lib/cors";

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initTranslators();
    initialized = true;
    console.log("[SSE] Translators initialized for /v1/responses");
  }
}

export const OPTIONS = createOptionsHandler("POST, OPTIONS");

/**
 * POST /v1/responses - OpenAI Responses API format
 * Now handled by translator pattern (openai-responses format auto-detected)
 */
export async function POST(request) {
  await ensureInitialized();
  const response = await handleChat(request);
  return addCorsHeaders(response, request);
}
