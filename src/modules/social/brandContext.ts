// src/modules/social/brandContext.ts
// READ-ONLY accessor: turns a stored Project row into a normalized BrandContext
// for social-post prompting (see ./types.ts). Degrades gracefully for ANY
// audience/template and for partially-filled drafts.
//
// INVARIANTS (do not break):
//   1. Pure + read-only. Never writes, never calls the AI, never mutates input.
//   2. No imports from any `'use client'` file (importing a client-block fn into
//      a server/pure path causes a runtime "F is not a function" 500). Keep this
//      module plain — types + prisma-shaped JSON only.
//   3. Absent section = MISSING KEY, not `[]`. Every accessor is null-safe:
//      `elements?.testimonials` etc. — never assume a key exists.
//   4. Dual testimonial shapes are normalized here (product collection array vs
//      service flat block). Same tolerance for features/services collections.
//
// Sources consumed (all optional):
//   - project.brief                    (typed via @/types/brief; zod source
//                                        src/lib/schemas/brief.schema.ts)
//   - project.content.onboarding       (confirmedFields / featuresFromAI /
//                                        hiddenInferredFields.brandTone —
//                                        shape per api/saveDraft/route.ts:33-45)
//   - project.content.finalContent     (generated page sections: testimonials /
//                                        features / services)
//   - project.inputText                (the raw one-liner)
//   - project.title / project.name     (display name fallback)

import type { Brief } from '@/types/brief';
import type {
  BrandContext,
  BrandFeature,
  BrandTestimonial,
  BrandSocialProfile,
} from './types';

type AnyRecord = Record<string, unknown>;

/**
 * Minimal Project-shaped input. Intentionally loose (all optional, `content`
 * left as `unknown`) so a bare `{ brief }` or a raw prisma row both type-check.
 */
export interface BrandContextInput {
  brief?: unknown;
  content?: unknown;
  inputText?: string | null;
  title?: string | null;
  name?: string | null;
}

// ---- small null-safe helpers -------------------------------------------------

function asRecord(v: unknown): AnyRecord | undefined {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as AnyRecord) : undefined;
}

function asArray(v: unknown): unknown[] | undefined {
  return Array.isArray(v) ? v : undefined;
}

function str(v: unknown): string | undefined {
  if (typeof v === 'string') {
    const t = v.trim();
    return t.length > 0 ? t : undefined;
  }
  return undefined;
}

/** Read `confirmedFields[key].value` tolerantly (missing → undefined). */
function confirmedValue(confirmedFields: AnyRecord | undefined, key: string): string | undefined {
  const entry = asRecord(confirmedFields?.[key]);
  return str(entry?.value);
}

/**
 * Gather every section record from a `finalContent` blob, regardless of storage
 * mode: the flat `finalContent.content` map AND every `finalContent.pages[*].content`
 * map (current editor drafts are page-store mode). Returns section values keyed
 * by their `${type}-${uuid}` id. Absent/malformed → empty object.
 */
function collectSections(finalContent: unknown): AnyRecord {
  const fc = asRecord(finalContent);
  if (!fc) return {};

  const out: AnyRecord = {};

  // Page-store mode: pages[pageId].content is authoritative.
  const pages = asRecord(fc.pages);
  if (pages) {
    for (const page of Object.values(pages)) {
      const content = asRecord(asRecord(page)?.content);
      if (content) Object.assign(out, content);
    }
  }

  // Flat top-level content (legacy drafts + derived mirror).
  const flat = asRecord(fc.content);
  if (flat) {
    // Page slices win over the mirror when both carry the same id; but for a
    // read-only summary either copy is equivalent, so a plain merge is fine.
    for (const [id, section] of Object.entries(flat)) {
      if (!(id in out)) out[id] = section;
    }
  }

  return out;
}

/** All section `elements` records whose id starts with `${type}-`. */
function elementsForType(sections: AnyRecord, type: string): AnyRecord[] {
  const prefix = `${type}-`;
  const result: AnyRecord[] = [];
  for (const [id, section] of Object.entries(sections)) {
    if (!id.startsWith(prefix)) continue;
    const elements = asRecord(asRecord(section)?.elements);
    if (elements) result.push(elements);
  }
  return result;
}

// ---- testimonials (dual shape) ----------------------------------------------

function normalizeTestimonialFromRecord(r: AnyRecord): BrandTestimonial | undefined {
  const quote = str(r.quote);
  const authorName = str(r.author_name) ?? str(r.authorName);
  if (!quote || !authorName) return undefined; // require the load-bearing fields
  return {
    quote,
    authorName,
    authorRole: str(r.author_role) ?? str(r.authorRole),
    authorCompany: str(r.author_company) ?? str(r.authorCompany),
  };
}

function extractTestimonials(sections: AnyRecord): BrandTestimonial[] {
  const out: BrandTestimonial[] = [];
  for (const elements of elementsForType(sections, 'testimonials')) {
    // Product shape: a `testimonials` COLLECTION array.
    const collection = asArray(elements.testimonials);
    if (collection) {
      for (const item of collection) {
        const rec = asRecord(item);
        const norm = rec && normalizeTestimonialFromRecord(rec);
        if (norm) out.push(norm);
      }
      continue;
    }
    // Service shape: FLAT block fields on `elements` itself.
    const flat = normalizeTestimonialFromRecord(elements);
    if (flat) out.push(flat);
  }
  return out;
}

// ---- features / services (collections → feature/benefit pairs) ---------------

