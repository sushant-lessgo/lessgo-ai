import { randomUUID } from 'node:crypto';
import { expect, type APIRequestContext } from '@playwright/test';

// Seeds a publish-ready draft for a token via the REAL authenticated routes in
// mock mode (strategy -> copy -> saveDraft). Avoids importing app modules into
// the Playwright runner (no `@/` alias). The session cookies come from the
// `authed` project's storageState, carried by the `request` context.

export interface AudienceConfig {
  label: string;
  persona: string;
  templateId: 'hearth' | 'meridian' | 'lex';
  paletteId: string;
  variantId: string;
  strategyUrl: string;
  copyUrl: string;
  strategyBody: Record<string, unknown>;
  /** extra fields the copy route needs beyond { strategy, uiblocks }. */
  copyExtra: Record<string, unknown>;
  heroText: RegExp;
  title: string;
}

const CTA_URL = 'https://example.com/cta';

export const AUDIENCES: AudienceConfig[] = [
  {
    label: 'service / Hearth',
    persona: 'agency',
    templateId: 'hearth',
    paletteId: 'terracotta',
    variantId: 'classic',
    strategyUrl: '/api/audience/service/strategy',
    copyUrl: '/api/audience/service/generate-copy',
    strategyBody: {
      oneLiner: 'A six-week brand studio for DTC founders.',
      goal: 'book-call',
      offer: 'Fixed-price brand identity in six weeks',
      paletteId: 'terracotta',
      understanding: {
        serviceType: 'agency', serviceCategories: ['branding'], industries: ['dtc'],
        whatYouDo: 'We build complete brand identities for DTC founders in six weeks',
        targetClients: ['DTC founders at $300k-$2M ARR'],
        outcomes: [],
        services: ['Brand identity', 'Packaging', 'Website refresh'], deliveryModel: 'remote',
      },
      assets: {
        hasTestimonials: true, hasClientLogos: true, hasOutcomes: false,
        hasCaseStudies: true, hasTeamPhotos: false, hasFounderPhoto: true, testimonialType: 'text',
      },
    },
    copyExtra: {
      oneLiner: 'A six-week brand studio for DTC founders.',
      offer: 'Fixed-price brand identity in six weeks',
      goal: 'book-call',
      understanding: {
        serviceType: 'agency', serviceCategories: ['branding'], industries: ['dtc'],
        whatYouDo: 'We build complete brand identities for DTC founders in six weeks',
        targetClients: ['DTC founders at $300k-$2M ARR'],
        outcomes: [],
        services: ['Brand identity', 'Packaging', 'Website refresh'], deliveryModel: 'remote',
      },
    },
    heroText: /stays with you/i,
    title: 'Brand Studio',
  },
  {
    // Lex is a service template — same routes/schema/section-types as Hearth;
    // only the template tokens differ. Exercises the Lex published render.
    label: 'service / Lex',
    persona: 'agency',
    templateId: 'lex',
    paletteId: 'counsel',
    variantId: 'statesman',
    strategyUrl: '/api/audience/service/strategy',
    copyUrl: '/api/audience/service/generate-copy',
    strategyBody: {
      oneLiner: 'A trust-led advisory for regulated industries.',
      goal: 'book-call',
      offer: 'A fixed-scope advisory engagement',
      paletteId: 'counsel',
      understanding: {
        serviceType: 'consultancy', serviceCategories: ['advisory'], industries: ['finance'],
        whatYouDo: 'We advise regulated firms on risk, compliance and counsel',
        targetClients: ['CFOs at mid-market regulated firms'],
        outcomes: [],
        services: ['Risk advisory', 'Compliance review', 'Fractional counsel'], deliveryModel: 'hybrid',
      },
      assets: {
        hasTestimonials: true, hasClientLogos: true, hasOutcomes: false,
        hasCaseStudies: true, hasTeamPhotos: false, hasFounderPhoto: true, testimonialType: 'text',
      },
    },
    copyExtra: {
      oneLiner: 'A trust-led advisory for regulated industries.',
      offer: 'A fixed-scope advisory engagement',
      goal: 'book-call',
      understanding: {
        serviceType: 'consultancy', serviceCategories: ['advisory'], industries: ['finance'],
        whatYouDo: 'We advise regulated firms on risk, compliance and counsel',
        targetClients: ['CFOs at mid-market regulated firms'],
        outcomes: [],
        services: ['Risk advisory', 'Compliance review', 'Fractional counsel'], deliveryModel: 'hybrid',
      },
    },
    heroText: /identity/i,
    title: 'Lex Advisory',
  },
  {
    label: 'product / Meridian',
    persona: 'saas-founder',
    templateId: 'meridian',
    paletteId: 'mint',
    variantId: 'developer',
    strategyUrl: '/api/audience/product/strategy',
    copyUrl: '/api/audience/product/generate-copy',
    strategyBody: {
      productName: 'Meridian',
      oneLiner: 'A deploy platform for teams that ship daily.',
      features: ['Auto deploys', 'Instant rollbacks', 'Build caching'],
      landingGoal: 'signup',
      offer: 'Free to start',
      primaryAudience: 'Staff engineers at fast-shipping startups',
      otherAudiences: [],
      categories: [],
    },
    copyExtra: {
      productName: 'Meridian',
      oneLiner: 'A deploy platform for teams that ship daily.',
      offer: 'Free to start',
      landingGoal: 'signup',
      features: ['Auto deploys', 'Instant rollbacks', 'Build caching'],
    },
    heroText: /Ship on Friday/i,
    title: 'Meridian',
  },
];

