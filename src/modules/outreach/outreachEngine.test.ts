// Outreach engine regression tests (cold-outreach phase 3).
// Mirrors src/modules/email/sequenceEngine.test.ts (frozen-fixture / validation).

import { describe, it, expect } from 'vitest';
import type { Brief } from '@/types/brief';
import { buildBrandContext } from '@/modules/email/brandContext';
import type { ProspectExtract } from './prospectExtraction';
import {
  COLD_EMAIL_DEF,
  LINKEDIN_NOTE_DEF,
  LINKEDIN_INMAIL_DEF,
  WHATSAPP_DEF,
  INSTAGRAM_DM_DEF,
  PILOT_PLATFORMS,
  ALL_PLATFORMS,
  getPlatformDef,
} from './platforms';
import {
  buildOutreachPrompt,
  buildSingleMessagePrompt,
  outreachOutputSchema,
  singleMessageOutputSchema,
  validateOutreachMessages,
  validateSingleMessage,
  mockOutreachOutput,
  mockSingleMessageOutput,
  PROOF_TRUTH_FRAGMENT,
} from './outreachEngine';

const brief = {
  goal: { intent: 'book-call', mechanism: 'M1' },
  proofAvailable: ['5-star Google reviews'],
  facts: {
    entry: {
      offer: 'Free 30-minute strategy call',
      offerings: ['Growth audit', 'Fractional CMO'],
      audiences: ['B2B SaaS founders'],
      testimonials: ['They doubled our pipeline in a quarter.'],
    },
  },
} as unknown as Brief;

const ctx = buildBrandContext(brief);

const extract: ProspectExtract = {
  name: 'Acme Robotics',
  whatTheyDo: 'Builds warehouse automation robots.',
  whoFor: 'Regional 3PL warehouses.',
  specifics: ['Flagship robot "Cart-X"', 'Recently expanded into cold-storage'],
};

const intake = { targetDescriptor: 'Ops leads at mid-size 3PLs', openerContext: 'Saw their cold-storage push' };

// Build a body with exactly `n` words.
const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');

describe('validateOutreachMessages — cap enforcement (linkedin_note, chars)', () => {
  const platforms = [LINKEDIN_NOTE_DEF];

  it('301-char body → too_long', () => {
    const raw = { messages: [{ platform: 'linkedin_note', body: 'x'.repeat(301) }] };
    const result = validateOutreachMessages(raw, platforms);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('too_long');
  });

  it('≤300-char body → ok', () => {
    const raw = { messages: [{ platform: 'linkedin_note', body: 'x'.repeat(300) }] };
    expect(validateOutreachMessages(raw, platforms).ok).toBe(true);
  });
});

describe('validateOutreachMessages — cap enforcement (cold_email, words + subject chars)', () => {
  const platforms = [COLD_EMAIL_DEF];

  it('121-word body → too_long', () => {
    const raw = { messages: [{ platform: 'cold_email', subject: 'Quick idea', body: words(121) }] };
    const result = validateOutreachMessages(raw, platforms);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('too_long');
  });

  it('≤120-word body → ok', () => {
    const raw = { messages: [{ platform: 'cold_email', subject: 'Quick idea', body: words(120) }] };
    expect(validateOutreachMessages(raw, platforms).ok).toBe(true);
  });

  it('subject >120 chars → too_long', () => {
    const raw = { messages: [{ platform: 'cold_email', subject: 'x'.repeat(121), body: words(10) }] };
    const result = validateOutreachMessages(raw, platforms);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('too_long');
  });
});

