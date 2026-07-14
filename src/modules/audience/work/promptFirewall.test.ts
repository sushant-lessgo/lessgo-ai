// src/modules/audience/work/promptFirewall.test.ts
import { describe, it, expect } from 'vitest';
import {
  assertNoTemplateLeak,
  assertNoTemplateNamesInText,
  TEMPLATE_NAME_TOKENS,
  WORK_FORBIDDEN_KEYS,
} from './promptFirewall';
import { buildWorkStrategyPrompt } from './strategy/promptsWork';
import { selectWorkVoice, formatWorkVoiceForPrompt } from './voice';

describe('assertNoTemplateLeak (input-object guard)', () => {
  it('throws when a template-identity key is present', () => {
    for (const key of WORK_FORBIDDEN_KEYS) {
      expect(() => assertNoTemplateLeak({ [key]: 'atelier' }, 'test')).toThrow(
        /template identity/
      );
    }
  });

  it('passes a clean object', () => {
    expect(() =>
      assertNoTemplateLeak({ pricePosition: 'premium', praise: [] }, 'test')
    ).not.toThrow();
  });

  it('is a no-op on non-objects', () => {
    expect(() => assertNoTemplateLeak('hello', 'test')).not.toThrow();
    expect(() => assertNoTemplateLeak(null, 'test')).not.toThrow();
  });
});

describe('assertNoTemplateNamesInText (prompt-string guard)', () => {
  it('throws when a template name token leaks into the text', () => {
    for (const token of TEMPLATE_NAME_TOKENS) {
      expect(() =>
        assertNoTemplateNamesInText(`copy for the ${token} skin`, 'test')
      ).toThrow(/template token/);
    }
  });

  it('passes template-agnostic text', () => {
    expect(() =>
      assertNoTemplateNamesInText('A calm portfolio for a premium photographer.', 'test')
    ).not.toThrow();
  });
});

describe('assertNoTemplateNamesInText — word-boundary (phase-3 carry-forward fix)', () => {
  // Naive `includes(token)` false-positived on common-English substrings once the
  // larger phase-3 copy prompts carry real prose. Word-boundary matching fixes it:
  // substrings pass, whole-word leaks still throw.
  it('does NOT trip on common-English substrings of a token', () => {
    for (const clean of [
      'A flexible schedule for a demanding shoot.', // contains "lex"
      'The brief was complex but rewarding.', // contains "lex"
      'A resurgence of interest in film photography.', // contains "surge"
      'They unhearth the story in every frame.', // contains "hearth"
    ]) {
      expect(() => assertNoTemplateNamesInText(clean, 'test')).not.toThrow();
    }
  });

  it('STILL throws on a real whole-word template-name leak', () => {
    expect(() => assertNoTemplateNamesInText('render with the lex skin', 'test')).toThrow(
      /template token/
    );
    expect(() => assertNoTemplateNamesInText('use the hearth layout', 'test')).toThrow(
      /template token/
    );
  });
});

describe('buildWorkStrategyPrompt is firewall-clean (AC-7 first half)', () => {
  // The prompt builder must never surface template identity, EVEN when the
  // surrounding call site is salted with template ids. It internally calls both
  // firewall guards, so a clean build proves the prompt carries no template name.
  const voiceBlock = formatWorkVoiceForPrompt(
    selectWorkVoice({
      professionRow: { key: 'photographer' },
      pricePosition: 'premium',
      establishment: 'established',
    })
  );

  const baseInput = {
    businessName: 'Studio Vero',
    profession: 'photographer' as const,
    workNoun: 'galleries',
    pricePosition: 'premium' as const,
    establishment: 'established' as const,
    dreamClient: 'discerning couples who want editorial, timeless work',
    praise: ['The photos still make us cry.', 'Worth every penny.'],
    groupNames: ['Weddings', 'Editorial'],
    primaryLanguage: 'en',
    voiceBlock,
  };

  it('produces a prompt with no template names', () => {
    const prompt = buildWorkStrategyPrompt(baseInput);
    const lc = prompt.toLowerCase();
    for (const token of TEMPLATE_NAME_TOKENS) {
      expect(lc).not.toContain(token);
    }
  });

  it('throws if a template-identity key is salted onto the input', () => {
    expect(() =>
      buildWorkStrategyPrompt({ ...baseInput, templateId: 'atelier' } as any)
    ).toThrow(/template identity/);
    expect(() =>
      buildWorkStrategyPrompt({ ...baseInput, skeletonId: 'atelier' } as any)
    ).toThrow(/template identity/);
  });

  it('still carries the seller facts (praise, groups, dream client)', () => {
    const prompt = buildWorkStrategyPrompt(baseInput);
    expect(prompt).toContain('The photos still make us cry.');
    expect(prompt).toContain('Weddings');
    expect(prompt).toContain('discerning couples');
  });
});
