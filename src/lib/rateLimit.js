/**
 * Rate limiting utility using LRU cache
 * Implements sliding window rate limiting
 */

import { LRUCache } from 'lru-cache';

/**
 * Create a rate limiter
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Error message
 * @returns {Function} Rate limit middleware
 */
export function createRateLimiter({ windowMs, max, message }) {
  // Create LRU cache for this limiter
  const cache = new LRUCache({
    max: 10000, // Max number of IPs to track
    ttl: windowMs,
  });

  return function rateLimit(request) {
    // Get client identifier (IP + API key)
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const apiKey = request.headers.get('x-api-key') ||
                   request.headers.get('authorization') || '';

    const key = `${ip}:${apiKey}`;

    // Get current count
    const now = Date.now();
    const record = cache.get(key) || { count: 0, resetTime: now + windowMs };

    // Reset if window expired
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    // Increment count
    record.count++;
    cache.set(key, record);

    // Check if limit exceeded
    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return {
        limited: true,
        retryAfter,
        message: message || 'Too many requests, please try again later'
      };
    }

    return {
      limited: false,
      remaining: max - record.count,
      resetTime: record.resetTime
    };
  };
}

// Predefined limiters for different endpoint types
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again later'
});

export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'API rate limit exceeded, please slow down'
});

export const strictLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Rate limit exceeded for this endpoint'
});
