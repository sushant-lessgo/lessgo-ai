// scale-05 phase 10 — ACCEPTANCE fixtures. Encodes the spec "Acceptance"
// criteria as tests that exercise the REAL pipeline functions end-to-end:
//   Brief.goal (composed via intentToBriefGoal / legacyGoalToBriefGoal)
//     → seedGoalForm / injectGoalSections / goalToDestination / normalizeCtas
//     → the shared published twins' static markup (renderToStaticMarkup).
// No hand-authored "expected content" bypasses the pipeline — every fixture is
// composed through the same functions the onboarding GeneratingSteps call.
//
// NB: this file imports edit twins only transitively via the published twins'
// plain-module cores; the published twins themselves import ONLY plain modules,
// so nothing here reaches a 'use client' file. (Tests aren't in the published
// path regardless.)

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

import { intentToBriefGoal, legacyGoalToBriefGoal, composeWhatsappDestination } from '@/modules/brief/bridge';
import { goalToDestination } from '@/modules/goals/goalToDestination';
import { seedGoalForm } from '@/modules/goals/seedGoalForm';
import { injectGoalSections } from '@/modules/goals/injectGoalSections';
import { goalCopyGuidance, getGuidanceForIntent } from '@/modules/goals/copyGuidance';
import { buildWhatsappPrefill } from '@/modules/goals/whatsappPrefill';
import { normalizeCtas } from '@/utils/normalizeCtas';

import FollowStripPublished from '@/modules/generatedLanding/sharedBlocks/FollowStrip/FollowStrip.published';
import StoreBadgesPublished from '@/modules/generatedLanding/sharedBlocks/StoreBadges/StoreBadges.published';
import LeadFormPublished from '@/modules/generatedLanding/sharedBlocks/LeadForm/LeadForm.published';

import type { Brief } from '@/types/brief';
import type { CTAButton } from '@/types/destination';

type BriefGoal = NonNullable<Brief['goal']>;

// ── Shared realistic fixtures ─────────────────────────────────────────────────
const INSTAGRAM_URL = 'https://instagram.com/some.writer';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.kathaworld.app';
const APPSTORE_URL = 'https://apps.apple.com/us/app/kathaworld/id1234567890';
const TRIAL_URL = 'https://app.example.com/signup';

/** A page shell (finalContent-shaped) with a header + hero + cta + footer. */
function makePage() {
  const sections = ['header-1', 'hero-abc12345', 'features-xyz', 'cta-def67890', 'footer-1'];
  const sectionLayouts: Record<string, string> = {
    'header-1': 'WarmNavHeader',
    'hero-abc12345': 'TerminalHero',
    'features-xyz': 'IconServiceCards',
    'cta-def67890': 'ArcCTA',
    'footer-1': 'ContactFooterRich',
  };
  const content: Record<string, any> = {
    'header-1': { id: 'header-1', elements: {} },
    'hero-abc12345': {
      id: 'hero-abc12345',
      layout: 'TerminalHero',
      elements: { headline: 'Hello', cta_text: 'Get started' },
      // Hero primary is a GOAL_REF. goal-ref-cta phase 1 made this TRUE at
      // generation time: stampGoalRefCtas (finalize.ts / finalizeMultiPageGeneration)
      // now writes exactly this `cta` on every primary (hero/header/cta), so
      // publish resolves the picked goal. This fixture mirrors that stamp.
      elementMetadata: { cta_text: { cta: { role: 'primary', dest: 'GOAL_REF' } as CTAButton } },
    },
    'features-xyz': { id: 'features-xyz', elements: {} },
    'cta-def67890': {
      id: 'cta-def67890',
      layout: 'ArcCTA',
      elements: { headline: 'Ready?', cta_text: 'Book a call' },
    },
    'footer-1': { id: 'footer-1', elements: {} },
  };
  return {
    layout: { sections, sectionLayouts },
    content,
  };
}

/** Resolve the hero GOAL_REF through the SAME pre-pass the published renderer
 *  runs, returning the down-converted buttonConfig for the hero primary. */
function resolveHeroCta(content: Record<string, any>, goal: BriefGoal, forms: Record<string, any>) {
  const out = normalizeCtas(content, { goal, forms });
  return out['hero-abc12345'].elementMetadata.cta_text.buttonConfig;
}

