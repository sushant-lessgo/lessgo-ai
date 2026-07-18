// lib/rateLimit.ts - Rate limiting middleware for API routes
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { getUserPlan, PlanTier } from './planManager';

// Rate limit configuration types
export interface RateLimitConfig {
  /**
   * Bucket namespace. REQUIRED and must be unique per preset: it is prefixed
   * onto the generated key so each preset counts into its OWN tally.
   *
   * Without this, every preset shares one `user:{id}` counter but compares it
   * against its own `maxRequests` — so cheap-but-frequent traffic (autosaves,
   * 30/min) silently exhausts an expensive preset's smaller budget (AI) and
   * generation 429s on requests it never made. That is a real incident, not a
   * hypothetical: it broke a customer's multi-page generation in production.
   */
  name: string;
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => Promise<string>;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  tierBased?: boolean; // Enable tier-based rate limiting
}

// Rate limit store entry
interface RateLimitEntry {
  requests: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit presets for different endpoint types.
//
// `satisfies RateLimitConfig`, NOT `as RateLimitConfig`. This is load-bearing:
// a type ASSERTION (`as`) does not enforce required props, so a future preset
// that omits `name` would compile clean and key into `undefined:user:{id}` —
// i.e. share ONE counter with every other name-less preset while comparing it
// against its own `maxRequests`. That is exactly the incident documented on
// `RateLimitConfig.name` above, silently returned. `satisfies` makes it a
// compile error at the declaration while preserving each preset's literal type.
// Do not switch these back to `as`.
export const RATE_LIMIT_PRESETS = {
  // AI generation endpoints - expensive operations (tier-based)
  AI_GENERATION: {
    name: 'ai',
    maxRequests: 15, // Default for FREE tier; tierBased overrides per TIER_RATE_LIMITS
    windowMs: 60 * 1000, // 1 minute
    tierBased: true,
  } satisfies RateLimitConfig,

  // Form submissions - prevent spam
  FORM_SUBMISSION: {
    name: 'form',
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  } satisfies RateLimitConfig,

  // Draft operations - frequent but less expensive
  DRAFT_OPERATIONS: {
    name: 'draft',
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  } satisfies RateLimitConfig,

  // Publishing - critical business operation
  PUBLISHING: {
    name: 'publish',
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  } satisfies RateLimitConfig,

  // General API endpoints
  GENERAL: {
    name: 'general',
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  } satisfies RateLimitConfig,

  // Domain verification (per-domain, used by /api/domains/verify-*)
  DOMAIN_VERIFY: {
    name: 'domain',
    maxRequests: 1,
    windowMs: 10 * 1000, // 10 seconds
  } satisfies RateLimitConfig,
};

/**
 * Per-domain rate limit check. Uses the same in-memory store with a
 * `domain:{name}` key — separate from per-user/IP limits.
 * Returns allowed + retryAfter (seconds) for the caller to surface in 429.
 */
export const checkDomainRateLimit = (
  domain: string,
  config: RateLimitConfig = RATE_LIMIT_PRESETS.DOMAIN_VERIFY
): { allowed: boolean; retryAfter: number; resetTime: number } => {
  const key = `domain:${domain.toLowerCase()}`;
  const now = Date.now();
  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetTime) {
    entry = { requests: 0, resetTime: now + config.windowMs };
    rateLimitStore.set(key, entry);
  }
  if (entry.requests >= config.maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      resetTime: entry.resetTime,
    };
  }
  entry.requests++;
  rateLimitStore.set(key, entry);
  return { allowed: true, retryAfter: 0, resetTime: entry.resetTime };
};

// Tier-based rate limit multipliers.
//
// These are the LIVE values (`PLAN_CONFIGS[tier].rateLimit` in planManager.ts is
// dead config — nothing reads it).
//
// Sized against the FAN-OUT, not against single requests: ONE click of "generate"
// is N+1 AI requests, because multi-page generation loops per page (1 strategy +
// 1 generate-copy per sitemap page, up to ~7 for a 6-page site). The old FREE
// ceiling of 5 sat BELOW that cost, so a legitimate generation could exhaust its
// own budget mid-run; it only stayed under by accident, because LLM latency
// (~50s/page) happened to spread the calls across windows. Any speedup would
// have broken it. Tiers must keep ascending — a FREE ceiling above PRO's would
// invert the plans.
//
// This is burst protection only. Actual cost is gated by credits
// (`checkCredits()` / creditSystem.ts), which these numbers do not affect.
const TIER_RATE_LIMITS: Record<PlanTier, { maxRequests: number; windowMs: number }> = {
  [PlanTier.FREE]: {
    maxRequests: 15,
    windowMs: 60 * 1000,
  },
  [PlanTier.PRO]: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
  [PlanTier.AGENCY]: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },
  [PlanTier.ENTERPRISE]: {
    maxRequests: 150,
    windowMs: 60 * 1000,
  },
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

