import { createOptionsHandler, addCorsHeaders } from "@/lib/cors";

/**
 * Handle CORS preflight
 */
export const OPTIONS = createOptionsHandler("POST, OPTIONS");

/**
 * POST /v1/messages/count_tokens - Mock token count response
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    const errorResponse = new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
    return addCorsHeaders(errorResponse, request);
  }

  // Estimate token count based on content length
  const messages = body.messages || [];
  let totalChars = 0;
  for (const msg of messages) {
    if (typeof msg.content === "string") {
      totalChars += msg.content.length;
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "text" && part.text) {
          totalChars += part.text.length;
        }
      }
    }
  }

  // Rough estimate: ~4 chars per token
  const inputTokens = Math.ceil(totalChars / 4);

  const response = new Response(JSON.stringify({
    input_tokens: inputTokens
  }), {
    headers: { "Content-Type": "application/json" }
  });

  return addCorsHeaders(response, request);
}