// ── Case 1 — writer / follow-social (M4) ──────────────────────────────────────
describe('acceptance: writer / follow-social', () => {
  // Compose the goal through the real writeback composer (M4 social).
  const goal = intentToBriefGoal('follow-social', { links: [INSTAGRAM_URL] });

  it('GOAL_REF resolves an Instagram social Destination', () => {
    const gd = goalToDestination(goal, { forms: {} });
    expect(gd?.dest).toEqual({ kind: 'social', platform: 'instagram', url: INSTAGRAM_URL });
  });

  it('injectGoalSections produces a followStrip section (after hero)', () => {
    const page = makePage();
    injectGoalSections(page.layout.sections, page.layout.sectionLayouts, page.content, goal);
    const id = page.layout.sections.find((s) => s.startsWith('followStrip-'));
    expect(id).toBeDefined();
    expect(page.layout.sections.indexOf(id!)).toBe(page.layout.sections.indexOf('hero-abc12345') + 1);
    expect(page.layout.sectionLayouts[id!]).toBe('SharedFollowStrip');
  });

  it('published FollowStrip markup carries data-lessgo-cta beacon on the Instagram anchor', () => {
    const page = makePage();
    injectGoalSections(page.layout.sections, page.layout.sectionLayouts, page.content, goal);
    const id = page.layout.sections.find((s) => s.startsWith('followStrip-'))!;
    const el = page.content[id].elements;

    const html = renderToStaticMarkup(
      React.createElement(FollowStripPublished, {
        sectionId: id,
        strip_heading: el.strip_heading,
        links_json: el.links_json,
      }),
    );
    expect(html).toContain(`href="${INSTAGRAM_URL}"`);
    expect(html).toContain('data-lessgo-cta');
    // The goal platform (first profile) is the primary conversion.
    expect(html).toContain('data-lessgo-cta-role="primary"');
  });
});

// ── Case 2 — kathaworld / download-app (M3, both stores) ──────────────────────
describe('acceptance: kathaworld / download-app', () => {
  // Phase-1-shaped param.links (both stores) → M3 external, links persisted.
  const goal = intentToBriefGoal('download-app', { links: [PLAY_URL, APPSTORE_URL] });

  it('writeback persists both store links verbatim (Phase-1 shape)', () => {
    expect(goal.mechanism).toBe('M3');
    expect(goal.param?.links).toEqual([PLAY_URL, APPSTORE_URL]);
  });

  it('injectGoalSections produces a storeBadges section', () => {
    const page = makePage();
    injectGoalSections(page.layout.sections, page.layout.sectionLayouts, page.content, goal);
    const id = page.layout.sections.find((s) => s.startsWith('storeBadges-'));
    expect(id).toBeDefined();
    expect(page.layout.sectionLayouts[id!]).toBe('SharedStoreBadges');
  });

  it('published StoreBadges markup has TWO badge hrefs (Play + App Store)', () => {
    const page = makePage();
    injectGoalSections(page.layout.sections, page.layout.sectionLayouts, page.content, goal);
    const id = page.layout.sections.find((s) => s.startsWith('storeBadges-'))!;
    const el = page.content[id].elements;

    const html = renderToStaticMarkup(
      React.createElement(StoreBadgesPublished, {
        sectionId: id,
        appstore_url: el.appstore_url,
        playstore_url: el.playstore_url,
        badge_label: el.badge_label,
      }),
    );
    expect(html).toContain(`href="${PLAY_URL}"`);
    expect(html).toContain(`href="${APPSTORE_URL}"`);
    expect(html.match(/class="lg-badge"/g)).toHaveLength(2);
  });
});

// ── Case 3 — saas / free-trial (M3 external, subtext guidance) ────────────────
describe('acceptance: saas / free-trial', () => {
  it('goalCopyGuidance yields a cta_subtext line (trial terms)', () => {
    expect(goalCopyGuidance['free-trial'].subtext).toBeTruthy();
    const block = getGuidanceForIntent('free-trial');
    expect(block).toContain('cta_subtext');
    expect(block).toContain(goalCopyGuidance['free-trial'].subtext!);
  });

  it('GOAL_REF resolves an external redirect', () => {
    const goal = intentToBriefGoal('free-trial', { url: TRIAL_URL });
    expect(goal.mechanism).toBe('M3');
    const gd = goalToDestination(goal, { forms: {} });
    expect(gd?.dest).toEqual({ kind: 'external', url: TRIAL_URL });

    // …and the published pre-pass down-converts the hero GOAL_REF to a link.
    const page = makePage();
    const bc = resolveHeroCta(page.content, goal, {});
    expect(bc).toEqual({ type: 'link', url: TRIAL_URL });
  });
});