describe('validateOutreachMessages — shape enforcement', () => {
  it('missing subject on cold_email → invalid_shape', () => {
    const raw = { messages: [{ platform: 'cold_email', body: words(10) }] };
    const result = validateOutreachMessages(raw, [COLD_EMAIL_DEF]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_shape');
  });

  it('present subject on linkedin_note → invalid_shape', () => {
    const raw = { messages: [{ platform: 'linkedin_note', subject: 'nope', body: 'hi' }] };
    const result = validateOutreachMessages(raw, [LINKEDIN_NOTE_DEF]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_shape');
  });

  it('platform id mismatch → invalid_shape', () => {
    const raw = { messages: [{ platform: 'linkedin_note', subject: 'x', body: 'b' }] };
    const result = validateOutreachMessages(raw, [COLD_EMAIL_DEF]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_shape');
  });

  it('array length mismatch → invalid_shape', () => {
    const raw = { messages: [{ platform: 'cold_email', subject: 's', body: 'b' }] };
    const result = validateOutreachMessages(raw, PILOT_PLATFORMS); // expects 2
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_shape');
  });

  it('empty body → invalid_shape', () => {
    const raw = { messages: [{ platform: 'linkedin_note', body: '   ' }] };
    const result = validateOutreachMessages(raw, [LINKEDIN_NOTE_DEF]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_shape');
  });
});

describe('schemas carry NO caps (decision #10)', () => {
  it('a too-long cold_email body still PARSES the shape schema', () => {
    const raw = { messages: [{ platform: 'cold_email', subject: 'ok', body: words(500) }] };
    expect(outreachOutputSchema([COLD_EMAIL_DEF]).safeParse(raw).success).toBe(true);
  });

  it('a too-long linkedin_note body still PARSES the shape schema', () => {
    const raw = { messages: [{ platform: 'linkedin_note', body: 'x'.repeat(1000) }] };
    expect(outreachOutputSchema([LINKEDIN_NOTE_DEF]).safeParse(raw).success).toBe(true);
  });

  it('single-message shape schema also carries no caps', () => {
    const raw = { platform: 'cold_email', subject: 'ok', body: words(500) };
    expect(singleMessageOutputSchema(COLD_EMAIL_DEF).safeParse(raw).success).toBe(true);
  });
});

describe('phase 6 — new platform caps (boundary: at-cap ok, over-cap too_long)', () => {
  const cases: Array<{ def: typeof COLD_EMAIL_DEF; cap: number }> = [
    { def: LINKEDIN_INMAIL_DEF, cap: 600 },
    { def: WHATSAPP_DEF, cap: 400 },
    { def: INSTAGRAM_DM_DEF, cap: 500 },
  ];

  for (const { def, cap } of cases) {
    it(`${def.id}: body at ${cap} chars → ok`, () => {
      const raw = { messages: [{ platform: def.id, body: 'x'.repeat(cap) }] };
      expect(validateOutreachMessages(raw, [def]).ok).toBe(true);
    });

    it(`${def.id}: body at ${cap + 1} chars → too_long`, () => {
      const raw = { messages: [{ platform: def.id, body: 'x'.repeat(cap + 1) }] };
      const result = validateOutreachMessages(raw, [def]);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('too_long');
    });
  }

  it('all five platforms now resolve via getPlatformDef (no null)', () => {
    for (const p of ['cold_email', 'linkedin_note', 'linkedin_inmail', 'whatsapp', 'instagram_dm']) {
      expect(getPlatformDef(p)).not.toBeNull();
    }
  });

  it('every platform def carries bumpInstructions', () => {
    for (const def of ALL_PLATFORMS) {
      expect(typeof def.bumpInstructions).toBe('string');
      expect(def.bumpInstructions!.length).toBeGreaterThan(0);
    }
  });

  it('mockOutreachOutput passes validators for all five platforms', () => {
    const raw = mockOutreachOutput(ALL_PLATFORMS);
    expect(outreachOutputSchema(ALL_PLATFORMS).safeParse(raw).success).toBe(true);
    expect(validateOutreachMessages(raw, ALL_PLATFORMS).ok).toBe(true);
  });
});

describe('phase 6 — bump prompt', () => {
  const priorMessages = [
    { platform: 'cold_email', subject: 'Quick idea for Acme', body: 'FIRST TOUCH BODY about Cart-X.' },
    { platform: 'linkedin_note', body: 'FIRST NOTE reason to connect.' },
  ];

  const bumpPrompt = buildOutreachPrompt({
    platforms: PILOT_PLATFORMS,
    brandContext: ctx,
    intake,
    grounding: extract,
    kind: 'bump',
    priorMessages,
  });

  it('injects the initial message bodies as prior context', () => {
    expect(bumpPrompt).toContain('FIRST TOUCH BODY about Cart-X.');
    expect(bumpPrompt).toContain('FIRST NOTE reason to connect.');
    expect(bumpPrompt).toContain('FIRST MESSAGE ALREADY SENT');
  });

  it('uses the bump instructions (follow-up framing, no guilt-trip)', () => {
    expect(bumpPrompt).toContain('follow-up');
    expect(bumpPrompt).toContain('did NOT reply');
  });

  it('still ONE bump per platform — no cadence (Scope OUT)', () => {
    // The output schema expects exactly platforms.length messages: one bump each,
    // never a multi-step sequence.
    const oneEach = {
      messages: [
        { platform: 'cold_email', subject: 'Following up', body: 'bump body' },
        { platform: 'linkedin_note', body: 'bump note' },
      ],
    };
    expect(validateOutreachMessages(oneEach, PILOT_PLATFORMS).ok).toBe(true);
    const twoForOne = {
      messages: [
        { platform: 'cold_email', subject: 'a', body: 'b' },
        { platform: 'cold_email', subject: 'c', body: 'd' },
      ],
    };
    // Two messages for a single-platform selection → shape violation (no cadence).
    expect(validateOutreachMessages(twoForOne, [COLD_EMAIL_DEF]).ok).toBe(false);
  });
});

describe('phase 6 — single-message bump prompt (regen)', () => {
  const prompt = buildSingleMessagePrompt({
    platformDef: COLD_EMAIL_DEF,
    siblings: [],
    brandContext: ctx,
    intake,
    grounding: extract,
    kind: 'bump',
    priorMessage: { platform: 'cold_email', subject: 'Quick idea', body: 'ORIGINAL EMAIL BODY.' },
  });

  it('injects the corresponding initial message as prior context', () => {
    expect(prompt).toContain('ORIGINAL EMAIL BODY.');
    expect(prompt).toContain('FIRST MESSAGE ALREADY SENT');
  });
});

describe('buildOutreachPrompt — grounded', () => {
  const prompt = buildOutreachPrompt({ platforms: PILOT_PLATFORMS, brandContext: ctx, intake, grounding: extract });

  it('includes prospect facts and the "reference at least one" instruction', () => {
    expect(prompt).toContain('Acme Robotics');
    expect(prompt).toContain('Cart-X');
    expect(prompt).toContain('reference at least one');
  });

  it('includes brand context + proof-truth fragment + JSON messages output', () => {
    expect(prompt).toContain('Free 30-minute strategy call');
    expect(prompt).toContain(PROOF_TRUTH_FRAGMENT);
    expect(prompt).toContain('"messages"');
  });

  it('includes a slot per platform in order', () => {
    expect(prompt).toContain(COLD_EMAIL_DEF.id);
    expect(prompt).toContain(LINKEDIN_NOTE_DEF.id);
    expect(prompt.indexOf(COLD_EMAIL_DEF.id)).toBeLessThan(prompt.lastIndexOf(LINKEDIN_NOTE_DEF.id));
  });
});

describe('buildOutreachPrompt — generic (grounding null)', () => {
  const prompt = buildOutreachPrompt({ platforms: PILOT_PLATFORMS, brandContext: ctx, intake, grounding: null });

  it('includes the generic instruction and the target descriptor', () => {
    expect(prompt).toContain('NO prospect info');
    expect(prompt).toContain('GENERIC');
    expect(prompt).toContain('Ops leads at mid-size 3PLs');
  });

  it('does NOT contain a fabricated PROSPECT FACTS block', () => {
    expect(prompt).not.toContain('PROSPECT FACTS');
    expect(prompt).not.toContain('reference at least one');
  });
});

describe('buildSingleMessagePrompt', () => {
  const siblings = [{ platform: 'cold_email', subject: 'Hi', body: 'First message.' }];
  const prompt = buildSingleMessagePrompt({ platformDef: LINKEDIN_NOTE_DEF, siblings, brandContext: ctx, intake, grounding: extract });

  it('references the platform, siblings, and proof-truth', () => {
    expect(prompt).toContain(LINKEDIN_NOTE_DEF.id);
    expect(prompt).toContain('First message.');
    expect(prompt).toContain(PROOF_TRUTH_FRAGMENT);
  });
});

describe('mock outputs', () => {
  it('mockOutreachOutput passes its schema and validator for the pilot pair', () => {
    const raw = mockOutreachOutput(PILOT_PLATFORMS);
    expect(outreachOutputSchema(PILOT_PLATFORMS).safeParse(raw).success).toBe(true);
    expect(validateOutreachMessages(raw, PILOT_PLATFORMS).ok).toBe(true);
  });

  it('mockSingleMessageOutput passes its schema and validator (both platforms)', () => {
    for (const def of PILOT_PLATFORMS) {
      const raw = mockSingleMessageOutput(def);
      expect(singleMessageOutputSchema(def).safeParse(raw).success).toBe(true);
      expect(validateSingleMessage(raw, def).ok).toBe(true);
    }
  });
});