async function postOk(request: APIRequestContext, url: string, data: unknown) {
  // The generation routes are rate-limited (FREE tier: 5/min). Reruns within the
  // window can 429; wait out the limiter (bounded) and retry rather than fail.
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await request.post(url, { data });
    const json = await res.json().catch(() => ({}));
    if (res.status() === 429 && attempt < 2) {
      const retryAfter = Math.min(Number(json?.retryAfter) || 30, 35);
      // eslint-disable-next-line no-console
      console.log(`[seed] 429 on ${url}; waiting ${retryAfter}s then retrying`);
      await new Promise((r) => setTimeout(r, (retryAfter + 1) * 1000));
      continue;
    }
    expect(res.ok(), `${url} -> ${res.status()} ${JSON.stringify(json)}`).toBeTruthy();
    return json;
  }
  throw new Error(`${url} still rate-limited after retries`);
}

/** Assemble finalContent (mirrors GeneratingStep.buildFinalContent) + inject a CTA. */
function buildFinalContent(
  strategy: any,
  sections: Record<string, { elements: Record<string, any> }>,
  title: string,
) {
  const sectionTypes: string[] = strategy.sections;
  const sectionIds = sectionTypes.map((t) => `${t}-${randomUUID().slice(0, 8)}`);
  const sectionLayouts: Record<string, string> = {};
  const content: Record<string, any> = {};

  sectionIds.forEach((id, i) => {
    const type = sectionTypes[i];
    const layout = strategy.uiblocks[type] || 'default';
    sectionLayouts[id] = layout;
    const elements: Record<string, any> = { ...(sections[type]?.elements ?? {}) };

    // CTA injection — flat fields are the robust isPublishReady path (nested
    // metadata can be clobbered on loadDraft). Nested buttonConfig kept for the
    // published renderer href.
    const isCtaBearing = type === 'hero' || type === 'cta';
    if (isCtaBearing) {
      elements.cta_text = elements.cta_text || 'Get started';
      elements.cta_url = CTA_URL;
    }

    content[id] = {
      id,
      layout,
      elements,
      backgroundType: 'neutral',
      aiMetadata: {
        aiGenerated: true, isCustomized: false, lastGenerated: 0,
        aiGeneratedElements: Object.keys(elements), excludedElements: [],
      },
      ...(isCtaBearing && {
        elementMetadata: {
          cta_text: { buttonConfig: { type: 'link', url: CTA_URL, ctaType: 'primary' } },
        },
      }),
    };
  });

  return {
    layout: { sections: sectionIds, sectionLayouts, theme: {}, globalSettings: {} },
    content,
    meta: { title, slug: '', version: 1 },
    onboardingData: {},
  };
}

