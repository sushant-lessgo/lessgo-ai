// lib/creditSystem.ts - Credit-based quota system for AI operations
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getUserPlan } from './planManager';
import { isAdmin } from './admin';

// QA-enablement (founder-approved, qa-0719): ADMIN accounts get UNLIMITED credits
// — never blocked, never charged, no ledger rows. Sentinel balance reported to
// callers/UI. Gated ENTIRELY by ADMIN_CLERK_IDS (see isAdmin); a no-op for anyone
// whose clerk id is not in that env allow-list.
const ADMIN_UNLIMITED = 999_999;

// Credit costs live in the prisma-free `creditCosts.ts` so client components (and
// the Playwright runner) can import them without pulling in prisma. Re-exported
// here verbatim — every existing `@/lib/creditSystem` importer keeps working.
// (Merge note: main's lead-reply track added `LEAD_REPLY: 1` to this inline block;
// as the "second-merger" the lead-reply spec anticipated, that constant moved to
// its new home in `creditCosts.ts` so the re-export carries it.)
import { CREDIT_COSTS } from './creditCosts';
import type { CreditOperation } from './creditCosts';

export { CREDIT_COSTS };
export type { CreditOperation };

// Event types for usage tracking
export enum UsageEventType {
  PAGE_GENERATION = 'page_generation',
  SECTION_REGEN = 'section_regen',
  ELEMENT_REGEN = 'element_regen',
  FIELD_INFERENCE = 'field_inference',
  // V2 Generation system
  UNDERSTAND = 'understand',
  IVOC_RESEARCH = 'ivoc_research',
  STRATEGY_GENERATION = 'strategy_generation',
  UIBLOCK_SELECT = 'uiblock_select',
  GENERATE_COPY = 'generate_copy',
  // Onboarding website import
  SCRAPE_WEBSITE = 'scrape_website',
  // Legal pages
  PRIVACY_POLICY_GENERATION = 'privacy_policy_generation',
  // Social posts (credits-free; this ledger row IS the gating source of truth, see social-posts feature)
  SOCIAL_POST_GENERATION = 'social_post_generation',
  // Email sequences (credits-free; ledger row only, see email-sequences feature)
  EMAIL_SEQUENCE_GENERATION = 'email_sequence_generation',
  // Cold outreach: prospect scrape (charged 1 credit on cache-miss/stale only)
  OUTREACH_SCRAPE = 'outreach_scrape',
  // Cold outreach generation (credits-free; this ledger row IS the gating source of truth, sibling precedent)
  OUTREACH_GENERATION = 'outreach_generation',
  // Lead reply draft (dashboard "Draft reply"; charged 1 credit only on a successful draft)
  LEAD_REPLY_GENERATION = 'lead_reply_generation',
  // Pricing v2: persistent credit pool grants (DB eventType is a plain String, so
  // these new values need no migration). CREDIT_TOPUP = paid $9/100 top-up;
  // LTD_GRANT = 600-credit lifetime-deal seed.
  CREDIT_TOPUP = 'credit_topup',
  LTD_GRANT = 'ltd_grant',
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
 *
 * pricing-v2 decision 1 (block AI ops ONLY at 0 credits): this gate — and the
 * `requireCredits`/`consumeCredits` wrappers in lib/middleware/planCheck.ts — are
 * invoked ONLY by AI-spend routes (regenerate-section/-element, v2/scrape-website,
 * v2/understand, audience {product,service}/{strategy,generate-copy},
 * generate-privacy-policy, outreach). Non-AI persistence routes (/api/saveDraft,
 * /api/publish) deliberately never call it, so a FREE user who hits 0 credits can
 * still save drafts and publish/republish — only new AI generation is blocked.
 * Do NOT add a credit gate to save/publish.
 */
export async function checkCredits(
  userId: string,
  creditsRequired: number
): Promise<{ allowed: boolean; remaining: number; required: number }> {
  // Dev mode bypass
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_CREDITS === 'true') {
    logger.dev(`[DEV] Bypassing credit check for ${creditsRequired} credits`);
    return { allowed: true, remaining: 999999, required: creditsRequired };
  }

  // Admin QA bypass (founder-approved): admins are never gated.
  if (isAdmin(userId)) {
    return { allowed: true, remaining: ADMIN_UNLIMITED, required: creditsRequired };
  }

