// lib/middleware/planCheck.ts - Middleware for checking plan access and credits
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { getUserPlan, hasFeature, checkLimit, PlanConfig } from '@/lib/planManager';
import { checkCredits, consumeCredits, UsageEventType, CREDIT_COSTS } from '@/lib/creditSystem';

/**
 * Middleware result interface
 */
export interface PlanCheckResult {
  allowed: boolean;
  userId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Check if user is authenticated
 */
export async function requireAuth(req: NextRequest): Promise<PlanCheckResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        allowed: false,
        error: 'Authentication required',
        statusCode: 401,
      };
    }

    return {
      allowed: true,
      userId,
    };
  } catch (error) {
    logger.error('Auth check error:', error);
    return {
      allowed: false,
      error: 'Authentication failed',
      statusCode: 401,
    };
  }
}

/**
 * Check if user has sufficient credits for an operation
 */
export async function requireCredits(
  userId: string,
  creditsRequired: number
): Promise<PlanCheckResult> {
  try {
    const creditCheck = await checkCredits(userId, creditsRequired);

    if (!creditCheck.allowed) {
      return {
        allowed: false,
        userId,
        error: `Insufficient credits. Required: ${creditsRequired}, Available: ${creditCheck.remaining}`,
        statusCode: 402, // Payment Required
      };
    }

    return {
      allowed: true,
      userId,
    };
  } catch (error) {
    logger.error('Credit check error:', error);
    return {
      allowed: false,
      userId,
      error: 'Failed to check credits',
      statusCode: 500,
    };
  }
}

/**
 * Check if user has access to a feature
 */
export async function requireFeature(
  userId: string,
  feature: keyof PlanConfig['features']
): Promise<PlanCheckResult> {
  try {
    const hasAccess = await hasFeature(userId, feature);

    if (!hasAccess) {
      return {
        allowed: false,
        userId,
        error: `Feature '${feature}' not available on your plan. Please upgrade.`,
        statusCode: 403, // Forbidden
      };
    }

    return {
      allowed: true,
      userId,
    };
  } catch (error) {
    logger.error('Feature check error:', error);
    return {
      allowed: false,
      userId,
      error: 'Failed to check feature access',
      statusCode: 500,
    };
  }
}

/**
 * Check if user is within a resource limit
 */
export async function requireLimit(
  userId: string,
  limitType: keyof PlanConfig['limits'],
  currentCount: number
): Promise<PlanCheckResult> {
  try {
    const limitCheck = await checkLimit(userId, limitType, currentCount);

    if (!limitCheck.allowed) {
      return {
        allowed: false,
        userId,
        error: `${limitType} limit exceeded. Current: ${currentCount}, Limit: ${limitCheck.limit}. Please upgrade your plan.`,
        statusCode: 403, // Forbidden
      };
    }

    return {
      allowed: true,
      userId,
    };
  } catch (error) {
    logger.error('Limit check error:', error);
    return {
      allowed: false,
      userId,
      error: 'Failed to check resource limit',
      statusCode: 500,
    };
  }
}

/**
 * Helper to create error response from check result
 */
export function createErrorResponse(result: PlanCheckResult): NextResponse {
  return NextResponse.json(
    {
      error: result.error || 'Access denied',
      code: result.statusCode === 402 ? 'INSUFFICIENT_CREDITS' :
            result.statusCode === 403 ? 'FORBIDDEN' :
            result.statusCode === 401 ? 'UNAUTHORIZED' : 'ERROR',
    },
    { status: result.statusCode || 403 }
  );
}

/**
 * Combined middleware: Auth + Credits check for AI operations
 */
export async function requireAICredits(
  req: NextRequest,
  eventType: UsageEventType,
  creditsRequired: number
): Promise<{ allowed: boolean; userId?: string; response?: NextResponse }> {
  // Check auth
  const authCheck = await requireAuth(req);
  if (!authCheck.allowed) {
    return {
      allowed: false,
      response: createErrorResponse(authCheck),
    };
  }

  const userId = authCheck.userId!;

  // Check credits
  const creditCheck = await requireCredits(userId, creditsRequired);
  if (!creditCheck.allowed) {
    return {
      allowed: false,
      userId,
      response: createErrorResponse(creditCheck),
    };
  }

  return {
    allowed: true,
    userId,
  };
}

/**
 * Wrapper function for AI endpoints with automatic credit consumption
 */
export function withAICredits(
  handler: (req: NextRequest, userId: string) => Promise<Response>,
  eventType: UsageEventType,
  creditsRequired: number
) {
  return async (req: NextRequest): Promise<Response> => {
    const startTime = Date.now();

    // Check auth and credits
    const check = await requireAICredits(req, eventType, creditsRequired);
    if (!check.allowed) {
      return check.response!;
    }

    const userId = check.userId!;

    try {
      // Consume credits before operation
      const consumption = await consumeCredits(userId, eventType, creditsRequired, {
        endpoint: req.url,
      });

      if (!consumption.success) {
        return NextResponse.json(
          {
            error: consumption.error,
            code: 'CREDIT_CONSUMPTION_FAILED',
          },
          { status: 402 }
        );
      }

      // Execute handler
      const response = await handler(req, userId);

      // Add credit info to response headers
      response.headers.set('X-Credits-Used', creditsRequired.toString());
      response.headers.set('X-Credits-Remaining', consumption.remaining.toString());

      return response;
    } catch (error: any) {
      logger.error('AI operation error:', error);

      // Note: Credits already consumed, but we log the failure
      return NextResponse.json(
        {
          error: 'Operation failed',
          message: error.message,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Pre-flight check (doesn't consume credits, just checks)
 */
export async function checkAIAccess(
  req: NextRequest,
  creditsRequired: number
): Promise<{ allowed: boolean; userId?: string; remaining?: number; response?: NextResponse }> {
  // Check auth
  const authCheck = await requireAuth(req);
  if (!authCheck.allowed) {
    return {
      allowed: false,
      response: createErrorResponse(authCheck),
    };
  }

  const userId = authCheck.userId!;

  // Check credits (but don't consume)
  const creditCheck = await checkCredits(userId, creditsRequired);
  if (!creditCheck.allowed) {
    return {
      allowed: false,
      userId,
      remaining: creditCheck.remaining,
      response: NextResponse.json(
        {
          error: `Insufficient credits. Required: ${creditsRequired}, Available: ${creditCheck.remaining}`,
          code: 'INSUFFICIENT_CREDITS',
          details: {
            required: creditsRequired,
            available: creditCheck.remaining,
          },
        },
        { status: 402 }
      ),
    };
  }

  return {
    allowed: true,
    userId,
    remaining: creditCheck.remaining,
  };
}
