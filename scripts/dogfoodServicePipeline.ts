// scripts/dogfoodServicePipeline.ts
// Phase 6 dogfood harness. Runs N agency-flavored sample inputs through the full
// service pipeline (strategy → copy → fallback → completeness) and dumps each
// result to dogfoodOutput/{slug}.json. Aggregates per-field italic-<em> emit
// metrics + forbidden-word leak counts in a printed report.
//
// Mocks have <em> pre-baked → useless for measuring emit rate. Real LLM is the
// intended mode. Mock mode (NEXT_PUBLIC_USE_MOCK_GPT=true) only smoke-tests
// pipeline plumbing.
//
// Usage:
//   NEXT_PUBLIC_USE_MOCK_GPT=true npx tsx scripts/dogfoodServicePipeline.ts
//   npx tsx scripts/dogfoodServicePipeline.ts                 # real LLM, all personas once
//   npx tsx scripts/dogfoodServicePipeline.ts --persona=skincare   # single persona
//   npx tsx scripts/dogfoodServicePipeline.ts --persona=skincare --awareness=referral-driven --goal=request-quote
//
// Phase 8 case matrices (--matrix takes precedence; forceAwareness drives section
// routing + copy emotional context deterministically):
//   --matrix=awareness           # 3 personas × 4 awareness × book-call   = 12
//   --matrix=goal                # 2 personas × 3 goals × inferred aware   = 6
//   --matrix=smell               # 2 personas × {cold, relationship}       = 4  (prints copy diff)
//   --matrix=comparing-baseline  # 3 personas × forced comparing × book    = 3  (regression gate)

import { config as dotenvConfig } from 'dotenv';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Load env files. dotenv default: do NOT override existing process.env, so
// shell-set vars (e.g. NEXT_PUBLIC_USE_MOCK_GPT=true npx tsx ...) always win.
// .env.local fills in only what's missing — typically OPENAI_API_KEY.
dotenvConfig({ path: join(process.cwd(), '.env.local') });
dotenvConfig({ path: join(process.cwd(), '.env') });

import { buildServiceStrategyPrompt } from '../src/modules/audience/service/strategy/promptsService';
import { assembleServiceStrategy } from '../src/modules/audience/service/strategy/parseStrategyService';
import { buildServiceCopyPrompt } from '../src/modules/audience/service/copyPrompt';
import { selectServiceSections } from '../src/modules/audience/service/sectionSelection';
import { selectServiceUIBlocks } from '../src/modules/audience/service/selectUIBlocks';
import {
  processServiceCopy,
  validateServiceCopyCompleteness,
} from '../src/modules/audience/service/parseCopy';
import {
  generateMockServiceStrategy,
  generateMockServiceCopy,
} from '../src/modules/prompt/mockResponseGeneratorService';
import { SERVICE_VOICE } from '../src/modules/audience/service/voice';
import { serviceAwarenessStates } from '../src/types/service';
import type {
  ServiceUnderstandingInput,
  ServiceAssetInput,
  ServiceGoal,
  ServiceAwareness,
  ServiceStrategyOutputAssembled,
} from '../src/types/service';
import type { SectionCopy } from '../src/types/generation';

// Pilot-validated baseline order for search-aware-comparing (regression gate).
const COMPARING_BASELINE_ORDER = ['header', 'hero', 'services', 'testimonials', 'packages', 'cta', 'footer'];

// ---------- Sample inputs ----------

interface DogfoodPersona {
  slug: string;
  label: string;
  oneLiner: string;
  understanding: ServiceUnderstandingInput;
  goal: ServiceGoal;
  offer: string;
  assets: ServiceAssetInput;
}

