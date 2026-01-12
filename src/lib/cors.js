/**
 * CORS utility for 9router API
 * Restricts cross-origin requests to whitelisted origins
 */

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.ALLOWED_ORIGIN,
  process.env.PRODUCTION_ORIGIN
].filter(Boolean);

/**
 * Get CORS headers for a request
 * @param {Request} request - The incoming request
 * @param {string} methods - Allowed HTTP methods
 * @returns {Object} CORS headers object
 */
export function getCorsHeaders(request, methods = "GET, POST, OPTIONS") {
  const origin = request.headers.get("origin");

  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.some(allowed => {
    if (allowed === origin) return true;
    // Support wildcard subdomains like "*.9router.com"
    if (allowed?.includes("*")) {
      const pattern = allowed.replace("*", ".*");
      return new RegExp(`^${pattern}$`).test(origin);
    }
    return false;
  });

  const headers = {
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
  };

  // Only set CORS origin if allowed
  if (isAllowed) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

/**
 * Create OPTIONS handler with CORS
 * @param {string} methods - Allowed HTTP methods
 * @returns {Function} OPTIONS request handler
 */
export function createOptionsHandler(methods = "GET, POST, OPTIONS") {
  return function OPTIONS(request) {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request, methods)
    });
  };
}

/**
 * Add CORS headers to response
 * @param {Response} response - The response object
 * @param {Request} request - The request object
 * @returns {Response} Response with CORS headers
 */
export function addCorsHeaders(response, request) {
  const corsHeaders = getCorsHeaders(request);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
