import { handleChat } from "@/sse/handlers/chat.js";
import { initTranslators } from "open-sse/translator/index.js";
import { createOptionsHandler, addCorsHeaders } from "@/lib/cors";

let initialized = false;

/**
 * Initialize translators once
 */
async function ensureInitialized() {
  if (!initialized) {
    await initTranslators();
    initialized = true;
    console.log("[SSE] Translators initialized for /v1/messages");
  }
}

/**
 * Handle CORS preflight
 */
export const OPTIONS = createOptionsHandler("POST, OPTIONS");

/**
 * POST /v1/messages - Claude format (auto convert via handleChat)
 */
export async function POST(request) {
  await ensureInitialized();
  const response = await handleChat(request);
  return addCorsHeaders(response, request);
}