const PERSONAS: DogfoodPersona[] = [
  {
    slug: 'skincare',
    label: 'DTC skincare branding studio',
    oneLiner: 'Boutique branding studio for direct-to-consumer skincare brands.',
    understanding: {
      serviceType: 'agency',
      serviceCategories: ['Branding', 'Packaging Design'],
      industries: ['Skincare', 'Beauty', 'DTC'],
      targetClients: 'Founders launching DTC skincare brands at $300k–$2M ARR',
      services: ['Brand identity', 'Packaging design', 'Web design'],
      deliveryModel: 'remote',
    },
    goal: 'book-call',
    offer: 'Free 30-min brand audit, no obligation',
    assets: {
      hasTestimonials: true,
      hasClientLogos: true,
      hasOutcomes: false,
      hasCaseStudies: true,
      hasTeamPhotos: false,
      hasFounderPhoto: true,
      testimonialType: 'text',
    },
  },
  {
    slug: 'saas-landing',
    label: 'B2B SaaS landing-page agency',
    oneLiner: 'Conversion-focused landing page agency for B2B SaaS companies.',
    understanding: {
      serviceType: 'agency',
      serviceCategories: ['Conversion Design', 'Web Development'],
      industries: ['SaaS', 'B2B Tech', 'DevTools'],
      targetClients: 'Series A–B SaaS marketing leads owning the website',
      services: ['Landing page design', 'CRO audits', 'Webflow build'],
      deliveryModel: 'remote',
    },
    goal: 'book-call',
    offer: 'Free homepage teardown video',
    assets: {
      hasTestimonials: true,
      hasClientLogos: true,
      hasOutcomes: true,
      hasCaseStudies: true,
      hasTeamPhotos: false,
      hasFounderPhoto: true,
      testimonialType: 'text',
    },
  },
  {
    slug: 'restaurant-marketing',
    label: 'Local digital marketing agency for restaurants',
    oneLiner: 'Local marketing agency helping independent restaurants fill seats midweek.',
    understanding: {
      serviceType: 'agency',
      serviceCategories: ['Local SEO', 'Social Media', 'Paid Ads'],
      industries: ['Food', 'Restaurants', 'Hospitality'],
      targetClients: 'Owner-operators of independent restaurants in major US metros',
      services: ['Google Business optimization', 'Instagram content', 'Geo-targeted ads'],
      deliveryModel: 'hybrid',
    },
    goal: 'book-call',
    offer: 'Free local SEO audit + 3 quick wins',
    assets: {
      hasTestimonials: true,
      hasClientLogos: false,
      hasOutcomes: true,
      hasCaseStudies: false,
      hasTeamPhotos: true,
      hasFounderPhoto: true,
      testimonialType: 'text',
    },
  },
  {
    slug: 'law-firm-web',
    label: 'Specialist law-firm web design agency',
    oneLiner: 'Web design agency exclusively for boutique law firms.',
    understanding: {
      serviceType: 'agency',
      serviceCategories: ['Web Design', 'Compliance Copy'],
      industries: ['Legal', 'Professional Services'],
      targetClients: 'Managing partners of 5–25 attorney firms in the US',
      services: ['Firm website design', 'Practice area copy', 'Hosting & maintenance'],
      deliveryModel: 'remote',
    },
    goal: 'book-call',
    offer: 'Free firm-website teardown call',
    assets: {
      hasTestimonials: true,
      hasClientLogos: true,
      hasOutcomes: false,
      hasCaseStudies: true,
      hasTeamPhotos: false,
      hasFounderPhoto: true,
      testimonialType: 'text',
    },
  },
  {
    slug: 'wellness-ux',
    label: 'Wellness clinic UX consultancy',
    oneLiner: 'UX consultancy for wellness clinics turning website visitors into booked appointments.',
    understanding: {
      serviceType: 'agency',
      serviceCategories: ['UX Research', 'Booking Flow Design'],
      industries: ['Wellness', 'Health', 'Therapy'],
      targetClients: 'Multi-location wellness clinic owners and clinical leads',
      services: ['UX audit', 'Booking flow redesign', 'Patient research'],
      deliveryModel: 'remote',
    },
    goal: 'book-call',
    offer: 'Free 20-min booking-flow review',
    assets: {
      hasTestimonials: false,
      hasClientLogos: false,
      hasOutcomes: false,
      hasCaseStudies: false,
      hasTeamPhotos: false,
      hasFounderPhoto: true,
      testimonialType: null,
    },
  },
  // Phase 8: consultant + coach personas (newly unlocked) for the case matrix.
  {
    slug: 'ops-consultant',
    label: 'Operations consultant for scaling startups',
    oneLiner: 'Independent operations consultant helping seed-to-Series-B startups fix their internal chaos.',
    understanding: {
      serviceType: 'consultancy',
      serviceCategories: ['Operations', 'Process Design'],
      industries: ['Startups', 'Tech', 'SaaS'],
      targetClients: 'Founders and COOs of 10–80 person startups feeling operational drag',
      services: ['Ops diagnostic', 'Process redesign', 'Tooling & systems setup'],
      deliveryModel: 'remote',
    },
    goal: 'book-call',
    offer: 'Free 45-min operations diagnostic call',
    assets: {
      hasTestimonials: true,
      hasClientLogos: false,
      hasOutcomes: false,
      hasCaseStudies: true,
      hasTeamPhotos: false,
      hasFounderPhoto: true,
      testimonialType: 'text',
    },
  },
  {
    slug: 'exec-coach',
    label: 'Executive leadership coach',
    oneLiner: 'Leadership coach for newly-promoted engineering managers stepping into their first director role.',
    understanding: {
      serviceType: 'coaching',
      serviceCategories: ['Leadership Coaching', 'Career Strategy'],
      industries: ['Tech', 'Engineering Leadership'],
      targetClients: 'First-time directors and senior managers at growth-stage tech companies',
      services: ['1:1 coaching engagements', 'Leadership intensives', '360 feedback debriefs'],
      deliveryModel: 'remote',
    },
    goal: 'book-call',
    offer: 'Free 30-min leadership clarity session',
    assets: {
      hasTestimonials: true,
      hasClientLogos: false,
      hasOutcomes: false,
      hasCaseStudies: false,
      hasTeamPhotos: false,
      hasFounderPhoto: true,
      testimonialType: 'text',
    },
  },
];