  try {
    // pricing-v2: available = current-period monthly remaining + persistent pool.
    const usage = await getUserUsage(userId);
    const userPlan = await getUserPlan(userId);
    const available = usage.creditsRemaining + (userPlan.creditPool ?? 0);
    const allowed = available >= creditsRequired;

    return {
      allowed,
      remaining: available,
      required: creditsRequired,
    };
  } catch (error) {
    logger.error('Error checking credits:', error);
    return { allowed: false, remaining: 0, required: creditsRequired };
  }
}

/**
 * Sentinel thrown inside the deduction tx when a guarded conditional update
 * affects 0 rows (i.e. someone else spent the same credits between our read and
 * our write). Throwing it rolls the WHOLE tx back — that rollback is the only
 * thing preventing a partial charge (monthly decremented, pool guard failed).
 * Caught by the bounded retry loop in deductCredits; never escapes the module.
 */
class BucketConflictError extends Error {
  constructor() {
    super('bucket_conflict');
    this.name = 'BucketConflictError';
  }
}

const MAX_DEDUCT_ATTEMPTS = 3;

/**
 * Deduct credits from user's balance.
 *
 * Concurrency model (H1 fix — this used to be a read-modify-write with a FALSE
 * "lock the usage record" comment; findUnique takes no lock, so N concurrent
 * spends all read the same balance and all succeeded on one credit):
 *  - The reads below ONLY compute the monthly/pool split. They enforce NOTHING.
 *  - Every write is a guarded conditional `updateMany` (`creditsRemaining >=
 *    fromMonthly`, `creditPool >= fromPool`) whose affected-row count MUST be 1.
 *    count !== 1 ⇒ BucketConflictError ⇒ whole tx rolls back ⇒ bounded retry.
 *  - CORROLARY (important): when `fromMonthly === 0` the monthly guard
 *    (`creditsRemaining: { gte: 0 }`) is TRIVIALLY TRUE — it is NOT a defense on
 *    pool-only spends. The update still increments creditsUsed + the per-eventType
 *    counter, and only the pool guard can then fail. On pool-only spends the pool
 *    guard is the SOLE enforcer and the tx rollback is the only thing that keeps
 *    creditsUsed from being phantom-inflated by the losers.
 *  - Retry (max 3) fires ONLY on BucketConflictError: e.g. monthly=1/pool=5 with
 *    two concurrent cost-1 spends — both pick fromMonthly=1, the loser's monthly
 *    guard fails even though the pool could cover it; the retry re-reads and
 *    recomputes the split (fromMonthly=0/fromPool=1) and succeeds.
 *  - Genuine insufficiency throws immediately (no retry).
 *  - Retry exhaustion returns error 'charge_conflict' — a DISTINGUISHABLE code,
 *    never the insufficient-credits string: the user may be perfectly solvent and
 *    telling them they're broke is a support ticket on the money path.
 *
 * Ledger: when `eventData` is supplied, the success UsageEvent is written INSIDE
 * the tx (last op) so a successful spend and its ledger row are atomic; retries
 * roll it back, so no duplicate rows.
 */