/**
 * Run strategy -> copy (mock) -> saveDraft for the given token + audience.
 * Returns the assembled finalContent so callers can publish it via `publishSeed`
 * without re-deriving it (the publish body needs the same layout/content).
 */
export async function seedDraft(request: APIRequestContext, tokenId: string, cfg: AudienceConfig) {
  const strategyJson = await postOk(request, cfg.strategyUrl, cfg.strategyBody);
  const strategy = strategyJson.data;
  expect(Array.isArray(strategy?.sections), `no strategy.sections: ${JSON.stringify(strategyJson)}`).toBeTruthy();

  const copyJson = await postOk(request, cfg.copyUrl, {
    strategy, uiblocks: strategy.uiblocks, ...cfg.copyExtra,
  });
  const sections = copyJson.sections;

  const finalContent = buildFinalContent(strategy, sections, cfg.title);

  await postOk(request, '/api/saveDraft', {
    tokenId,
    title: cfg.title,
    paletteId: cfg.paletteId,
    templateId: cfg.templateId,
    variantId: cfg.variantId,
    finalContent,
  });

  return finalContent;
}

// ---------------------------------------------------------------------------
// Publish pacing. `/api/publish` is rate-limited to 5 requests per 60s PER USER
// (`RATE_LIMIT_PRESETS.PUBLISHING`, `src/lib/rateLimit.ts:48-51`, in-memory), and the suite runs
// every case as the same Clerk user, serially. Without pacing, a 6th publish in one window 429s — in
// whichever test happens to land there, which looks EXACTLY like a real publish regression
// in a test nobody touched. That made test ORDER load-bearing (add a fast test mid-file and
// the cadence shifts). This wrapper tracks its own publish timestamps and waits the window
// out, so ordering is irrelevant again.
//
// Deliberately NOT an e2e bypass flag on the limiter: the suite must exercise the REAL
// limiter that production users hit.
// ---------------------------------------------------------------------------
const PUBLISH_LIMIT = 5;
const PUBLISH_WINDOW_MS = 60_000;
const publishTimes: number[] = [];

async function awaitPublishWindow() {
  for (;;) {
    const now = Date.now();
    while (publishTimes.length && now - publishTimes[0] >= PUBLISH_WINDOW_MS) publishTimes.shift();
    if (publishTimes.length < PUBLISH_LIMIT) return;
    // The window frees up when the OLDEST of the tracked calls ages out (+1s of slack for
    // clock skew between this runner and the server's limiter).
    const waitMs = PUBLISH_WINDOW_MS - (now - publishTimes[0]) + 1000;
    // eslint-disable-next-line no-console
    console.log(`[seed] publish rate limit (5/60s): waiting ${Math.ceil(waitMs / 1000)}s`);
    await new Promise((r) => setTimeout(r, waitMs));
  }
}

/**
 * Publish a seeded draft through the REAL `/api/publish` route (the same body the preview
 * page sends, minus the UI-only extras). Used by the lifecycle spec, which needs a PUBLISHED
 * project without driving the publish UI for each case.
 *
 * Self-pacing against the 5/60s publish limiter (see above) — callers may publish freely,
 * in any test order.
 *
 * NOTE on local dev: Vercel Blob/KV are absent, so the static export fails non-fatally and the
 * row lands in `publishState: 'failed'` rather than `'published'`. Both are SERVING states
 * (`isServingPublishState`), so `/p/{slug}` renders and teardown treats them identically —
 * which is exactly what the spec asserts against.
 */
export async function publishSeed(
  request: APIRequestContext,
  tokenId: string,
  slug: string,
  cfg: AudienceConfig,
  finalContent: ReturnType<typeof buildFinalContent>,
) {
  await awaitPublishWindow();
  publishTimes.push(Date.now());
  const res = await request.post('/api/publish', {
    data: {
      slug,
      title: cfg.title,
      content: {
        layout: { sections: finalContent.layout.sections, theme: {} },
        content: finalContent.content,
        forms: {},
      },
      themeValues: {},
      tokenId,
    },
    timeout: 150_000,
  });
  const json = await res.json().catch(() => ({}));
  expect(res.ok(), `/api/publish -> ${res.status()} ${JSON.stringify(json)}`).toBeTruthy();
  return json;
}
