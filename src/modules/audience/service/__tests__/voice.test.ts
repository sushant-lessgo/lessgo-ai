// Voice selection is by BUSINESS ARCHETYPE (serviceType + growth signals), never
// by templateId — keeps the promptFirewall invariant intact. These tests lock
// that contract + the firewall-safety of the template-aware section selection.

import { selectServiceVoice, HEARTH_VOICE, PERFORMANCE_VOICE, formatServiceVoiceForPrompt } from '@/modules/audience/service/voice';
import { assembleServiceStrategy } from '@/modules/audience/service/strategy/parseStrategyService';
import type { ServiceAssetInput } from '@/types/service';

const allAssets: ServiceAssetInput = {
  hasTestimonials: true,
  hasClientLogos: true,
  hasOutcomes: true,
  hasCaseStudies: true,
  hasTeamPhotos: true,
  hasFounderPhoto: true,
  testimonialType: 'text',
};

describe('selectServiceVoice', () => {
  it('growth/paid-media agency → PERFORMANCE voice', () => {
    expect(
      selectServiceVoice({ serviceType: 'agency', whatYouDo: 'We run paid media and SEO for founders', services: ['Paid social', 'SEO'], outcomes: ['ROAS'] }),
    ).toBe(PERFORMANCE_VOICE);
  });

  it('brand/design agency (no growth signal) → HEARTH voice', () => {
    expect(
      selectServiceVoice({ serviceType: 'agency', whatYouDo: 'We craft brand identities for boutiques', services: ['Brand identity', 'Packaging'], outcomes: [] }),
    ).toBe(HEARTH_VOICE);
  });

  it('non-agency service types → HEARTH voice even with growth-ish words', () => {
    expect(
      selectServiceVoice({ serviceType: 'coaching', whatYouDo: 'Growth coaching for founders', services: ['Coaching'], outcomes: [] }),
    ).toBe(HEARTH_VOICE);
  });

  it('null understanding → HEARTH (safe default, no behavior change)', () => {
    expect(selectServiceVoice(null)).toBe(HEARTH_VOICE);
  });

  it('the prompt block reflects the selected voice label + forbidden list', () => {
    const perf = formatServiceVoiceForPrompt(PERFORMANCE_VOICE);
    expect(perf).toContain('## VOICE — PERFORMANCE');
    expect(perf).toContain('ROAS');
    // styling-neutral em instruction — must NOT mention a template-specific style.
    expect(perf).not.toMatch(/Fraunces/i);
    expect(perf).not.toMatch(/signature of Hearth/i);
  });
});

describe('firewall: assembled strategy never carries templateId', () => {
  const llmResponse: any = {
    awareness: 'search-aware-comparing',
    oneClient: { who: '', coreDesire: '', corePain: '', pains: [], desires: [], objections: [] },
    ourPosition: { promise: '', approach: '', credibility: '' },
    servicePresentation: { format: 'packages', showProcess: true, showCaseStudies: true },
    sectionDecisions: { includeTransformation: false, includeProblem: false, includeApproach: false, isHighTouch: false },
    uiblockDecisions: {},
  };

  it('templateId is consumed for selection but NOT written onto the output object', () => {
    const out = assembleServiceStrategy({ llmResponse, goal: 'book-call', assets: allAssets, templateId: 'surge' });
    // Surge sections present (selection saw templateId)…
    expect(out.sections).toContain('casestudies');
    // …but templateId must NOT ride on the object that the client posts to the copy route.
    expect(JSON.stringify(out)).not.toContain('templateId');
    expect((out as any).templateId).toBeUndefined();
  });
});