export async function deductCredits(
  userId: string,
  creditsToDeduct: number,
  eventType: UsageEventType,
  eventData?: Partial<UsageEventData>
): Promise<{ success: boolean; remaining: number; error?: string }> {
  // Dev mode bypass
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_CREDITS === 'true') {
    logger.dev(`[DEV] Bypassing credit deduction of ${creditsToDeduct} credits`);
    return { success: true, remaining: 999999 };
  }

  // Admin QA bypass (founder-approved): admins are never charged and write NO
  // ledger row — no DB write at all for admin spends.
  if (isAdmin(userId)) {
    return { success: true, remaining: ADMIN_UNLIMITED };
  }

  const period = getCurrentPeriod();
  // Best-effort balance seen by the last attempt, reported on retry exhaustion.
  let lastKnownBalance = 0;

  for (let attempt = 1; attempt <= MAX_DEDUCT_ATTEMPTS; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
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

        // pricing-v2: credits = monthly allotment (this period's creditsRemaining)
        // PLUS the persistent pool on UserPlan. Drain the monthly allotment FIRST
        // and take the remainder from the pool.
        const userPlan = await tx.userPlan.findUnique({ where: { userId } });
        const poolBalance = userPlan?.creditPool ?? 0;

        lastKnownBalance = usage.creditsRemaining + poolBalance;

        if (lastKnownBalance < creditsToDeduct) {
          throw new Error('Insufficient credits');
        }

        const fromMonthly = Math.min(usage.creditsRemaining, creditsToDeduct);
        const fromPool = creditsToDeduct - fromMonthly;

        // creditsUsed records the TOTAL consumed (monthly + pool);
        // creditsRemaining tracks only the monthly bucket.
        const updateData: any = {
          creditsUsed: { increment: creditsToDeduct },
          creditsRemaining: { decrement: fromMonthly },
        };

        switch (eventType) {
          case UsageEventType.PAGE_GENERATION:
            updateData.fullPageGens = { increment: 1 };
            break;
          case UsageEventType.SECTION_REGEN:
            updateData.sectionRegens = { increment: 1 };
            break;
          case UsageEventType.ELEMENT_REGEN:
            updateData.elementRegens = { increment: 1 };
            break;
          case UsageEventType.FIELD_INFERENCE:
            updateData.fieldInference = { increment: 1 };
            break;
        }

        const monthlyUpdate = await tx.userUsage.updateMany({
          where: { userId, period, creditsRemaining: { gte: fromMonthly } },
          data: updateData,
        });
        if (monthlyUpdate.count !== 1) {
          throw new BucketConflictError();
        }

        if (fromPool > 0) {
          const poolUpdate = await tx.userPlan.updateMany({
            where: { userId, creditPool: { gte: fromPool } },
            data: { creditPool: { decrement: fromPool } },
          });
          if (poolUpdate.count !== 1) {
            throw new BucketConflictError();
          }
        }

        // Ledger row, in-tx (atomic with the decrement).
        if (eventData) {
          await tx.usageEvent.create({
            data: {
              userId,
              eventType,
              creditsUsed: creditsToDeduct,
              tokensUsed: eventData.tokensUsed,
              estimatedCost: eventData.estimatedCost,
              projectId: eventData.projectId,
              sectionId: eventData.sectionId,
              elementKey: eventData.elementKey,
              metadata: eventData.metadata,
              endpoint: eventData.endpoint,
              duration: eventData.duration,
              success: true,
            },
          });
        }

        // Re-read inside the tx (it sees its own writes) for the return value.
        const freshUsage = await tx.userUsage.findUnique({
          where: { userId_period: { userId, period } },
        });
        const freshPlan = await tx.userPlan.findUnique({ where: { userId } });

        return {
          remaining: (freshUsage?.creditsRemaining ?? 0) + (freshPlan?.creditPool ?? 0),
        };
      });

      logger.dev(`Deducted ${creditsToDeduct} credits from user ${userId}. Remaining: ${result.remaining}`);

      return {
        success: true,
        remaining: result.remaining,
      };
    } catch (error: any) {
      if (error instanceof BucketConflictError) {
        logger.dev(
          `Credit deduction conflict for user ${userId} (attempt ${attempt}/${MAX_DEDUCT_ATTEMPTS}) — retrying`
        );
        continue;
      }
      logger.error('Error deducting credits:', error);
      return {
        success: false,
        remaining: 0,
        error: error.message || 'Failed to deduct credits',
      };
    }
  }

  // Retry exhausted: the user is very likely SOLVENT and just lost every race.
  // Distinguishable code — callers must NOT show the buy-credits wall for this.
  logger.error(
    `Credit deduction conflict exhausted for user ${userId} after ${MAX_DEDUCT_ATTEMPTS} attempts`
  );
  return {
    success: false,
    remaining: lastKnownBalance,
    error: 'charge_conflict',
  };
}

/**
 * Add credits to the user's persistent pool (pricing-v2).
 *
 * The pool is a balance on UserPlan that NEVER resets (survives period rollover
 * and resetCredits). Used for FREE one-time credits, LTD lifetime seed, and $9/100
 * top-ups. Atomically increments UserPlan.creditPool and writes a UsageEvent ledger
 * row. `metadata` may carry Stripe dedupe keys (e.g. { stripeSessionId }) so
 * repeatable grants like top-ups can be made idempotent by the caller.
 */
