// Archetype map + intent resolver regression tests (email-sequences phase 2).

import { describe, it, expect } from 'vitest';
import { goalIntents, type GoalIntent } from '@/modules/goals/vocabulary';
import { getSequencePlanForIntent } from './archetypes';

const SHOW_UP_INTENTS: GoalIntent[] = ['book-call', 'request-demo', 'book-me', 'rsvp'];
const SKIP_INTENTS: GoalIntent[] = [
  'follow-social',
  'buy-via-link',
  'order-via-platform',
  'pay-via-link',
  'download-app',
];
const DEFERRED_INTENTS: GoalIntent[] = [
  'enquiry',
  'request-quote',
  'apply',
  'lead-magnet',
  'waitlist',
  'subscribe-newsletter',
  'enroll',
  'signup-free',
  'free-trial',
];

describe('getSequencePlanForIntent (phase 2 — Show-up only)', () => {
  it('resolves every one of the 18 frozen intents to a known status', () => {
    for (const intent of goalIntents) {
      const plan = getSequencePlanForIntent(intent);
      expect(['available', 'deferred', 'skipped']).toContain(plan.status);
    }
  });

  it('partitions all 18 intents into exactly the 3 buckets (no gaps/overlap)', () => {
    // Sanity: the three explicit lists cover the frozen vocabulary exactly.
    const union = [...SHOW_UP_INTENTS, ...SKIP_INTENTS, ...DEFERRED_INTENTS];
    expect(new Set(union).size).toBe(goalIntents.length);
    expect(union).toHaveLength(goalIntents.length);
  });

  it('marks the 4 Show-up intents available with a 4-email def, each with a non-empty static timing label', () => {
    for (const intent of SHOW_UP_INTENTS) {
      const plan = getSequencePlanForIntent(intent);
      expect(plan.status).toBe('available');
      if (plan.status !== 'available') continue; // narrow
      expect(plan.def.archetype).toBe('show-up');
      expect(plan.def.emails).toHaveLength(4);
      for (const email of plan.def.emails) {
        expect(email.timingLabel.trim().length).toBeGreaterThan(0);
        expect(email.key.trim().length).toBeGreaterThan(0);
        expect(email.purpose.trim().length).toBeGreaterThan(0);
        expect(email.promptInstructions.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('uses the expected reminder timing labels on the last two Show-up emails', () => {
    const plan = getSequencePlanForIntent('book-call');
    if (plan.status !== 'available') throw new Error('book-call should be available');
    const labels = plan.def.emails.map((e) => e.timingLabel);
    expect(labels).toContain('Send 24h before');
    expect(labels).toContain('Send 1h before');
  });

  it('marks the 5 no-email intents skipped', () => {
    for (const intent of SKIP_INTENTS) {
      expect(getSequencePlanForIntent(intent).status).toBe('skipped');
    }
  });

  it('marks non-pilot intents (incl. signup-free / free-trial) deferred', () => {
    for (const intent of DEFERRED_INTENTS) {
      expect(getSequencePlanForIntent(intent).status).toBe('deferred');
    }
    // Explicit spec callouts.
    expect(getSequencePlanForIntent('signup-free').status).toBe('deferred');
    expect(getSequencePlanForIntent('free-trial').status).toBe('deferred');
  });
});