/**
 * Namespace an identity key into its preset's bucket, so each preset counts
 * into its own tally instead of a shared per-user one. MUST wrap every
 * `keyGenerator` result — an un-namespaced key silently rejoins the shared
 * bucket and reintroduces the cross-preset starvation this prevents.
 */
const buildKey = (config: RateLimitConfig, identity: string): string =>
  `${config.name}:${identity}`;

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
): Promise<{
  allowed: boolean;
  remaining: number;
  /** Tier-effective limit actually applied — may exceed `config.maxRequests` when `tierBased`. */
  limit: number;
  resetTime: number;
  error?: string;
}> => {
  try {
    // Clean expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean on each request
      cleanExpiredEntries();
    }

    // Apply tier-based limits if enabled
    let effectiveConfig = { ...config };
    if (config.tierBased) {
      try {
        const { userId } = await auth();
        if (userId) {
          const userPlan = await getUserPlan(userId);
          const tierLimits = TIER_RATE_LIMITS[userPlan.tier as PlanTier] || TIER_RATE_LIMITS[PlanTier.FREE];
          effectiveConfig.maxRequests = tierLimits.maxRequests;
          effectiveConfig.windowMs = tierLimits.windowMs;
        }
      } catch (error) {
        // If can't get user plan, use default limits
        logger.warn('Could not apply tier-based rate limit, using defaults:', error);
      }
    }

    const keyGenerator = effectiveConfig.keyGenerator || defaultKeyGenerator;
    const key = buildKey(effectiveConfig, await keyGenerator(req));
    const now = Date.now();
    const resetTime = now + effectiveConfig.windowMs;

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
    if (entry.requests >= effectiveConfig.maxRequests) {
      // logger.error, NOT logger.warn: production runs at ERROR level
      // (logger.ts `getCurrentLevel`), so a warn here is discarded and the
      // rejection reaches neither Vercel nor Sentry. That blind spot meant a
      // customer-facing generation failure had to be reconstructed by hand from
      // raw HTTP status codes. This is the only line naming key/count/limit —
      // it must survive. Accepted tradeoff: sustained abuse of a limited route
      // now produces Sentry events.
      logger.error(`Rate limit exceeded for key: ${key}`, {
        requests: entry.requests,
        limit: effectiveConfig.maxRequests,
        resetTime: entry.resetTime,
      });

      return {
        allowed: false,
        remaining: 0,
        limit: effectiveConfig.maxRequests,
        resetTime: entry.resetTime,
        error: 'Rate limit exceeded',
      };
    }

    // Increment request count
    entry.requests++;
    rateLimitStore.set(key, entry);

    const remaining = effectiveConfig.maxRequests - entry.requests;

    // Log for debugging in development
    if (process.env.NODE_ENV !== 'production') {
      logger.dev(`Rate limit check - Key: ${key}, Requests: ${entry.requests}/${effectiveConfig.maxRequests}, Remaining: ${remaining}`);
    }

    return {
      allowed: true,
      remaining,
      limit: effectiveConfig.maxRequests,
      resetTime: entry.resetTime,
    };
  } catch (error) {
    logger.error('Rate limiting error:', error);

    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: config.maxRequests,
      limit: config.maxRequests,
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
            // rateLimitResult.limit, not config.maxRequests: on a tierBased
            // preset the latter is the FREE default and would understate what a
            // paying tier actually gets.
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(req);

    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
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
  const key = buildKey(config, await keyGenerator(req));
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
  const key = buildKey(config, await keyGenerator(req));
  rateLimitStore.delete(key);
};

// Get current store size (for monitoring)
export const getStoreSizeStats = () => {
  return {
    totalEntries: rateLimitStore.size,
    storeKeys: Array.from(rateLimitStore.keys()),
  };
};