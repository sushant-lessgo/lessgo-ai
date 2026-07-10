// src/modules/social/postEngine.test.ts
// Failable unit tests for the pure post engine: prompt assembly (3 modes +
// testimonial presence/absence), output validation (length), and the
// deterministic mock generator. No AI, no DB — pure module tests.

import { describe, it, expect } from 'vitest';
import type { BrandContext } from './types';
import {
  buildSocialPostPrompt,
  validatePostOutput,
  socialPostOutputSchema,
  ARCHETYPE_INSTRUCTIONS,
} from './postEngine';
import { getMockPost } from './mockPosts';
import { PLATFORM_PRESETS } from './presets';

const TESTIMONIAL_HEADING = 'Testimonials:';

function ctxWithTestimonials(): BrandContext {
  return {
    businessName: 'Acme Robotics',
    offer: 'Free 30-day pilot of our warehouse arm',
    features: [{ feature: 'Fast setup', benefit: 'Live in a day' }],
    testimonials: [
      {
        quote: 'Cut our pick time by forty percent in two weeks',
        authorName: 'Dana Lee',
        authorRole: 'Ops Lead',
        authorCompany: 'FulfillCo',
      },
    ],
    socialProfiles: [],
  };
}

function ctxWithoutTestimonials(): BrandContext {
  return {
    businessName: 'Acme Robotics',
    offer: 'Free 30-day pilot of our warehouse arm',
    features: [],
    testimonials: [],
    socialProfiles: [],
  };
}

describe('buildSocialPostPrompt — brand data flows into the prompt', () => {
  it('includes brand name, offer, and a testimonial quote when the ctx HAS them', () => {
    const prompt = buildSocialPostPrompt({
      ctx: ctxWithTestimonials(),
      platform: 'linkedin',
      mode: 'archetype',
      archetype: 'inspirational',
    });
    expect(prompt).toContain('Acme Robotics');
    expect(prompt).toContain('Free 30-day pilot of our warehouse arm');
    expect(prompt).toContain('Cut our pick time by forty percent in two weeks');
    expect(prompt).toContain(TESTIMONIAL_HEADING);
  });

  it('OMITS the testimonial section cleanly when ctx has none, and never instructs fabrication', () => {
    const prompt = buildSocialPostPrompt({
      ctx: ctxWithoutTestimonials(),
      platform: 'linkedin',
      mode: 'archetype',
      archetype: 'testimonial_quote',
    });
    // heading absent (summarizeBrandContext omits empty sections)
    expect(prompt).not.toContain(TESTIMONIAL_HEADING);
    // and the testimonial_quote path must forbid fabrication, not request a quote
    expect(prompt).toContain('DO NOT fabricate a quote');
    expect(prompt.toLowerCase()).toContain('no customer testimonials are available');
  });

  it('testimonial_quote WITH testimonials asks to draw on the real one', () => {
    const prompt = buildSocialPostPrompt({
      ctx: ctxWithTestimonials(),
      platform: 'linkedin',
      mode: 'archetype',
      archetype: 'testimonial_quote',
    });
    expect(prompt).toContain('Draw on a real testimonial');
    expect(prompt).not.toContain('DO NOT fabricate a quote');
  });

  it('polish mode embeds the draft text verbatim', () => {
    const draft = 'we shipped a thing today it is pretty cool i guess';
    const prompt = buildSocialPostPrompt({
      ctx: ctxWithoutTestimonials(),
      platform: 'linkedin',
      mode: 'polish',
      draft,
    });
    expect(prompt).toContain(draft);
    expect(prompt).toContain('Rewrite and polish the following draft');
  });

  it('archetype_context mode embeds the fresh-context text', () => {
    const fresh = 'we just crossed 500 pilots installed this quarter';
    const prompt = buildSocialPostPrompt({
      ctx: ctxWithoutTestimonials(),
      platform: 'linkedin',
      mode: 'archetype_context',
      archetype: 'announcement',
      freshContext: fresh,
    });
    expect(prompt).toContain(fresh);
    expect(prompt).toContain(ARCHETYPE_INSTRUCTIONS.announcement);
  });

  it('injects the platform preset constraints (tone + maxChars)', () => {
    const prompt = buildSocialPostPrompt({
      ctx: ctxWithoutTestimonials(),
      platform: 'linkedin',
      mode: 'archetype',
      archetype: 'tip',
    });
    expect(prompt).toContain('LinkedIn');
    expect(prompt).toContain(String(PLATFORM_PRESETS.linkedin.maxChars));
    expect(prompt).toContain('{"post"');
  });
});

describe('validatePostOutput', () => {
  const xPreset = PLATFORM_PRESETS.x; // maxChars 280 → sharp length check

  it('REJECTS an over-limit post (X 280) without throwing', () => {
    const tooLong = 'a'.repeat(281);
    const result = validatePostOutput({ post: tooLong }, xPreset);
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === 'too_long') {
      expect(result.length).toBe(281);
      expect(result.maxChars).toBe(280);
    } else {
      throw new Error('expected too_long result');
    }
  });

  it('ACCEPTS an in-limit post', () => {
    const okText = 'a'.repeat(280);
    const result = validatePostOutput({ post: okText }, xPreset);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.post).toBe(okText);
  });

  it('rejects a shape-invalid payload as invalid_shape', () => {
    const result = validatePostOutput({ notPost: 'x' }, xPreset);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_shape');
  });

  it('rejects an empty/whitespace post as invalid_shape', () => {
    const result = validatePostOutput({ post: '   ' }, xPreset);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_shape');
  });

  it('schema parses a valid object', () => {
    expect(socialPostOutputSchema.safeParse({ post: 'hi' }).success).toBe(true);
  });
});

describe('getMockPost — deterministic, brand-bearing, within limits', () => {
  const ctx = ctxWithTestimonials();

  it('output length <= maxChars and contains the business name for EVERY platform', () => {
    for (const platform of Object.keys(PLATFORM_PRESETS) as Array<
      keyof typeof PLATFORM_PRESETS
    >) {
      const post = getMockPost({
        platform,
        mode: 'archetype',
        archetype: 'inspirational',
        ctx,
      });
      expect(post.length).toBeLessThanOrEqual(PLATFORM_PRESETS[platform].maxChars);
      expect(post).toContain('Acme Robotics');
    }
  });

  it('is deterministic (same inputs → identical output)', () => {
    const a = getMockPost({ platform: 'linkedin', mode: 'archetype', archetype: 'tip', ctx });
    const b = getMockPost({ platform: 'linkedin', mode: 'archetype', archetype: 'tip', ctx });
    expect(a).toBe(b);
  });

  it('polish mode carries the draft into the mock', () => {
    const draft = 'raw draft text here';
    const post = getMockPost({ platform: 'linkedin', mode: 'polish', ctx, draft });
    expect(post).toContain(draft);
  });
});
