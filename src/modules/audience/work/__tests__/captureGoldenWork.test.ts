// @vitest-environment node
// src/modules/audience/work/__tests__/captureGoldenWork.test.ts
// ============================================================================
// (Runs in the NODE environment, not jsdom: the OpenAI client refuses to
// instantiate in a browser-like env — this test does no DOM work and needs a
// real Node context to reach the live provider during CAPTURE=1.)
// ============================================================================
// WORK COPY ENGINE — Kundius HOME golden capture (plan phase 4, the pilot).
//
// OPT-IN — the real-LLM capture is skipped unless CAPTURE=1:
//
//   CAPTURE=1 npx vitest run captureGoldenWork    # founder-authorized only
//
// When CAPTURE=1 it runs the engine end-to-end for the HOME page ONLY off the
// Kundius fixture:
//   1. assembleWorkStructure(facts)        — DETERMINISTIC slim strategy (no AI)
//   2. buildWorkStrategyPrompt → the ONE small AI strategy call → assembleWorkStrategy
//   3. buildWorkCopyPrompt (HOME) → the AI copy call → parseWorkCopy
// then writes a golden artifact for the founder to READ:
//   • goldens/kundius.home.json      — strategy JSON + parsed HOME copy JSON
//   • goldens/kundius.home.read.txt  — human-readable rendered-strings dump
//
// It hits the live model / costs credits — that is why it is gated. The artifact
// is NOT committed yet: it awaits (a) the founder's REAL Kundius facts replacing
// the fixture placeholders and (b) capture authorization (plan phase-4 gate).
//
// Without CAPTURE=1 only the always-on FIXTURE SANITY checks run — no network,
// no cost — so `npm run test:run` stays green with the capture SKIPPED.
//
// NOTE: @/lib/aiClient instantiates the OpenAI client at module load and throws
// without OPENAI_API_KEY, so it is dynamic-imported INSIDE the capture test — a
// normal (no-key) run never loads it.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';

// Load secrets the same way the app does (build/runtime read .env.local).
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { derivePricePosition } from '@/modules/audience/work/pricePosition';
import {
  assembleWorkStructure,
  DEFAULT_ESTABLISHMENT,
} from '@/modules/audience/work/slimStrategy';
import {
  selectWorkVoice,
  formatWorkVoiceForPrompt,
  resolveWorkProfession,
  type Establishment,
} from '@/modules/audience/work/voice';
import { professionWording } from '@/modules/engines/workVocabulary';
import { buildWorkStrategyPrompt } from '@/modules/audience/work/strategy/promptsWork';
import {
  assembleWorkStrategy,
  type WorkStrategyOutput,
} from '@/modules/audience/work/strategy/parseStrategyWork';
import { WorkStrategyResponseSchema } from '@/lib/schemas/workStrategy.schema';
import {
  buildWorkCopyPrompt,
  type WorkCopyPage,
} from '@/modules/audience/work/copyPrompt';
import { CopyResponseSchema } from '@/lib/schemas/copy.schema';
import {
  parseWorkCopy,
  validateWorkCopyCompleteness,
} from '@/modules/audience/work/parseCopy';
import type { SectionCopy } from '@/types/generation';
import {
  kundiusWorkFacts,
  kundiusProfessionRow,
  kundiusAboutHarvest,
} from './fixtures/kundiusBrief';

const OUT_DIR = path.resolve(__dirname, 'goldens');

// ─────────────────────────────────────────────────────────────────────────────
// Rendered-strings dump — the human-readable artifact the founder READS at the
// gate. Pulls the load-bearing lines out of the parsed HOME copy + strategy.
// ─────────────────────────────────────────────────────────────────────────────

function el(
  sections: Record<string, SectionCopy>,
  section: string,
  key: string
): string {
  const v = (sections[section]?.elements as Record<string, unknown> | undefined)?.[key];
  return typeof v === 'string' ? v : '';
}

function coll(
  sections: Record<string, SectionCopy>,
  section: string,
  key: string
): Array<Record<string, unknown>> {
  const v = (sections[section]?.elements as Record<string, unknown> | undefined)?.[key];
  return Array.isArray(v) ? (v as Array<Record<string, unknown>>) : [];
}

function line(label: string, value: string): string {
  return `${label}: ${value || '(empty)'}`;
}