export async function addPoolCredits(
  userId: string,
  amount: number,
  reason: UsageEventType.CREDIT_TOPUP | UsageEventType.LTD_GRANT,
  metadata?: any
): Promise<{ success: boolean; poolRemaining: number; error?: string }> {
  try {
    const updatedPlan = await prisma.userPlan.update({
      where: { userId },
      data: { creditPool: { increment: amount } },
    });

    // Ledger entry. creditsUsed is negative to denote a GRANT (credits added),
    // keeping the ledger sum-consistent with debits recorded as positive.
    await prisma.usageEvent.create({
      data: {
        userId,
        eventType: reason,
        creditsUsed: -amount,
        metadata,
        success: true,
      },
    });

    logger.info(`Added ${amount} pool credits to user ${userId} (${reason}). Pool: ${updatedPlan.creditPool}`);
    return { success: true, poolRemaining: updatedPlan.creditPool };
  } catch (error: any) {
    logger.error('Error adding pool credits:', error);
    return { success: false, poolRemaining: 0, error: error.message || 'Failed to add pool credits' };
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

    // Deduct credits. The success ledger row is written INSIDE the deduction tx
    // (atomic with the decrement — a crash can no longer leave a silent
    // unledgered spend), so there is deliberately NO post-hoc success
    // logUsageEvent here: that would double-ledger. Failure records below stay
    // on logUsageEvent (no tx to join; swallow-on-error is fine for those).
    const deduction = await deductCredits(userId, creditsRequired, eventType, {
      duration: Date.now() - startTime,
      ...eventData,
    });
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

      // Propagate the error string UNMANGLED — routes branch on
      // 'charge_conflict' (solvent user, lost the race → recoverable 500) vs a
      // genuine insufficiency (→ 402).
      return deduction;
    }

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
  // Admin QA bypass (founder-approved): synthetic unlimited balance, same keys as
  // the real return. Computed reset dates match the real code below.
  if (isAdmin(userId)) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      used: 0,
      remaining: ADMIN_UNLIMITED,
      limit: ADMIN_UNLIMITED,
      percentUsed: 0,
      daysUntilReset,
      nextResetDate: nextMonth,
      tier: 'AGENCY' as const,
      monthlyRemaining: ADMIN_UNLIMITED,
      poolRemaining: ADMIN_UNLIMITED,
      totalAvailable: ADMIN_UNLIMITED,
    };
  }

  try {
    const usage = await getUserUsage(userId);
    const userPlan = await getUserPlan(userId);

    // Calculate next reset date
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const poolRemaining = userPlan.creditPool ?? 0;
    const monthlyRemaining = usage.creditsRemaining;
    // pricing-v2: guard the division — FREE has creditsLimit=0, so used/limit is
    // NaN/Infinity. Report 0% when there is no monthly allotment.
    const percentUsed =
      usage.creditsLimit > 0 ? (usage.creditsUsed / usage.creditsLimit) * 100 : 0;

    return {
      // Back-compat fields (existing consumers: CreditBadge, dashboard).
      used: usage.creditsUsed,
      remaining: usage.creditsRemaining,
      limit: usage.creditsLimit,
      percentUsed,
      daysUntilReset,
      nextResetDate: nextMonth,
      tier: userPlan.tier,
      // pricing-v2 pool-aware fields.
      monthlyRemaining,
      poolRemaining,
      totalAvailable: monthlyRemaining + poolRemaining,
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

    // pricing-v2: fold in the persistent pool + guard the zero-limit division.
    const userPlan = await getUserPlan(userId);
    const poolRemaining = userPlan.creditPool ?? 0;
    const percentUsed =
      usage.creditsLimit > 0 ? (usage.creditsUsed / usage.creditsLimit) * 100 : 0;

    return {
      period: targetPeriod,
      credits: {
        used: usage.creditsUsed,
        remaining: usage.creditsRemaining,
        limit: usage.creditsLimit,
        percentUsed,
        monthlyRemaining: usage.creditsRemaining,
        poolRemaining,
        totalAvailable: usage.creditsRemaining + poolRemaining,
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