// Representative persona per active persona-type, for the case matrices.
const MATRIX_AGENCY = 'skincare';
const MATRIX_CONSULTANT = 'ops-consultant';
const MATRIX_COACH = 'exec-coach';

// ---------- Metrics ----------

const ACCENT_FIELDS = ['headline', 'lede'] as const;
type AccentField = (typeof ACCENT_FIELDS)[number];

interface PerSectionAccentMetric {
  sectionType: string;
  field: AccentField;
  llmEmitted: boolean;
  finalValue: string;
}

interface PersonaMetrics {
  slug: string;
  label: string;
  caseLabel: string;
  awareness: string;
  goal: string;
  sectionOrder: string[];
  schemaValid: boolean;
  copyComplete: boolean;
  missingSections: string[];
  accentFields: PerSectionAccentMetric[];
  forbiddenWordHits: { word: string; sectionType: string; field: string; value: string }[];
  credibilityFlag: string | null;
}

function hasEm(value: unknown): boolean {
  return typeof value === 'string' && /<em\b/i.test(value);
}

/**
 * Phase 8 (Phase 6 backlog): flag credibility numbers the LLM invented — any
 * digit-run in ourPosition.credibility that doesn't appear in the provider input.
 */
function detectCredibilityHallucination(
  strategy: ServiceStrategyOutputAssembled,
  persona: DogfoodPersona
): string | null {
  const cred = strategy.ourPosition?.credibility ?? '';
  const nums = cred.match(/\d+/g);
  if (!nums) return null;
  const corpus = [
    persona.oneLiner,
    persona.offer,
    persona.understanding.targetClients,
    ...persona.understanding.serviceCategories,
    ...persona.understanding.industries,
    ...persona.understanding.services,
  ]
    .join(' ')
    .toLowerCase();
  const invented = nums.filter((n) => !corpus.includes(n));
  return invented.length ? `"${cred}" (invented numbers: ${invented.join(', ')})` : null;
}

/**
 * Walk raw LLM copy (BEFORE fallback runs) and record whether <em> was present
 * on each accent field. Compare against post-fallback to detect what fallback
 * had to backfill.
 */
function measureAccentFields(
  rawCopy: Record<string, SectionCopy>,
  uiblocks: Record<string, string>
): PerSectionAccentMetric[] {
  const out: PerSectionAccentMetric[] = [];
  for (const sectionType of Object.keys(uiblocks)) {
    const elements = (rawCopy[sectionType]?.elements ?? {}) as Record<string, unknown>;
    for (const field of ACCENT_FIELDS) {
      if (!(field in elements)) continue;
      const v = elements[field];
      out.push({
        sectionType,
        field,
        llmEmitted: hasEm(v),
        finalValue: typeof v === 'string' ? v : '',
      });
    }
  }
  return out;
}

