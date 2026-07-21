// src/lib/email/resolveOwnerEmail.ts
// Resolves a page owner's email address from their Clerk user record, so lead
// notifications reach the OWNER instead of a single fixed founder inbox.
//
// Contract: NEVER throws. Every failure (bad id, Clerk outage, user with no
// email on file) comes back as `{ error }` so the caller can record the outcome
// and move on — a lead row is always saved regardless.
//
// Clerk v6 API: `clerkClient` is an async factory, not a singleton.

import * as Sentry from '@sentry/nextjs';
import { clerkClient } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

export type OwnerEmailResult = { email: string } | { error: string };

// An unresolvable owner email means the owner silently stops receiving leads —
// surface it (same observability contract as a failed send). No-op without a DSN.
function report(reason: string, clerkUserId: string) {
  Sentry.captureException(new Error(`resolveOwnerEmail: ${reason}`), {
    level: 'warning',
    tags: { area: 'email', op: 'resolveOwnerEmail' },
    extra: { clerkUserId: clerkUserId ? `${clerkUserId.slice(0, 8)}...` : null },
  });
}

export async function resolveOwnerEmail(clerkUserId: string): Promise<OwnerEmailResult> {
  if (!clerkUserId || typeof clerkUserId !== 'string') {
    return { error: 'no owner id' };
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);

    const addresses = user?.emailAddresses || [];
    if (!addresses.length) {
      report('owner has no email address on file', clerkUserId);
      return { error: 'owner has no email address on file' };
    }

    // Prefer the primary address; fall back to the first one Clerk knows about.
    const primaryId = user?.primaryEmailAddressId;
    const primary = primaryId ? addresses.find((a) => a?.id === primaryId) : undefined;
    const email = (primary || addresses[0])?.emailAddress;

    if (!email || typeof email !== 'string') {
      report('owner has no email address on file', clerkUserId);
      return { error: 'owner has no email address on file' };
    }
    return { email };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn('resolveOwnerEmail: Clerk lookup failed', () => msg);
    report(`Clerk lookup failed: ${msg}`, clerkUserId);
    return { error: `owner lookup failed: ${msg}`.slice(0, 300) };
  }
}