// ── Case 4 — consultant / book-call (M1 form: RENDERS + SUBMITS) ──────────────
describe('acceptance: consultant / book-call', () => {
  // book-call primary mechanism is M1 (on-site form). Composed through the real
  // composer with no param → { intent, mechanism:'M1' }.
  const goal = intentToBriefGoal('book-call', {});

  function seededPage() {
    const page = makePage();
    seedGoalForm(page as any, goal);
    return page;
  }

  it('composer picks M1 for book-call', () => {
    expect(goal.mechanism).toBe('M1');
  });

  it('seedGoalForm writes the form to content.forms + injects a leadForm-<uuid> section', () => {
    const page = seededPage();
    const formIds = Object.keys((page as any).forms);
    expect(formIds).toHaveLength(1);
    const leadId = page.layout.sections.find((s) => s.startsWith('leadForm-'));
    expect(leadId).toBeDefined();
    expect(page.layout.sectionLayouts[leadId!]).toBe('SharedLeadForm');
    expect(page.content[leadId!].elements.form_id).toBe(formIds[0]);
  });

  it('CTA section is wired to the seeded form', () => {
    const page = seededPage();
    const formId = Object.keys((page as any).forms)[0];
    const cta = page.content['cta-def67890'];
    expect(cta.elements.cta_embed).toBe(`form:${formId}`);
    expect(cta.elementMetadata.cta_text.buttonConfig).toMatchObject({
      type: 'form',
      formId,
      behavior: 'scrollTo',
    });
  });

  it('hero GOAL_REF resolves the #form-section form anchor', () => {
    const page = seededPage();
    const forms = (page as any).forms;
    const formId = Object.keys(forms)[0];
    const bc = resolveHeroCta(page.content, goal, forms);
    // M1 → {type:'form', formId} (the resolver connects the first project form).
    expect(bc).toEqual({ type: 'form', formId });
  });

  it('published LeadForm renders <form data-lessgo-form data-form-id …> with the seeded fields inside #form-section', () => {
    const page = seededPage();
    const forms = (page as any).forms;
    const formId = Object.keys(forms)[0];
    const leadId = page.layout.sections.find((s) => s.startsWith('leadForm-'))!;
    const el = page.content[leadId].elements;

    const html = renderToStaticMarkup(
      React.createElement(LeadFormPublished, {
        sectionId: leadId,
        content: { forms },
        publishedPageId: 'page-1',
        pageOwnerId: 'owner-1',
        form_id: el.form_id,
        form_headline: el.form_headline,
      }),
    );

    // Real submitting form contract (not just an anchor).
    expect(html).toContain('data-lessgo-form');
    expect(html).toContain(`data-form-id="${formId}"`);
    expect(html).toContain('data-page-id="page-1"');
    // The owner's Clerk id must NEVER reach public HTML: the submit route derives
    // the owner from data-page-id. Re-adding data-owner-id = the forgery hole.
    expect(html).not.toContain('data-owner-id');
    // The scroll anchor the hero GOAL_REF + CTA scrollTo resolve to.
    expect(html).toContain('id="form-section"');
    // Seeded fields render (name=field.id = submission key) + a submit button.
    expect(html).toContain('name="name"');
    expect(html).toContain('name="email"');
    expect(html).toContain('type="submit"');
  });

  it('the embedded form handler posts submissions to /api/forms/submit', () => {
    // The published <form data-lessgo-form> is bound by form.v1.js (built from
    // this source), which POSTs to /api/forms/submit → FormSubmission + lead
    // email. The markup carries the contract; the endpoint lives in the handler.
    const handler = readFileSync(
      resolve(process.cwd(), 'src/lib/staticExport/formHandler.js'),
      'utf8',
    );
    expect(handler).toContain('/api/forms/submit');
    expect(handler).toContain('data-lessgo-form');
  });
});

