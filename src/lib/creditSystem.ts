// lib/creditSystem.ts - Credit-based quota system for AI operations
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getUserPlan } from './planManager';

// Credit costs for different operations
export const CREDIT_COSTS = {
  FULL_PAGE_GENERATION: 10,
  SECTION_REGENERATION: 2,
  ELEMENT_REGENERATION: 1,
  FIELD_INFERENCE: 1,
  FIELD_VALIDATION: 0, // Free operation
} as const;

// Event types for usage tracking
export enum UsageEventType {
  PAGE_GENERATION = 'page_generation',
  SECTION_REGEN = 'section_regen',
  ELEMENT_REGEN = 'element_regen',
  FIELD_INFERENCE = 'field_inference',
}

// Usage event interface
export interface UsageEventData {
  userId: string;
  eventType: UsageEventType;
  creditsUsed: number;
  tokensUsed?: number;
  estimatedCost?: number;
  projectId?: string;
  sectionId?: string;
  elementKey?: string;
  metadata?: any;
  endpoint?: string;
  duration?: number;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Get current period string (YYYY-MM)
 */
function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get or create user usage record for current period
 */
export async function getUserUsage(userId: string) {
  try {
    const period = getCurrentPeriod();

    let usage = await prisma.userUsage.findUnique({
      where: {
        userId_period: {
          userId,
          period,
        },
      },
    });

    // Create new usage record if doesn't exist
    if (!usage) {
      const userPlan = await getUserPlan(userId);

      usage = await prisma.userUsage.create({
        data: {
          userId,
          period,
          creditsLimit: userPlan.creditsLimit,
          creditsRemaining: userPlan.creditsLimit,
          creditsUsed: 0,
        },
      });

      logger.info(`Created new usage record for user ${userId} for period ${period}`);
    }

    return usage;
  } catch (error) {
    logger.error('Error getting user usage:', error);
    throw error;
  }
}

/**
 * Check if user has sufficient credits
 */
export async function checkCredits(
  userId: string,
  creditsRequired: number
): Promise<{ allowed: boolean; remaining: number; required: number }> {
  try {
    const usage = await getUserUsage(userId);
    const allowed = usage.creditsRemaining >= creditsRequired;

    return {
      allowed,
      remaining: usage.creditsRemaining,
      required: creditsRequired,
    };
  } catch (error) {
    logger.error('Error checking credits:', error);
    return { allowed: false, remaining: 0, required: creditsRequired };
  }
}

/**
 * Deduct credits from user's balance (with transaction)
 */
export async function deductCredits(
  userId: string,
  creditsToDeduct: number,
  eventType: UsageEventType
): Promise<{ success: boolean; remaining: number; error?: string }> {
  try {
    const period = getCurrentPeriod();

    // Use transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Lock the usage record for update
      const usage = await tx.userUsage.findUnique({
        where: {
          userId_period: {
            userId,
            period,
          },
        },
      });

      if (!usage) {
        throw new Error('Usage record not found');
      }

      // Check if sufficient credits
      if (usage.creditsRemaining < creditsToDeduct) {
        throw new Error('Insufficient credits');
      }

      // Update usage counters based on event type
      const updateData: any = {
        creditsUsed: usage.creditsUsed + creditsToDeduct,
        creditsRemaining: usage.creditsRemaining - creditsToDeduct,
      };

      switch (eventType) {
        case UsageEventType.PAGE_GENERATION:
          updateData.fullPageGens = usage.fullPageGens + 1;
          break;
        case UsageEventType.SECTION_REGEN:
          updateData.sectionRegens = usage.sectionRegens + 1;
          break;
        case UsageEventType.ELEMENT_REGEN:
          updateData.elementRegens = usage.elementRegens + 1;
          break;
        case UsageEventType.FIELD_INFERENCE:
          updateData.fieldInference = usage.fieldInference + 1;
          break;
      }

      // Update usage record
      const updatedUsage = await tx.userUsage.update({
        where: {
          userId_period: {
            userId,
            period,
          },
        },
        data: updateData,
      });

      return updatedUsage;
    });

    logger.dev(`Deducted ${creditsToDeduct} credits from user ${userId}. Remaining: ${result.creditsRemaining}`);

    return {
      success: true,
      remaining: result.creditsRemaining,
    };
  } catch (error: any) {
    logger.error('Error deducting credits:', error);
    return {
      success: false,
      remaining: 0,
      error: error.message || 'Failed to deduct credits',
    };
  }
}

/**
 * Log usage event
 */
export async function logUsageEvent(eventData: UsageEventData): Promise<void> {
  try {
    await prisma.usageEvent.create({
      data: {
        userId: eventData.userId,
        eventType: eventData.eventType,
        creditsUsed: eventData.creditsUsed,
        tokensUsed: eventData.tokensUsed,
        estimatedCost: eventData.estimatedCost,
        projectId: eventData.projectId,
        sectionId: eventData.sectionId,
        elementKey: eventData.elementKey,
        metadata: eventData.metadata,
        endpoint: eventData.endpoint,
        duration: eventData.duration,
        success: eventData.success ?? true,
        errorMessage: eventData.errorMessage,
      },
    });

    logger.dev(`Logged usage event: ${eventData.eventType} for user ${eventData.userId}`);
  } catch (error) {
    // Don't throw - logging failure shouldn't break the operation
    logger.error('Error logging usage event:', error);
  }
}

/**
 * Combined operation: check credits, deduct if allowed, and log event
 */
