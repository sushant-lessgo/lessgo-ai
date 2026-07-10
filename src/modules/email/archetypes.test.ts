// Archetype map + intent resolver regression tests (email-sequences phase 6).

import { describe, it, expect } from 'vitest';
import { goalIntents, type GoalIntent } from '@/modules/goals/vocabulary';
import { getSequencePlanForIntent, type EmailArchetypeId } from './archetypes';

// Every now-available intent, its archetype, and the expected email count.
const AVAILABLE_INTENTS: Array<{
  intent: GoalIntent;
  archetype: EmailArchetypeId;
  count: number;
}> = [
  // Show-up
  { intent: 'book-call', archetype: 'show-up', count: 4 },
  { intent: 'request-demo', archetype: 'show-up', count: 4 },
  { intent: 'book-me', archetype: 'show-up', count: 4 },
  { intent: 'rsvp', archetype: 'show-up', count: 4 },
  // Follow-up nurture
  { intent: 'enquiry', archetype: 'follow-up-nurture', count: 4 },
  { intent: 'request-quote', archetype: 'follow-up-nurture', count: 4 },
  { intent: 'apply', archetype: 'follow-up-nurture', count: 4 },
  // Lead-magnet delivery
  { intent: 'lead-magnet', archetype: 'lead-magnet-delivery', count: 4 },
  // Waitlist warm-keeper
  { intent: 'waitlist', archetype: 'waitlist-warm-keeper', count: 3 },
  // Welcome series
  { intent: 'subscribe-newsletter', archetype: 'welcome-series', count: 3 },
  { intent: 'enroll', archetype: 'welcome-series', count: 3 },
];

const SKIP_INTENTS: GoalIntent[] = [
  'follow-social',
  'buy-via-link',
  'order-via-platform',
  'pay-via-link',
  'download-app',
];

const DEFERRED_INTENTS: GoalIntent[] = ['signup-free', 'free-trial'];

describe('getSequencePlanForIntent (phase 6 — all 5 archetypes live)', () => {
  it('resolves every one of the 18 frozen intents to a known status', () => {
    for (const intent of goalIntents) {
      const plan = getSequencePlanForIntent(intent);
      expect(['available', 'deferred', 'skipped']).toContain(plan.status);
    }
  });

  it('partitions all 18 intents into exactly the 3 buckets (no gaps/overlap)', () => {
    const union = [
      ...AVAILABLE_INTENTS.map((a) => a.intent),
      ...SKIP_INTENTS,
      ...DEFERRED_INTENTS,
    ];
    expect(new Set(union).size).toBe(goalIntents.length);
    expect(union).toHaveLength(goalIntents.length);
  });

  it('marks all 11 available intents available with the right archetype + email count', () => {
    for (const { intent, archetype, count } of AVAILABLE_INTENTS) {
      const plan = getSequencePlanForIntent(intent);
      expect(plan.status).toBe('available');
      if (plan.status !== 'available') continue; // narrow
      expect(plan.def.archetype).toBe(archetype);
      expect(plan.def.emails).toHaveLength(count);
    }
  });

  it('every available email has non-empty static metadata (key, purpose, timing label, prompt)', () => {
    for (const { intent } of AVAILABLE_INTENTS) {
      const plan = getSequencePlanForIntent(intent);
      if (plan.status !== 'available') throw new Error(`${intent} should be available`);
      for (const email of plan.def.emails) {
        expect(email.key.trim().length).toBeGreaterThan(0);
        expect(email.purpose.trim().length).toBeGreaterThan(0);
        expect(email.timingLabel.trim().length).toBeGreaterThan(0);
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

  it('pins the waitlist warm-keeper final email to launch', () => {
    const plan = getSequencePlanForIntent('waitlist');
    if (plan.status !== 'available') throw new Error('waitlist should be available');
    const labels = plan.def.emails.map((e) => e.timingLabel);
    expect(labels[0]).toBe('Send immediately');
    expect(labels).toContain('Send at launch');
  });

  it('marks the 5 no-email intents skipped', () => {
    for (const intent of SKIP_INTENTS) {
      expect(getSequencePlanForIntent(intent).status).toBe('skipped');
    }
  });

  it('keeps Activation (signup-free / free-trial) deferred', () => {
    for (const intent of DEFERRED_INTENTS) {
      expect(getSequencePlanForIntent(intent).status).toBe('deferred');
    }
    expect(getSequencePlanForIntent('signup-free').status).toBe('deferred');
    expect(getSequencePlanForIntent('free-trial').status).toBe('deferred');
  });
});
