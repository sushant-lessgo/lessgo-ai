// lib/rateLimit.ts - Rate limiting middleware for API routes
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

// Rate limit configuration types
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => Promise<string>;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Rate limit store entry
interface RateLimitEntry {
  requests: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit presets for different endpoint types
export const RATE_LIMIT_PRESETS = {
  // AI generation endpoints - expensive operations
  AI_GENERATION: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  } as RateLimitConfig,
  
  // Form submissions - prevent spam
  FORM_SUBMISSION: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  } as RateLimitConfig,
  
  // Draft operations - frequent but less expensive
  DRAFT_OPERATIONS: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  } as RateLimitConfig,
  
  // Publishing - critical business operation
  PUBLISHING: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  } as RateLimitConfig,
  
  // General API endpoints
  GENERAL: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  } as RateLimitConfig,
};

// Default key generator - combines IP and user ID for better accuracy
const defaultKeyGenerator = async (req: NextRequest): Promise<string> => {
  try {
    const { userId } = await auth();
    const ip = getClientIP(req);
    
    // Use user ID if authenticated, fall back to IP
    return userId ? `user:${userId}` : `ip:${ip}`;
  } catch (error) {
    // If auth fails, use IP only
    const ip = getClientIP(req);
    return `ip:${ip}`;
  }
};

// Extract client IP from request
const getClientIP = (req: NextRequest): string => {
  return (
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    req.ip ||
    'unknown'
  );
};

// Clean expired entries from store
const cleanExpiredEntries = (): void => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

// Main rate limiting function
export const rateLimit = async (
  req: NextRequest,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number; error?: string }> => {
  try {
    // Clean expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean on each request
      cleanExpiredEntries();
    }
    
    const keyGenerator = config.keyGenerator || defaultKeyGenerator;
    const key = await keyGenerator(req);
    const now = Date.now();
    const resetTime = now + config.windowMs;
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        requests: 0,
        resetTime,
      };
      rateLimitStore.set(key, entry);
    }
    
    // Check if limit exceeded
    if (entry.requests >= config.maxRequests) {
      logger.warn(`Rate limit exceeded for key: ${key}`, {
        requests: entry.requests,
        limit: config.maxRequests,
        resetTime: entry.resetTime,
      });
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        error: 'Rate limit exceeded',
      };
    }
    
    // Increment request count
    entry.requests++;
    rateLimitStore.set(key, entry);
    
    const remaining = config.maxRequests - entry.requests;
    
    // Log for debugging in development
    if (process.env.NODE_ENV !== 'production') {
      logger.dev(`Rate limit check - Key: ${key}, Requests: ${entry.requests}/${config.maxRequests}, Remaining: ${remaining}`);
    }
    
    return {
      allowed: true,
      remaining,
      resetTime: entry.resetTime,
    };
  } catch (error) {
    logger.error('Rate limiting error:', error);
    
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
      error: 'Rate limiting service unavailable',
    };
  }
};

// Helper function to create rate-limited handler
export const withRateLimit = (
  handler: (req: NextRequest) => Promise<Response>,
  config: RateLimitConfig
) => {
  return async (req: NextRequest): Promise<Response> => {
    const rateLimitResult = await rateLimit(req, config);
    
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }
    
    // Add rate limit headers to successful responses
    const response = await handler(req);
    
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    return response;
  };
};

// Specialized rate limiters for different endpoint types
export const withAIRateLimit = (handler: (req: NextRequest) => Promise<Response>) =>
  withRateLimit(handler, RATE_LIMIT_PRESETS.AI_GENERATION);

export const withFormRateLimit = (handler: (req: NextRequest) => Promise<Response>) =>
  withRateLimit(handler, RATE_LIMIT_PRESETS.FORM_SUBMISSION);

export const withDraftRateLimit = (handler: (req: NextRequest) => Promise<Response>) =>
  withRateLimit(handler, RATE_LIMIT_PRESETS.DRAFT_OPERATIONS);

export const withPublishRateLimit = (handler: (req: NextRequest) => Promise<Response>) =>
  withRateLimit(handler, RATE_LIMIT_PRESETS.PUBLISHING);

export const withGeneralRateLimit = (handler: (req: NextRequest) => Promise<Response>) =>
  withRateLimit(handler, RATE_LIMIT_PRESETS.GENERAL);

// Rate limit status checker (for debugging/monitoring)
export const getRateLimitStatus = async (req: NextRequest, config: RateLimitConfig) => {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const key = await keyGenerator(req);
  const entry = rateLimitStore.get(key);
  
  if (!entry || Date.now() > entry.resetTime) {
    return {
      requests: 0,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    };
  }
  
  return {
    requests: entry.requests,
    remaining: config.maxRequests - entry.requests,
    resetTime: entry.resetTime,
  };
};

// Clear rate limit for a key (useful for testing or admin operations)
export const clearRateLimit = async (req: NextRequest, config: RateLimitConfig) => {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const key = await keyGenerator(req);
  rateLimitStore.delete(key);
};

// Get current store size (for monitoring)
export const getStoreSizeStats = () => {
  return {
    totalEntries: rateLimitStore.size,
    storeKeys: Array.from(rateLimitStore.keys()),
  };
};