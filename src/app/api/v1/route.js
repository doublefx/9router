import { createOptionsHandler, addCorsHeaders } from "@/lib/cors";

/**
 * Handle CORS preflight
 */
export const OPTIONS = createOptionsHandler("GET, OPTIONS");

/**
 * GET /v1 - Return models list (OpenAI compatible)
 */
export async function GET(request) {
  const models = [
    { id: "claude-sonnet-4-20250514", object: "model", owned_by: "anthropic" },
    { id: "claude-3-5-sonnet-20241022", object: "model", owned_by: "anthropic" },
    { id: "gpt-4o", object: "model", owned_by: "openai" },
    { id: "gemini-2.5-pro", object: "model", owned_by: "google" }
  ];

  const response = new Response(JSON.stringify({
    object: "list",
    data: models
  }), {
    headers: { "Content-Type": "application/json" }
  });

  return addCorsHeaders(response, request);
}

