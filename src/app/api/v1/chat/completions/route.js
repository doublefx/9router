import { callCloudWithMachineId } from "@/shared/utils/cloud.js";
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
    console.log("[SSE] Translators initialized");
  }
}

/**
 * Handle CORS preflight
 */
export const OPTIONS = createOptionsHandler("POST, OPTIONS");

export async function POST(request) {
  // Fallback to local handling
  await ensureInitialized();

  const response = await handleChat(request);
  return addCorsHeaders(response, request);
}

