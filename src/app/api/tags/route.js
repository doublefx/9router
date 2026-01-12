import { ollamaModels } from "open-sse/config/ollamaModels.js";
import { createOptionsHandler, addCorsHeaders } from "@/lib/cors";

export const OPTIONS = createOptionsHandler("GET, OPTIONS");

export async function GET(request) {
  const response = new Response(JSON.stringify(ollamaModels), {
    headers: { "Content-Type": "application/json" }
  });
  return addCorsHeaders(response, request);
}