/** Build the founder-facing rendered-strings dump. */
function renderStringsDump(
  strategy: WorkStrategyOutput,
  sections: Record<string, SectionCopy>
): string {
  const out: string[] = [];
  out.push('KUNDIUS — WORK COPY ENGINE — HOME GOLDEN (founder read)');
  out.push('*** REAL KUNDIUS FACTS (phase-4 gate 2026-07-14) — establishment "in-between"→established, event price €100/hr→exact 100 (per-hour in name) ***');
  out.push('');

  out.push('== PER-PAGE ONE-LINER / POSITIONING ==');
  out.push(line('Positioning angle', strategy.positioningAngle));
  out.push(line('Story angle', strategy.storyAngle));
  out.push(line('Voice notes', strategy.voiceNotes.join(' | ')));
  out.push(line('Archetype', strategy.archetype));
  out.push(line('Home sections', strategy.sections.join(', ')));
  out.push('');

  out.push('== PROMISE LINE (hero) ==');
  out.push(line('Eyebrow', el(sections, 'hero', 'eyebrow')));
  out.push(line('Heading', el(sections, 'hero', 'heading')));
  out.push(line('Lead', el(sections, 'hero', 'lead')));
  out.push(line('CTA', el(sections, 'hero', 'cta_label')));
  out.push('');

  out.push('== GALLERY INTROS / CAPTIONS (work) ==');
  out.push(line('Eyebrow', el(sections, 'work', 'eyebrow')));
  out.push(line('Heading', el(sections, 'work', 'heading')));
  out.push(line('Lead', el(sections, 'work', 'lead')));
  for (const g of coll(sections, 'work', 'groups')) {
    out.push(`  - card: ${String(g.name ?? '')}`);
  }
  out.push('');

  out.push('== STORY (about) ==');
  out.push(line('Eyebrow', el(sections, 'about', 'eyebrow')));
  out.push(line('Heading', el(sections, 'about', 'heading')));
  out.push(line('Bio', el(sections, 'about', 'bio')));
  out.push('');

  out.push('== PRICES FRAMING (packages) ==');
  out.push(line('Eyebrow', el(sections, 'packages', 'eyebrow')));
  out.push(line('Heading', el(sections, 'packages', 'heading')));
  for (const p of coll(sections, 'packages', 'packages')) {
    out.push(
      `  - ${String(p.name ?? '')} — ${String(p.price_line ?? '')} — ${String(p.description ?? '')}`
    );
  }
  out.push('');

  out.push('== PROOF / PRAISE (proof) ==');
  out.push(line('Eyebrow', el(sections, 'proof', 'eyebrow')));
  out.push(line('Heading', el(sections, 'proof', 'heading')));
  out.push(line('Awards line', el(sections, 'proof', 'awards_line')));
  for (const q of coll(sections, 'proof', 'quotes')) {
    out.push(`  - "${String(q.text ?? '')}"${q.source ? ` — ${String(q.source)}` : ''}`);
  }
  out.push('');

  out.push('== CONTACT NUDGE (contact) ==');
  out.push(line('Eyebrow', el(sections, 'contact', 'eyebrow')));
  out.push(line('Heading', el(sections, 'contact', 'heading')));
  out.push(line('Note', el(sections, 'contact', 'note')));
  out.push(line('CTA', el(sections, 'contact', 'cta_label')));
  out.push('');

  out.push('== ALL SECTIONS (raw string dump) ==');
  for (const [name, copy] of Object.entries(sections)) {
    out.push(`--- ${name} ---`);
    for (const [k, v] of Object.entries(copy?.elements ?? {})) {
      if (typeof v === 'string' && v.trim()) out.push(`  ${k}: ${v}`);
    }
  }

  return out.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// ALWAYS-ON fixture sanity — no network. Proves the fixture keeps satisfying the
// phase-1 premium rubric and assembles a deterministic HOME structure, so the
// harness is wired correctly even without a capture run.
// ─────────────────────────────────────────────────────────────────────────────

describe('Kundius fixture sanity (no LLM)', () => {
  it('derives a deterministic price position from the real fixture', () => {
    // Real Kundius pricing is €100–500 with no premium/friendly keywords and
    // empty praise → the rubric nets to `'middle'`. Assert the ACTUAL derived
    // value (do NOT force `'premium'`) and that it is deterministic.
    const pos = derivePricePosition(kundiusWorkFacts);
    expect(pos).toBe('middle');
    expect(derivePricePosition(kundiusWorkFacts)).toBe(pos); // deterministic
  });

  it('assembles a deterministic HOME structure with facts-backed sections', () => {
    const s1 = assembleWorkStructure(kundiusWorkFacts, kundiusProfessionRow);
    const s2 = assembleWorkStructure(kundiusWorkFacts, kundiusProfessionRow);
    expect(s1).toEqual(s2); // deterministic
    expect(s1.pages.length).toBeGreaterThan(0);
    expect(s1.storyBranch).toBe('established');
    expect(s1.primaryLanguage).toBe('en');
    // Curated lead order surfaces the cover-photo groups.
    expect(s1.leadGroups.length).toBe(kundiusWorkFacts.groups!.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAPTURE — the real-LLM HOME golden. Founder-authorized only (CAPTURE=1).
// ─────────────────────────────────────────────────────────────────────────────

describe.skipIf(process.env.CAPTURE !== '1')(
  'CAPTURE real-LLM Kundius HOME golden',
  () => {
    it('slim strategy → strategy call → HOME copy → goldens/kundius.home.*', async () => {
      const facts = kundiusWorkFacts;
      const professionRow = kundiusProfessionRow;

      // 1. Deterministic slim strategy (no AI) + derived voice.
      const structure = assembleWorkStructure(facts, professionRow);
      const pricePosition = derivePricePosition(facts);
      const establishment: Establishment =
        facts.establishment ?? DEFAULT_ESTABLISHMENT;
      const profession = resolveWorkProfession(professionRow.key);
      const voice = selectWorkVoice({ professionRow, pricePosition, establishment });

      // 2. The ONE small AI strategy call → assemble WorkStrategyOutput.
      const strategyPrompt = buildWorkStrategyPrompt({
        businessName: facts.identity?.name,
        profession,
        workNoun: professionWording[profession].workGroup,
        pricePosition,
        establishment,
        dreamClient: facts.dreamClient,
        praise: facts.praise ?? [],
        groupNames: (facts.groups ?? []).map((g) => g.name),
        primaryLanguage: facts.languages?.[0] ?? 'en',
        voiceBlock: formatWorkVoiceForPrompt(voice),
      });

      const { generateWithSchema, generateRawJson } = await import('@/lib/aiClient');

      const llmResponse = await generateWithSchema(
        'work-strategy',
        [{ role: 'user', content: strategyPrompt }],
        WorkStrategyResponseSchema,
        'workStrategy'
      );
      const strategy = assembleWorkStrategy({
        llmResponse,
        facts,
        professionRow,
        structure,
      });

      // 3. HOME copy — chrome-inclusive home sections (matches the route default).
      const home = strategy.sitemap[0];
      const homePage: WorkCopyPage = {
        archetypeKey: home?.archetypeKey ?? 'home',
        title: home?.title ?? 'Home',
        pathSlug: home?.pathSlug ?? '/',
        isHome: true,
        sections: strategy.sections,
      };

      // About-text harvest travels as a tone-only SiteContext reference (no
      // WorkFacts slot; never copied verbatim, never a source of new claims).
      const siteContextBlock = `## EXISTING-SITE TONE REFERENCE (voice only — do NOT copy verbatim, do NOT lift claims)\n${kundiusAboutHarvest}`;

      const copyPrompt = buildWorkCopyPrompt({
        strategy,
        page: homePage,
        facts,
        voice,
        siteContextBlock,
      });

      const raw = (await generateRawJson(
        'work-copy',
        copyPrompt,
        CopyResponseSchema
      )) as Record<string, SectionCopy>;

      const pageUiblocks: Record<string, string> = {};
      for (const section of homePage.sections) pageUiblocks[section] = section;

      const homeCopy = parseWorkCopy(raw, pageUiblocks, facts.praise);
      const { complete, missingSections } = validateWorkCopyCompleteness(
        homeCopy,
        pageUiblocks
      );

      // Write the golden artifact + the founder-facing rendered-strings dump.
      fs.mkdirSync(OUT_DIR, { recursive: true });
      const jsonFile = path.join(OUT_DIR, 'kundius.home.json');
      const txtFile = path.join(OUT_DIR, 'kundius.home.read.txt');
      fs.writeFileSync(
        jsonFile,
        JSON.stringify(
          {
            fixture: 'REAL KUNDIUS FACTS (phase-4 gate 2026-07-14); establishment mapped in-between→established, event €100/hr→exact 100 (per-hour in name)',
            capturedAt: new Date().toISOString(),
            meta: { complete, missingSections },
            strategy,
            homeCopy,
          },
          null,
          2
        )
      );
      fs.writeFileSync(txtFile, renderStringsDump(strategy, homeCopy));

      // eslint-disable-next-line no-console
      console.log(`[capture] wrote ${jsonFile} + ${txtFile} (complete=${complete})`);

      expect(Object.keys(homeCopy).length).toBeGreaterThan(0);
    }, 180_000);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// CAPTURE — the FULL-SITE golden (work-copy-engine phase 5, AC-1). Iterates ALL
// standard-archetype sitemap pages, generate-copy per page, and writes
// goldens/kundius.full.json + a readable dump. Founder-authorized only (CAPTURE=1).
// ─────────────────────────────────────────────────────────────────────────────

describe.skipIf(process.env.CAPTURE !== '1')(
  'CAPTURE real-LLM Kundius FULL-SITE golden',
  () => {
    it('slim strategy → strategy call → per-page copy (all pages) → goldens/kundius.full.*', async () => {
      const facts = kundiusWorkFacts;
      const professionRow = kundiusProfessionRow;

      // 1. Deterministic slim strategy (no AI) + derived voice.
      const structure = assembleWorkStructure(facts, professionRow);
      const pricePosition = derivePricePosition(facts);
      const establishment: Establishment =
        facts.establishment ?? DEFAULT_ESTABLISHMENT;
      const profession = resolveWorkProfession(professionRow.key);
      const voice = selectWorkVoice({ professionRow, pricePosition, establishment });

      // 2. The ONE small AI strategy call → assemble WorkStrategyOutput.
      const strategyPrompt = buildWorkStrategyPrompt({
        businessName: facts.identity?.name,
        profession,
        workNoun: professionWording[profession].workGroup,
        pricePosition,
        establishment,
        dreamClient: facts.dreamClient,
        praise: facts.praise ?? [],
        groupNames: (facts.groups ?? []).map((g) => g.name),
        primaryLanguage: facts.languages?.[0] ?? 'en',
        voiceBlock: formatWorkVoiceForPrompt(voice),
      });

      const { generateWithSchema, generateRawJson } = await import('@/lib/aiClient');

      const llmResponse = await generateWithSchema(
        'work-strategy',
        [{ role: 'user', content: strategyPrompt }],
        WorkStrategyResponseSchema,
        'workStrategy'
      );
      const strategy = assembleWorkStrategy({
        llmResponse,
        facts,
        professionRow,
        structure,
      });

      // About-text harvest travels as a tone-only SiteContext reference.
      const siteContextBlock = `## EXISTING-SITE TONE REFERENCE (voice only — do NOT copy verbatim, do NOT lift claims)\n${kundiusAboutHarvest}`;

      // 3. Fan out over EVERY sitemap page (mirrors runWorkLLMGeneration): home is
      //    chrome-inclusive (strategy.sections); inner pages are body-only.
      const pageCopies: Record<
        string,
        { page: WorkCopyPage; copy: Record<string, SectionCopy>; complete: boolean; missingSections: string[] }
      > = {};
      for (let i = 0; i < strategy.sitemap.length; i++) {
        const sp = strategy.sitemap[i];
        const isHome = sp.pathSlug === '/';
        const pageSections = isHome
          ? strategy.sections
          : ['header', ...sp.sections, 'footer'];
        const workPage: WorkCopyPage = {
          archetypeKey: sp.archetypeKey,
          title: sp.title,
          pathSlug: sp.pathSlug,
          isHome,
          sections: pageSections,
        };
        const copyPrompt = buildWorkCopyPrompt({
          strategy,
          page: workPage,
          facts,
          voice,
          siteContextBlock,
        });
        const raw = (await generateRawJson(
          'work-copy',
          copyPrompt,
          CopyResponseSchema
        )) as Record<string, SectionCopy>;
        const pageUiblocks: Record<string, string> = {};
        for (const section of pageSections) pageUiblocks[section] = section;
        const copy = parseWorkCopy(raw, pageUiblocks, facts.praise);
        const { complete, missingSections } = validateWorkCopyCompleteness(
          copy,
          pageUiblocks
        );
        pageCopies[sp.archetypeKey] = { page: workPage, copy, complete, missingSections };
      }

      // 4. Write the full-site golden + a readable per-page dump.
      fs.mkdirSync(OUT_DIR, { recursive: true });
      const jsonFile = path.join(OUT_DIR, 'kundius.full.json');
      const txtFile = path.join(OUT_DIR, 'kundius.full.read.txt');
      fs.writeFileSync(
        jsonFile,
        JSON.stringify(
          {
            fixture: 'REAL KUNDIUS FACTS (phase-4 gate 2026-07-14) — full-site fan-out (phase 5, AC-1)',
            capturedAt: new Date().toISOString(),
            archetype: strategy.archetype,
            strategy,
            pages: pageCopies,
          },
          null,
          2
        )
      );

      const dump: string[] = [];
      dump.push('KUNDIUS — WORK COPY ENGINE — FULL-SITE GOLDEN (founder read)');
      dump.push(`archetype: ${strategy.archetype}`);
      dump.push('');
      for (const [key, entry] of Object.entries(pageCopies)) {
        dump.push(`########## PAGE: ${entry.page.title} (${entry.page.pathSlug}) [${key}] ##########`);
        dump.push(`  complete=${entry.complete} missing=${entry.missingSections.join(',') || '(none)'}`);
        dump.push(renderStringsDump(strategy, entry.copy));
        dump.push('');
      }
      fs.writeFileSync(txtFile, dump.join('\n'));

      // eslint-disable-next-line no-console
      console.log(
        `[capture] wrote ${jsonFile} + ${txtFile} — ${Object.keys(pageCopies).length} pages`
      );

      // Every page filled at least one section (AC-1 lean full site).
      for (const entry of Object.values(pageCopies)) {
        expect(Object.keys(entry.copy).length).toBeGreaterThan(0);
      }
    }, 300_000);
  }
);
