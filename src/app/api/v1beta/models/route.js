import { PROVIDER_MODELS } from "@/shared/constants/models";
import { createOptionsHandler, addCorsHeaders } from "@/lib/cors";

/**
 * Handle CORS preflight
 */
export const OPTIONS = createOptionsHandler("GET, OPTIONS");

/**
 * GET /v1beta/models - Gemini compatible models list
 * Returns models in Gemini API format
 */
export async function GET(request) {
  try {
    // Collect all models from all providers
    const models = [];

    for (const [provider, providerModels] of Object.entries(PROVIDER_MODELS)) {
      for (const model of providerModels) {
        models.push({
          name: `models/${provider}/${model.id}`,
          displayName: model.name || model.id,
          description: `${provider} model: ${model.name || model.id}`,
          supportedGenerationMethods: ["generateContent"],
          inputTokenLimit: 128000,
          outputTokenLimit: 8192,
        });
      }
    }

    const response = Response.json({ models });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.log("Error fetching models:", error);
    const errorResponse = Response.json({ error: { message: error.message } }, { status: 500 });
    return addCorsHeaders(errorResponse, request);
  }
}