// ── Case 5 — subscribe-newsletter (M1 OVERRIDE, most-reviewed invariant) ──────
describe('acceptance: subscribe-newsletter (M1 override, not vocab M4)', () => {
  // The frozen vocab says M4; the writeback OVERRIDES to M1 (design call #6).
  const goal = intentToBriefGoal('subscribe-newsletter', {});

  it('writeback stamps mechanism="M1" (override, NOT vocab M4)', () => {
    expect(goal.mechanism).toBe('M1');
    expect(goal.param).toBeUndefined();
    expect(goal.destination).toBeUndefined();
  });

  it('legacyGoalToBriefGoal(subscribe-newsletter) also stamps M1', () => {
    const viaLegacy = legacyGoalToBriefGoal('subscribe-newsletter', {});
    expect(viaLegacy.mechanism).toBe('M1');
  });

  it('seeds an email-capture form AND injects a leadForm section', () => {
    const page = makePage();
    seedGoalForm(page as any, goal);
    const forms = (page as any).forms;
    expect(Object.keys(forms)).toHaveLength(1);
    const form = Object.values(forms)[0] as any;
    const email = form.fields.find((f: any) => f.type === 'email');
    expect(email?.required).toBe(true);
    expect(page.layout.sections.some((s) => s.startsWith('leadForm-'))).toBe(true);
  });

  it('NO followStrip is injected (subscribe-newsletter is M1, not M4)', () => {
    const page = makePage();
    // Even a stray param.links must not trigger the M4 strip for this intent.
    injectGoalSections(
      page.layout.sections,
      page.layout.sectionLayouts,
      page.content,
      { intent: 'subscribe-newsletter', mechanism: 'M1', param: { links: [INSTAGRAM_URL] } } as BriefGoal,
    );
    expect(page.layout.sections.some((s) => s.startsWith('followStrip-'))).toBe(false);
  });

  it('published email-capture form renders + submits (same contract as book-call)', () => {
    const page = makePage();
    seedGoalForm(page as any, goal);
    const forms = (page as any).forms;
    const formId = Object.keys(forms)[0];
    const leadId = page.layout.sections.find((s) => s.startsWith('leadForm-'))!;
    const el = page.content[leadId].elements;

    const html = renderToStaticMarkup(
      React.createElement(LeadFormPublished, {
        sectionId: leadId,
        content: { forms },
        publishedPageId: 'page-1',
        pageOwnerId: 'owner-1',
        form_id: el.form_id,
        form_headline: el.form_headline,
      }),
    );
    expect(html).toContain('data-lessgo-form');
    expect(html).toContain(`data-form-id="${formId}"`);
    expect(html).toContain('id="form-section"');
    expect(html).toContain('name="email"');
    expect(html).toContain('type="submit"');
  });

  it('hero GOAL_REF resolves #form-section (M1 form anchor)', () => {
    const page = makePage();
    seedGoalForm(page as any, goal);
    const forms = (page as any).forms;
    const formId = Object.keys(forms)[0];
    const bc = resolveHeroCta(page.content, goal, forms);
    expect(bc).toEqual({ type: 'form', formId });
  });
});

// ── Case 6 — WhatsApp goal (M2 deterministic prefill) ─────────────────────────
describe('acceptance: whatsapp goal — exact deterministic prefill', () => {
  const facts = { businessName: 'Acme Studio', offer: 'a free consultation' };
  // enquiry allows M2; a phone + facts materializes the prefill at writeback.
  const goal = intentToBriefGoal('enquiry', { phone: '+91 98765 43210' }, facts);
  const expectedMsg = 'Hi Acme Studio, I found your website — interested in a free consultation';

  it('materializes the EXACT deterministic prefill string (no AI)', () => {
    expect(buildWhatsappPrefill(facts)).toBe(expectedMsg);
    expect(goal.mechanism).toBe('M2');
    expect(goal.param?.message).toBe(expectedMsg);
  });

  it('resolved href is wa.me/<digits>?text=<encoded exact message>', () => {
    const expectedHref = composeWhatsappDestination('919876543210', expectedMsg);
    expect(goal.destination).toBe(expectedHref);
    expect(expectedHref).toBe(`https://wa.me/919876543210?text=${encodeURIComponent(expectedMsg)}`);

    // The published pre-pass down-converts the hero GOAL_REF to the same href
    // (round-trips the exact message verbatim).
    const page = makePage();
    const bc = resolveHeroCta(page.content, goal, {});
    expect(bc).toEqual({ type: 'link', url: expectedHref });
    expect(bc.url).toContain(encodeURIComponent(expectedMsg));
  });
});