function normalizeFeatureFromRecord(r: AnyRecord): BrandFeature | undefined {
  // onboarding featuresFromAI shape: { feature, benefit }
  const feature = str(r.feature) ?? str(r.title) ?? str(r.name);
  if (!feature) return undefined;
  const benefit = str(r.benefit) ?? str(r.description) ?? '';
  return { feature, benefit };
}

function extractFeaturesFromSections(sections: AnyRecord): BrandFeature[] {
  const out: BrandFeature[] = [];
  // Both `features-*` (product/service features) and `services-*` collections
  // fold into feature/benefit pairs (title→feature, description→benefit).
  for (const type of ['features', 'services']) {
    for (const elements of elementsForType(sections, type)) {
      const collection = asArray(elements[type]);
      if (!collection) continue;
      for (const item of collection) {
        const rec = asRecord(item);
        const norm = rec && normalizeFeatureFromRecord(rec);
        if (norm) out.push(norm);
      }
    }
  }
  return out;
}

// ---- brief-derived fields ----------------------------------------------------

function goalFromBrief(brief: Brief | undefined): string | undefined {
  const g = brief?.goal;
  if (!g) return undefined;
  const parts = [g.intent, g.mechanism].filter(
    (p) => typeof p === 'string' && p.length > 0,
  ) as string[];
  return parts.length ? parts.join(' · ') : undefined;
}

function socialProfilesFromBrief(brief: Brief | undefined): BrandSocialProfile[] {
  const list = brief?.socialProfiles;
  if (!Array.isArray(list)) return [];
  const out: BrandSocialProfile[] = [];
  for (const p of list) {
    const platform = str((p as AnyRecord)?.platform);
    const url = str((p as AnyRecord)?.url);
    if (platform && url) out.push({ platform, url });
  }
  return out;
}

// ---- public API --------------------------------------------------------------

/**
 * Build a normalized, prompt-ready BrandContext from a Project row. Read-only.
 * Never throws on missing/partial data — a bare `{ brief }` yields a usable
 * partial context; array fields are always arrays (never undefined).
 */
export function buildBrandContext(project: BrandContextInput): BrandContext {
  const brief = (asRecord(project?.brief) as Brief | undefined) ?? undefined;

  const content = asRecord(project?.content);
  const onboarding = asRecord(content?.onboarding);
  const confirmedFields = asRecord(onboarding?.confirmedFields);
  const hiddenInferred = asRecord(onboarding?.hiddenInferredFields);
  const finalContent = content?.finalContent;
  const sections = collectSections(finalContent);

  // ---- features: onboarding featuresFromAI first, then content sections ----
  const features: BrandFeature[] = [];
  const featuresFromAI = asArray(onboarding?.featuresFromAI);
  if (featuresFromAI) {
    for (const item of featuresFromAI) {
      const rec = asRecord(item);
      const norm = rec && normalizeFeatureFromRecord(rec);
      if (norm) features.push(norm);
    }
  }
  if (features.length === 0) {
    features.push(...extractFeaturesFromSections(sections));
  }

  const businessName =
    confirmedValue(confirmedFields, 'productName') ??
    confirmedValue(confirmedFields, 'businessName') ??
    str(project?.name) ??
    str(project?.title);

  const category =
    confirmedValue(confirmedFields, 'marketCategory') ??
    str(brief?.category);

  const goal =
    confirmedValue(confirmedFields, 'landingPageGoals') ??
    goalFromBrief(brief);

  const facts = asRecord(brief?.facts) as Record<string, unknown> | undefined;

  return {
    businessName,
    oneLiner: str(project?.inputText),
    category,
    goal,
    offer: confirmedValue(confirmedFields, 'offer'),
    audience: confirmedValue(confirmedFields, 'targetAudience'),
    brandTone: str(hiddenInferred?.brandTone),
    facts: facts && Object.keys(facts).length > 0 ? facts : undefined,
    features,
    testimonials: extractTestimonials(sections),
    socialProfiles: socialProfilesFromBrief(brief),
  };
}

/**
 * Compact, prompt-ready text block. Omits absent sections rather than emitting
 * empty headings. Always non-empty (the business line is always present, with a
 * safe fallback). Used by the phase-3 prompt builder.
 */
export function summarizeBrandContext(ctx: BrandContext): string {
  const lines: string[] = [];

  lines.push(`Business: ${ctx.businessName ?? '(unnamed)'}`);
  if (ctx.oneLiner) lines.push(`One-liner: ${ctx.oneLiner}`);
  if (ctx.category) lines.push(`Category: ${ctx.category}`);
  if (ctx.audience) lines.push(`Audience: ${ctx.audience}`);
  if (ctx.offer) lines.push(`Offer: ${ctx.offer}`);
  if (ctx.goal) lines.push(`Goal: ${ctx.goal}`);
  if (ctx.brandTone) lines.push(`Brand tone: ${ctx.brandTone}`);

  if (ctx.features.length > 0) {
    lines.push('Features:');
    for (const f of ctx.features) {
      lines.push(f.benefit ? `- ${f.feature}: ${f.benefit}` : `- ${f.feature}`);
    }
  }

  if (ctx.testimonials.length > 0) {
    lines.push('Testimonials:');
    for (const t of ctx.testimonials) {
      const attribution = [t.authorName, t.authorRole, t.authorCompany]
        .filter((p): p is string => typeof p === 'string' && p.length > 0)
        .join(', ');
      lines.push(`- "${t.quote}" — ${attribution}`);
    }
  }

  if (ctx.socialProfiles.length > 0) {
    lines.push('Social profiles:');
    for (const p of ctx.socialProfiles) {
      lines.push(`- ${p.platform}: ${p.url}`);
    }
  }

  return lines.join('\n');
}