export async function consumeCredits(
  userId: string,
  eventType: UsageEventType,
  creditsRequired: number,
  eventData?: Partial<UsageEventData>
): Promise<{ success: boolean; remaining: number; error?: string }> {
  const startTime = Date.now();

  try {
    // Check credits
    const check = await checkCredits(userId, creditsRequired);
    if (!check.allowed) {
      // Log failed attempt
      await logUsageEvent({
        userId,
        eventType,
        creditsUsed: 0,
        success: false,
        errorMessage: 'Insufficient credits',
        duration: Date.now() - startTime,
        ...eventData,
      });

      return {
        success: false,
        remaining: check.remaining,
        error: `Insufficient credits. Required: ${creditsRequired}, Available: ${check.remaining}`,
      };
    }

    // Deduct credits
    const deduction = await deductCredits(userId, creditsRequired, eventType);
    if (!deduction.success) {
      // Log failed deduction
      await logUsageEvent({
        userId,
        eventType,
        creditsUsed: 0,
        success: false,
        errorMessage: deduction.error,
        duration: Date.now() - startTime,
        ...eventData,
      });

      return deduction;
    }

    // Log successful operation
    await logUsageEvent({
      userId,
      eventType,
      creditsUsed: creditsRequired,
      success: true,
      duration: Date.now() - startTime,
      ...eventData,
    });

    return {
      success: true,
      remaining: deduction.remaining,
    };
  } catch (error: any) {
    logger.error('Error consuming credits:', error);

    // Log error
    await logUsageEvent({
      userId,
      eventType,
      creditsUsed: 0,
      success: false,
      errorMessage: error.message,
      duration: Date.now() - startTime,
      ...eventData,
    });

    return {
      success: false,
      remaining: 0,
      error: error.message || 'Failed to consume credits',
    };
  }
}

/**
 * Reset credits for new billing cycle
 */
export async function resetCredits(userId: string): Promise<void> {
  try {
    const userPlan = await getUserPlan(userId);
    const period = getCurrentPeriod();

    // Create new usage record for current period
    await prisma.userUsage.upsert({
      where: {
        userId_period: {
          userId,
          period,
        },
      },
      create: {
        userId,
        period,
        creditsLimit: userPlan.creditsLimit,
        creditsRemaining: userPlan.creditsLimit,
        creditsUsed: 0,
      },
      update: {
        creditsLimit: userPlan.creditsLimit,
        creditsRemaining: userPlan.creditsLimit,
        creditsUsed: 0,
        fullPageGens: 0,
        sectionRegens: 0,
        elementRegens: 0,
        fieldInference: 0,
      },
    });

    logger.info(`Reset credits for user ${userId} for period ${period}`);
  } catch (error) {
    logger.error('Error resetting credits:', error);
    throw error;
  }
}

/**
 * Update credit limit when plan changes
 */
export async function updateCreditLimit(userId: string, newLimit: number): Promise<void> {
  try {
    const period = getCurrentPeriod();
    const usage = await getUserUsage(userId);

    // Calculate new remaining credits
    const creditsUsed = usage.creditsUsed;
    const newRemaining = Math.max(0, newLimit - creditsUsed);

    await prisma.userUsage.update({
      where: {
        userId_period: {
          userId,
          period,
        },
      },
      data: {
        creditsLimit: newLimit,
        creditsRemaining: newRemaining,
      },
    });

    logger.info(`Updated credit limit for user ${userId} to ${newLimit}`);
  } catch (error) {
    logger.error('Error updating credit limit:', error);
    throw error;
  }
}

/**
 * Get credit balance summary
 */
export async function getCreditBalance(userId: string) {
  try {
    const usage = await getUserUsage(userId);
    const userPlan = await getUserPlan(userId);

    // Calculate next reset date
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      used: usage.creditsUsed,
      remaining: usage.creditsRemaining,
      limit: usage.creditsLimit,
      percentUsed: (usage.creditsUsed / usage.creditsLimit) * 100,
      daysUntilReset,
      nextResetDate: nextMonth,
      tier: userPlan.tier,
    };
  } catch (error) {
    logger.error('Error getting credit balance:', error);
    throw error;
  }
}

/**
 * Get usage statistics for period
 */
export async function getUsageStats(userId: string, period?: string) {
  try {
    const targetPeriod = period || getCurrentPeriod();

    const usage = await prisma.userUsage.findUnique({
      where: {
        userId_period: {
          userId,
          period: targetPeriod,
        },
      },
    });

    if (!usage) {
      return null;
    }

    return {
      period: targetPeriod,
      credits: {
        used: usage.creditsUsed,
        remaining: usage.creditsRemaining,
        limit: usage.creditsLimit,
      },
      operations: {
        fullPageGenerations: usage.fullPageGens,
        sectionRegenerations: usage.sectionRegens,
        elementRegenerations: usage.elementRegens,
        fieldInferences: usage.fieldInference,
      },
      tokens: {
        total: usage.totalTokens,
        input: usage.inputTokens,
        output: usage.outputTokens,
      },
      estimatedCost: usage.estimatedCost,
    };
  } catch (error) {
    logger.error('Error getting usage stats:', error);
    throw error;
  }
}

/**
 * Get recent usage events
 */
export async function getRecentUsageEvents(userId: string, limit: number = 50) {
  try {
    const events = await prisma.usageEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return events;
  } catch (error) {
    logger.error('Error getting recent usage events:', error);
    throw error;
  }
}