function detectForbiddenWords(
  copy: Record<string, SectionCopy>
): { word: string; sectionType: string; field: string; value: string }[] {
  const hits: { word: string; sectionType: string; field: string; value: string }[] = [];
  const forbidden = SERVICE_VOICE.lexicon.forbidden;

  for (const [sectionType, section] of Object.entries(copy)) {
    const elements = section.elements ?? {};
    for (const [field, value] of Object.entries(elements)) {
      if (typeof value !== 'string') continue;
      const lower = value.toLowerCase();
      for (const word of forbidden) {
        const re = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
        if (re.test(lower)) {
          hits.push({ word, sectionType, field, value });
        }
      }
    }
  }
  return hits;
}

// ---------- Pipeline ----------

interface RunOpts {
  forceAwareness?: ServiceAwareness;
  goalOverride?: ServiceGoal;
  caseLabel?: string;
}

async function runPersona(
  persona: DogfoodPersona,
  useMocks: boolean,
  opts: RunOpts = {}
): Promise<{ metrics: PersonaMetrics; assembled: ServiceStrategyOutputAssembled; copy: Record<string, SectionCopy> } | null> {
  const goal = opts.goalOverride ?? persona.goal;
  const caseLabel =
    opts.caseLabel ??
    `${persona.slug}${opts.forceAwareness ? ` · ${opts.forceAwareness}` : ''}${
      opts.goalOverride ? ` · ${goal}` : ''
    }`;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Running: ${caseLabel} — ${persona.label}`);
  console.log('─'.repeat(60));

  // ----- Strategy -----
  let assembledStrategy: ServiceStrategyOutputAssembled;
  let schemaValid = true;
  try {
    if (useMocks) {
      assembledStrategy = generateMockServiceStrategy({
        oneLiner: persona.oneLiner,
        understanding: persona.understanding,
        goal,
        offer: persona.offer,
        assets: persona.assets,
      });
      // Mocks ignore awareness routing — apply the override deterministically.
      if (opts.forceAwareness) {
        assembledStrategy.awareness = opts.forceAwareness;
        assembledStrategy.sections = selectServiceSections({
          awareness: opts.forceAwareness,
          goal,
          assets: persona.assets,
          format: assembledStrategy.servicePresentation.format,
        });
        assembledStrategy.uiblocks = selectServiceUIBlocks({
          sections: assembledStrategy.sections,
        }).uiblocks;
      }
    } else {
      const { generateWithSchema } = await import('../src/lib/aiClient');
      const { ServiceStrategyResponseSchema } = await import('../src/lib/schemas/strategyService.schema');
      const prompt = buildServiceStrategyPrompt({
        oneLiner: persona.oneLiner,
        understanding: persona.understanding,
        goal,
        offer: persona.offer,
        assets: persona.assets,
      });
      const llmResponse = await generateWithSchema(
        'strategy',
        [{ role: 'user', content: prompt }],
        ServiceStrategyResponseSchema,
        'serviceStrategy'
      );
      // Override the inferred awareness so section routing + copy emotional
      // context exercise the forced state deterministically.
      if (opts.forceAwareness) llmResponse.awareness = opts.forceAwareness;
      assembledStrategy = assembleServiceStrategy({
        llmResponse,
        goal,
        assets: persona.assets,
      });
    }
  } catch (err) {
    console.error(`  [strategy FAIL]`, err);
    return null;
  }

  console.log(`  Strategy ok. Awareness: ${assembledStrategy.awareness}. Sections: ${assembledStrategy.sections.join(' → ')}`);

  // ----- Copy (capture raw before fallback for em-emit measurement) -----
  let rawCopy: Record<string, SectionCopy>;
  try {
    if (useMocks) {
      rawCopy = generateMockServiceCopy({
        strategy: assembledStrategy,
        uiblocks: assembledStrategy.uiblocks,
        oneLiner: persona.oneLiner,
        offer: persona.offer,
      }) as Record<string, SectionCopy>;
    } else {
      const { generateRawJson } = await import('../src/lib/aiClient');
      const { CopyResponseSchema } = await import('../src/lib/schemas');
      const copyPrompt = buildServiceCopyPrompt({
        strategy: assembledStrategy,
        uiblocks: assembledStrategy.uiblocks,
        oneLiner: persona.oneLiner,
        offer: persona.offer,
        goal,
        understanding: persona.understanding,
      });
      rawCopy = (await generateRawJson('copy', copyPrompt, CopyResponseSchema)) as Record<string, SectionCopy>;
    }
  } catch (err) {
    console.error(`  [copy FAIL]`, err);
    schemaValid = false;
    return {
      metrics: {
        slug: persona.slug,
        label: persona.label,
        caseLabel,
        awareness: assembledStrategy.awareness,
        goal,
        sectionOrder: assembledStrategy.sections,
        schemaValid: false,
        copyComplete: false,
        missingSections: [],
        accentFields: [],
        forbiddenWordHits: [],
        credibilityFlag: detectCredibilityHallucination(assembledStrategy, persona),
      },
      assembled: assembledStrategy,
      copy: {},
    };
  }

  const accentFields = measureAccentFields(rawCopy, assembledStrategy.uiblocks);

  const processedCopy = processServiceCopy(rawCopy, assembledStrategy.uiblocks);
  const { complete, missingSections } = validateServiceCopyCompleteness(processedCopy, assembledStrategy.uiblocks);
  const forbiddenWordHits = detectForbiddenWords(processedCopy);
  const credibilityFlag = detectCredibilityHallucination(assembledStrategy, persona);

  const emitted = accentFields.filter((a) => a.llmEmitted).length;
  console.log(`  Copy ok. Sections: ${Object.keys(processedCopy).length}`);
  console.log(`  Accent emit: ${emitted}/${accentFields.length}, complete: ${complete}, forbidden: ${forbiddenWordHits.length}, credibility: ${credibilityFlag ? 'FLAG' : 'ok'}`);

  return {
    metrics: {
      slug: persona.slug,
      label: persona.label,
      caseLabel,
      awareness: assembledStrategy.awareness,
      goal,
      sectionOrder: assembledStrategy.sections,
      schemaValid,
      copyComplete: complete,
      missingSections,
      accentFields,
      forbiddenWordHits,
      credibilityFlag,
    },
    assembled: assembledStrategy,
    copy: processedCopy,
  };
}

// ---------- Aggregate report ----------

function printAggregate(metricsList: PersonaMetrics[]) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('AGGREGATE REPORT');
  console.log('='.repeat(60));

  // Em-emit by field across all personas
  const byField: Record<AccentField, { emitted: number; total: number }> = {
    headline: { emitted: 0, total: 0 },
    lede: { emitted: 0, total: 0 },
  };
  for (const m of metricsList) {
    for (const a of m.accentFields) {
      byField[a.field].total += 1;
      if (a.llmEmitted) byField[a.field].emitted += 1;
    }
  }

  console.log('\nItalic-<em> LLM emit rate (before fallback):');
  for (const f of ACCENT_FIELDS) {
    const { emitted, total } = byField[f];
    const pct = total === 0 ? '—' : ((emitted / total) * 100).toFixed(1) + '%';
    const flag = total === 0 ? ' ' : emitted / total >= 0.8 ? '✓' : '✗';
    console.log(`  ${flag} ${f.padEnd(10)}  ${emitted}/${total} (${pct})`);
  }

  // Per-section emit on headline (most-watched field)
  console.log('\nHeadline emit by section:');
  const bySection: Record<string, { emitted: number; total: number }> = {};
  for (const m of metricsList) {
    for (const a of m.accentFields.filter((x) => x.field === 'headline')) {
      bySection[a.sectionType] ??= { emitted: 0, total: 0 };
      bySection[a.sectionType].total += 1;
      if (a.llmEmitted) bySection[a.sectionType].emitted += 1;
    }
  }
  for (const [section, { emitted, total }] of Object.entries(bySection)) {
    const pct = ((emitted / total) * 100).toFixed(0) + '%';
    console.log(`  ${section.padEnd(15)}  ${emitted}/${total} (${pct})`);
  }

  // Forbidden-word leaks
  const totalForbidden = metricsList.reduce((acc, m) => acc + m.forbiddenWordHits.length, 0);
  console.log(`\nForbidden-word leaks: ${totalForbidden}`);
  if (totalForbidden > 0) {
    for (const m of metricsList) {
      for (const hit of m.forbiddenWordHits) {
        console.log(`  [${m.slug}] ${hit.sectionType}.${hit.field}: "${hit.word}" → ${hit.value.slice(0, 80)}`);
      }
    }
  }

  // Credibility hallucination flags (Phase 6 backlog)
  const credFlags = metricsList.filter((m) => m.credibilityFlag);
  console.log(`\nCredibility hallucination flags: ${credFlags.length}`);
  for (const m of credFlags) {
    console.log(`  [${m.caseLabel}] ${m.credibilityFlag}`);
  }

  // Comparing-state regression gate: order must match the pilot baseline's
  // relative order (services → testimonials → packages, for present sections).
  const comparingCases = metricsList.filter((m) => m.awareness === 'search-aware-comparing');
  if (comparingCases.length) {
    console.log('\nComparing-baseline order check (services < testimonials < packages):');
    for (const m of comparingCases) {
      const idx = (s: string) => m.sectionOrder.indexOf(s);
      const present = ['services', 'testimonials', 'packages'].filter((s) => idx(s) >= 0);
      const ordered = present.every((s, i) => i === 0 || idx(present[i - 1]) < idx(s));
      console.log(`  ${ordered ? '✓' : '✗'} ${m.caseLabel.padEnd(34)} ${m.sectionOrder.join(' → ')}`);
    }
  }

  // Schema / completeness failures
  console.log('\nPer-case status:');
  for (const m of metricsList) {
    const status = m.schemaValid && m.copyComplete ? '✓' : '✗';
    console.log(
      `  ${status} ${m.caseLabel.padEnd(34)} aware:${m.awareness.padEnd(24)} goal:${m.goal.padEnd(14)} schema:${m.schemaValid ? 'ok' : 'FAIL'} complete:${m.copyComplete ? 'ok' : 'FAIL'}${
        m.missingSections.length ? ' missing:' + m.missingSections.join(',') : ''
      }`
    );
  }

  console.log('\nDone.');
}

// ---------- Case matrix ----------

interface DogfoodCase {
  persona: DogfoodPersona;
  forceAwareness?: ServiceAwareness;
  goalOverride?: ServiceGoal;
  caseLabel: string;
}

function personaBySlug(slug: string): DogfoodPersona {
  const p = PERSONAS.find((x) => x.slug === slug);
  if (!p) throw new Error(`Unknown persona slug: ${slug}`);
  return p;
}

const GOAL_MATRIX: ServiceGoal[] = ['book-call', 'request-quote', 'lead-magnet'];

function buildMatrix(matrix: string): DogfoodCase[] {
  const cases: DogfoodCase[] = [];
  if (matrix === 'awareness') {
    // 3 personas × 4 awareness × book-call = 12
    for (const slug of [MATRIX_AGENCY, MATRIX_CONSULTANT, MATRIX_COACH]) {
      for (const aw of serviceAwarenessStates) {
        cases.push({
          persona: personaBySlug(slug),
          forceAwareness: aw,
          caseLabel: `${slug} · ${aw}`,
        });
      }
    }
  } else if (matrix === 'goal') {
    // 2 personas × 3 goals × default(inferred) awareness = 6
    for (const slug of [MATRIX_AGENCY, MATRIX_CONSULTANT]) {
      for (const g of GOAL_MATRIX) {
        cases.push({
          persona: personaBySlug(slug),
          goalOverride: g,
          caseLabel: `${slug} · ${g}`,
        });
      }
    }
  } else if (matrix === 'smell') {
    // 2 personas × {cold, relationship} = 4 (side-by-side copy diff)
    for (const slug of [MATRIX_AGENCY, MATRIX_CONSULTANT]) {
      for (const aw of ['search-aware-cold', 'relationship-warming'] as ServiceAwareness[]) {
        cases.push({
          persona: personaBySlug(slug),
          forceAwareness: aw,
          caseLabel: `${slug} · ${aw}`,
        });
      }
    }
  } else if (matrix === 'comparing-baseline') {
    // 3 personas × forced comparing × book-call = 3 (regression gate)
    for (const slug of [MATRIX_AGENCY, MATRIX_CONSULTANT, MATRIX_COACH]) {
      cases.push({
        persona: personaBySlug(slug),
        forceAwareness: 'search-aware-comparing',
        caseLabel: `${slug} · comparing-baseline`,
      });
    }
  } else {
    throw new Error(`Unknown --matrix=${matrix}. Use: awareness | goal | smell | comparing-baseline`);
  }
  return cases;
}

/** For the smell test, dump headline/lede per section side-by-side per persona. */
function printSmellDiff(
  results: { metrics: PersonaMetrics; copy: Record<string, SectionCopy> }[]
) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('SMELL TEST — cold vs relationship copy (manual diff)');
  console.log('='.repeat(60));
  const bySlug: Record<string, typeof results> = {};
  for (const r of results) (bySlug[r.metrics.slug] ??= []).push(r);
  for (const [slug, rs] of Object.entries(bySlug)) {
    console.log(`\n● ${slug}`);
    for (const r of rs) {
      console.log(`\n  [${r.metrics.awareness}]`);
      for (const sectionType of Object.keys(r.copy)) {
        const el = (r.copy[sectionType]?.elements ?? {}) as Record<string, unknown>;
        const h = typeof el.headline === 'string' ? el.headline : '';
        const l = typeof el.lede === 'string' ? el.lede : '';
        if (h || l) console.log(`    ${sectionType.padEnd(13)} ${h}${l ? `  /  ${l}` : ''}`);
      }
    }
  }
}

// ---------- Main ----------

function parseArgs(): {
  personaFilter: string | null;
  matrix: string | null;
  awareness: ServiceAwareness | null;
  goal: ServiceGoal | null;
} {
  const get = (k: string) => {
    const a = process.argv.find((x) => x.startsWith(`--${k}=`));
    return a ? a.split('=')[1] : null;
  };
  return {
    personaFilter: get('persona'),
    matrix: get('matrix'),
    awareness: (get('awareness') as ServiceAwareness | null) ?? null,
    goal: (get('goal') as ServiceGoal | null) ?? null,
  };
}

function sanitize(label: string): string {
  return label.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

async function main() {
  const { personaFilter, matrix, awareness, goal } = parseArgs();
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true';

  // Build the run list. --matrix takes precedence; else --persona (+ optional
  // --awareness / --goal overrides); else all personas once (legacy behavior).
  let cases: DogfoodCase[];
  if (matrix) {
    cases = buildMatrix(matrix);
  } else {
    const targets = personaFilter ? PERSONAS.filter((p) => p.slug === personaFilter) : PERSONAS;
    if (targets.length === 0) {
      console.error(`No persona matches --persona=${personaFilter}. Available: ${PERSONAS.map((p) => p.slug).join(', ')}`);
      process.exit(1);
    }
    cases = targets.map((persona) => ({
      persona,
      forceAwareness: awareness ?? undefined,
      goalOverride: goal ?? undefined,
      caseLabel: `${persona.slug}${awareness ? ` · ${awareness}` : ''}${goal ? ` · ${goal}` : ''}`,
    }));
  }

  const outDir = join(process.cwd(), 'dogfoodOutput');
  if (!existsSync(outDir)) mkdirSync(outDir);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Service dogfood batch  |  mocks: ${useMocks}  |  matrix: ${matrix ?? 'none'}  |  cases: ${cases.length}`);
  console.log('='.repeat(60));

  const metricsList: PersonaMetrics[] = [];
  const collected: { metrics: PersonaMetrics; copy: Record<string, SectionCopy> }[] = [];
  for (const c of cases) {
    const result = await runPersona(c.persona, useMocks, {
      forceAwareness: c.forceAwareness,
      goalOverride: c.goalOverride,
      caseLabel: c.caseLabel,
    });
    if (!result) continue;

    metricsList.push(result.metrics);
    collected.push({ metrics: result.metrics, copy: result.copy });
    const dump = {
      case: { caseLabel: c.caseLabel, awareness: result.metrics.awareness, goal: result.metrics.goal },
      persona: { slug: c.persona.slug, label: c.persona.label, oneLiner: c.persona.oneLiner },
      metrics: result.metrics,
      strategy: result.assembled,
      copy: result.copy,
    };
    const outPath = join(outDir, `${sanitize(c.caseLabel)}.json`);
    writeFileSync(outPath, JSON.stringify(dump, null, 2), 'utf8');
    console.log(`  → ${outPath}`);
  }

  printAggregate(metricsList);
  if (matrix === 'smell') printSmellDiff(collected);
}

main().catch((err) => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});
