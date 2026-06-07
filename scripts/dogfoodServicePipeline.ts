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
//   npx tsx scripts/dogfoodServicePipeline.ts                 # real LLM, all 5
//   npx tsx scripts/dogfoodServicePipeline.ts --persona=skincare   # single persona

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
import {
  processServiceCopy,
  validateServiceCopyCompleteness,
} from '../src/modules/audience/service/parseCopy';
import {
  generateMockServiceStrategy,
  generateMockServiceCopy,
} from '../src/modules/prompt/mockResponseGeneratorService';
import { SERVICE_VOICE } from '../src/modules/audience/service/voice';
import type {
  ServiceUnderstandingInput,
  ServiceAssetInput,
  ServiceGoal,
  ServiceStrategyOutputAssembled,
} from '../src/types/service';
import type { SectionCopy } from '../src/types/generation';

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
];

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
  schemaValid: boolean;
  copyComplete: boolean;
  missingSections: string[];
  accentFields: PerSectionAccentMetric[];
  forbiddenWordHits: { word: string; sectionType: string; field: string; value: string }[];
}

function hasEm(value: unknown): boolean {
  return typeof value === 'string' && /<em\b/i.test(value);
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

async function runPersona(
  persona: DogfoodPersona,
  useMocks: boolean
): Promise<{ metrics: PersonaMetrics; assembled: ServiceStrategyOutputAssembled; copy: Record<string, SectionCopy> } | null> {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Running: ${persona.slug} — ${persona.label}`);
  console.log('─'.repeat(60));

  // ----- Strategy -----
  let assembledStrategy: ServiceStrategyOutputAssembled;
  let schemaValid = true;
  try {
    if (useMocks) {
      assembledStrategy = generateMockServiceStrategy({
        oneLiner: persona.oneLiner,
        understanding: persona.understanding,
        goal: persona.goal,
        offer: persona.offer,
        assets: persona.assets,
      });
    } else {
      const { generateWithSchema } = await import('../src/lib/aiClient');
      const { ServiceStrategyResponseSchema } = await import('../src/lib/schemas/strategyService.schema');
      const prompt = buildServiceStrategyPrompt({
        oneLiner: persona.oneLiner,
        understanding: persona.understanding,
        goal: persona.goal,
        offer: persona.offer,
        assets: persona.assets,
      });
      const llmResponse = await generateWithSchema(
        'strategy',
        [{ role: 'user', content: prompt }],
        ServiceStrategyResponseSchema,
        'serviceStrategy'
      );
      assembledStrategy = assembleServiceStrategy({
        llmResponse,
        goal: persona.goal,
        assets: persona.assets,
      });
    }
  } catch (err) {
    console.error(`  [strategy FAIL]`, err);
    return null;
  }

  console.log(`  Strategy ok. Sections: ${assembledStrategy.sections.length}`);

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
        goal: persona.goal,
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
        schemaValid: false,
        copyComplete: false,
        missingSections: [],
        accentFields: [],
        forbiddenWordHits: [],
      },
      assembled: assembledStrategy,
      copy: {},
    };
  }

  const accentFields = measureAccentFields(rawCopy, assembledStrategy.uiblocks);

  const processedCopy = processServiceCopy(rawCopy, assembledStrategy.uiblocks);
  const { complete, missingSections } = validateServiceCopyCompleteness(processedCopy, assembledStrategy.uiblocks);
  const forbiddenWordHits = detectForbiddenWords(processedCopy);

  const emitted = accentFields.filter((a) => a.llmEmitted).length;
  console.log(`  Copy ok. Sections: ${Object.keys(processedCopy).length}`);
  console.log(`  Accent emit: ${emitted}/${accentFields.length}, complete: ${complete}, forbidden: ${forbiddenWordHits.length}`);

  return {
    metrics: {
      slug: persona.slug,
      label: persona.label,
      schemaValid,
      copyComplete: complete,
      missingSections,
      accentFields,
      forbiddenWordHits,
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

  // Schema / completeness failures
  console.log('\nPer-persona status:');
  for (const m of metricsList) {
    const status = m.schemaValid && m.copyComplete ? '✓' : '✗';
    console.log(`  ${status} ${m.slug.padEnd(22)} schema:${m.schemaValid ? 'ok' : 'FAIL'} complete:${m.copyComplete ? 'ok' : 'FAIL'}${
      m.missingSections.length ? ' missing:' + m.missingSections.join(',') : ''
    }`);
  }

  console.log('\nDone.');
}

// ---------- Main ----------

function parseArgs(): { personaFilter: string | null } {
  const arg = process.argv.find((a) => a.startsWith('--persona='));
  return { personaFilter: arg ? arg.split('=')[1] : null };
}

async function main() {
  const { personaFilter } = parseArgs();
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true';
  const targets = personaFilter ? PERSONAS.filter((p) => p.slug === personaFilter) : PERSONAS;
  if (targets.length === 0) {
    console.error(`No persona matches --persona=${personaFilter}. Available: ${PERSONAS.map((p) => p.slug).join(', ')}`);
    process.exit(1);
  }

  const outDir = join(process.cwd(), 'dogfoodOutput');
  if (!existsSync(outDir)) mkdirSync(outDir);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Service dogfood batch  |  mocks: ${useMocks}  |  personas: ${targets.length}`);
  console.log('='.repeat(60));

  const metricsList: PersonaMetrics[] = [];
  for (const persona of targets) {
    const result = await runPersona(persona, useMocks);
    if (!result) continue;

    metricsList.push(result.metrics);
    const dump = {
      persona: { slug: persona.slug, label: persona.label, oneLiner: persona.oneLiner, goal: persona.goal },
      metrics: result.metrics,
      strategy: result.assembled,
      copy: result.copy,
    };
    const outPath = join(outDir, `${persona.slug}.json`);
    writeFileSync(outPath, JSON.stringify(dump, null, 2), 'utf8');
    console.log(`  → ${outPath}`);
  }

  printAggregate(metricsList);
}

main().catch((err) => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});
