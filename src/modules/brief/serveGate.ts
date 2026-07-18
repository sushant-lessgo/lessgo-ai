// src/modules/brief/serveGate.ts
// Serve gate — PURE module (scale-02 phase 1, plan D2). Decides SERVE vs
// MANUAL-ONBOARD on a confirmed Brief. Firewall: imports only pure data
// (templateMeta, businessTypes, fit) — never a template module, block,
// resolver, or the registry loaders.
//
// Gate rule (D2, serve-gate-v2): SERVE iff businessType KNOWN (∈ businessTypes)
// AND in-ICP AND facts.entry.resolvedEngine ∈ {thing,trust,work} AND shortlist
// non-empty. A required capability is satisfied by the template's own
// capabilities OR by a SHARED BLOCK (`fit()` — shared blocks render on every
// template, so `lead-form`/`store-badges` needs no longer reject a
// granth/meridian-only brief). Capabilities with NO backing template AND no
// shared block (today: `gallery`) are still unsatisfiable ⇒ still reject.
// AI-INFERRED `structure.mode==='multi'` is a SOFT signal: it never rejects and
// only acts as a style-subordinate pick tiebreak (see pickTemplate) — the hard
// `multipage` requirement lives on the USER-CONFIRMED 7b structure only.
// Everything else ⇒ MANUAL with explicit `missing` tags. Engine clauses read
// facts.entry.resolvedEngine, NEVER brief.copyEngine (unset for
// place/quick-yes).
//
// Tag emission (tests assert strict `missing` equality):
// - `out-of-icp` is EXCLUSIVE (transactional platform ⇒ that tag alone).
// - Otherwise collect ALL failed clauses and join in canonical order
//   `rungC → collection → rungE → bridge → rungA`. `collection:<key>`
//   (scale-10 phase 3) fires when a KNOWN businessType's requiredCollections
//   key is covered by no shortlisted template (dormant — no type sets it yet).
// - `bridge:<engine>` fires ONLY for a KNOWN businessType (unknown type ⇒
//   rungA is the unblock; no derivable bridge target).
// - `rungE:<engine>` is NOT known-gated — fires for unknown types too.
// - rungC gallery injection is SOURCE-gated: classificationSource==='tiebreaker'
//   AND tiebreaker==='portfolio-is-proof'.

import type { Brief, CapabilityId } from '@/types/brief';
import type { AudienceType, TemplateId } from '@/types/service';
import { templateIds } from '@/types/service';
import { templateMeta } from '@/modules/templates/templateMeta';
import {
  businessTypes,
  type BusinessTypeKey,
} from '@/modules/businessTypes/config';
import {
  fit,
  shortlist,
  requiredCapabilitiesFromBrief,
} from '@/modules/templates/fit';
import type { CollectionKey } from '@/modules/collections/registry';
import { getEntryFacts, type ResolvedEngine } from './classify';

/**
 * scale-10 phase 3 — pure supply check. A businessType's `requiredCollections`
 * key is COVERED iff some shortlisted template declares that collection-family
 * capability (the collection key IS the capabilityId). Uncovered keys become
 * granular `collection:<key>` demand tags. Gates on template SUPPLY, not on
 * whether `facts.collections` carries data (empty collections still serve).
 *
 * Vestria's flat-grid `catalog` is NOT a CollectionKey, so a template declaring
 * only `catalog` covers no `requiredCollections` key.
 *
 * @param shortlistCapabilities capability lists of the shortlisted templates.
 */
export function uncoveredCollectionTags(
  requiredCollections: readonly CollectionKey[],
  shortlistCapabilities: readonly (readonly string[])[]
): string[] {
  const tags: string[] = [];
  for (const key of requiredCollections) {
    const covered = shortlistCapabilities.some((caps) => caps.includes(key));
    if (!covered) tags.push(`collection:${key}`);
  }
  return tags;
}

/**
 * Launch bridges (spec §11.9): thing → product wizard, trust → service wizard,
 * work → writer (granth) wizard. As of scale-06 phase 9 the writer bridge is
 * LIVE: work routes through the unified wizard, so the `bridge:work` MANUAL
 * clause is gone and `work` sits here alongside thing/trust.
 */
export const BRIDGEABLE_ENGINES: Record<'thing' | 'trust' | 'work', AudienceType> = {
  thing: 'product',
  trust: 'service',
  work: 'writer',
};

/**
 * Template → audience map (atelier-template phase 1). The served audienceType is
 * derived from the PICKED TEMPLATE, not the engine, so a template can declare an
 * audience that differs from its engine's default bridge (e.g. atelier is a
 * work-engine template that is service-audience — arriving phase 4). A FULL
 * `Record<TemplateId, AudienceType>` so tsc FORCES an entry when the TemplateId
 * union grows.
 *
 * Every entry MIRRORS today's engine→audience result byte-for-byte (so nothing
 * observable changes until a template deviates): thing-engine templates → product,
 * trust-engine templates → service, work-engine granth → writer. `decideServe`
 * falls back to `BRIDGEABLE_ENGINES[engine]` if a picked template is ever absent
 * (never today — the Record is total).
 */
export const TEMPLATE_AUDIENCE: Record<TemplateId, AudienceType> = {
  hearth: 'service',
  lex: 'service',
  surge: 'service',
  lumen: 'service',
  meridian: 'product',
  techpremium: 'product',
  vestria: 'product',
  granth: 'writer',
  // atelier is a WORK-engine template that is SERVICE-audience (atelier-template
  // phase 1) — the deviation the picked-template map exists for. work→writer is
  // the engine bridge, but atelier declares service, so a served photographer
  // reaches a service-audience atelier site (NOT the writer wizard).
  atelier: 'service',
};

export type ServeDecision =
  | {
      outcome: 'serve';
      audienceType: AudienceType;
      templateId: TemplateId;
      shortlist: TemplateId[];
    }
  | {
      outcome: 'manual';
      /** Comma-joined tags in canonical order — never empty. */
      missing: string;
      tags: string[];
      outOfIcp: boolean;
    };

/**
 * D3 template pick, hardened + serve-gate-v2 soft-multipage tiebreak. STYLE
 * ALWAYS WINS (D6 — machine decides facts, user decides taste): style-match the
 * shortlist against templateMeta.designStyles (ARRAY — `.includes`, not scalar
 * equality) trying brief.designStyleHint FIRST; hint null/off-list ⇒ retry with
 * businessTypes[bt].defaultStyle (bt always KNOWN on serve paths per D2).
 *
 * Multipage is ONLY a same-style tiebreak, NEVER a candidate restriction: when a
 * style match resolves to a SET of >1 template AND the brief carries an inferred
 * `structure.mode === 'multi'`, prefer a multipage-capable one within that set.
 * A style match is never overridden by multipage; the candidate pool is never
 * narrowed. Both misses ⇒ shortlist[0].
 *
 * DORMANT under today's config: no two same-engine templates share a design
 * style, so a style match is always a singleton and the multipage tiebreak
 * branch never fires. This is deliberate, not dead code — it is the documented
 * behavior for a future config where two same-style templates coexist and one
 * is multipage-capable. Do NOT "fix" it by restricting candidates.
 */
function pickTemplate(brief: Brief, sl: TemplateId[]): TemplateId {
  const preferMultipage = (matches: TemplateId[]): TemplateId => {
    if (matches.length > 1 && brief.structure?.mode === 'multi') {
      const multi = matches.find((t) =>
        templateMeta[t].capabilities.includes('multipage')
      );
      if (multi) return multi;
    }
    return matches[0];
  };

  const hint = brief.designStyleHint;
  if (hint) {
    const byHint = sl.filter((t) => templateMeta[t].designStyles.includes(hint));
    if (byHint.length > 0) return preferMultipage(byHint);
  }
  const entry = businessTypes[brief.businessType as BusinessTypeKey];
  if (entry) {
    const byDefault = sl.filter((t) =>
      templateMeta[t].designStyles.includes(entry.defaultStyle)
    );
    if (byDefault.length > 0) return preferMultipage(byDefault);
  }
  return sl[0];
}

export function decideServe(brief: Brief): ServeDecision {
  const entry = getEntryFacts(brief);
  const engine: ResolvedEngine | undefined = entry?.resolvedEngine;
  const known = !!brief.businessType && brief.businessType in businessTypes;

  // (a) out-of-icp is EXCLUSIVE — transactional platform ⇒ single tag,
  // nothing else collected (the rung ladder is moot for out-of-ICP demand).
  const platformNeeds = entry?.platformNeeds;
  if (platformNeeds === 'checkout' || platformNeeds === 'ordering') {
    return { outcome: 'manual', missing: 'out-of-icp', tags: ['out-of-icp'], outOfIcp: true };
  }

  // (b) collect ALL failed clauses in canonical order rungC → rungE → bridge → rungA.
  const tags: string[] = [];

  // rungC — source-gated gallery-cap injection. shortlist() CANNOT be reused
  // (it recomputes caps internally and would drop the injected 'gallery');
  // run fit() per-template with the augmented list and
  // facts.entry.resolvedEngine as the engine arg (D2 — NOT brief.copyEngine).
  // Runs INDEPENDENTLY of the engine/bridge clauses. serve-gate-v2: `gallery`
  // has NO backing template AND no shared block, so fit() still can't satisfy
  // it — this rung still rejects (unlike lead-form/store-badges, now shared).
  if (
    entry?.classificationSource === 'tiebreaker' &&
    entry.tiebreaker === 'portfolio-is-proof'
  ) {
    const caps: CapabilityId[] = [
      ...requiredCapabilitiesFromBrief(brief),
      'gallery',
    ];
    const anyFit = templateIds.some((t) => fit(t, engine, caps));
    if (!anyFit) tags.push('rungC:gallery');
  }

  // collection supply (scale-10 phase 3) — a KNOWN businessType may declare
  // `requiredCollections`; a required key not covered by any shortlisted
  // template (no shortlisted template declares that collection-family
  // capability) yields a granular `collection:<key>` demand tag. Gates on
  // template SUPPLY, not on whether facts.collections has data. DORMANT today:
  // no businessType sets requiredCollections, so this branch never fires in
  // real config (fixture-tested only). Canonical order: after rungC.
  if (known) {
    const btEntry = businessTypes[brief.businessType as BusinessTypeKey];
    const requiredCollections = btEntry?.requiredCollections ?? [];
    if (requiredCollections.length > 0) {
      const supplyBridgeable = engine === 'thing' || engine === 'trust' || engine === 'work';
      const supplyShortlist = supplyBridgeable ? shortlist(brief) : [];
      const shortlistCaps = supplyShortlist.map((t) => templateMeta[t].capabilities);
      tags.push(...uncoveredCollectionTags(requiredCollections, shortlistCaps));
    }
  }

  // rungE — engine not live (place/quick-yes). NOT known-type-gated.
  if (engine === 'place' || engine === 'quick-yes') {
    tags.push(`rungE:${engine}`);
  }

  // rungA — businessType not in List 1.
  if (!known) {
    tags.push(`rungA:${brief.businessType ?? 'unclassified'}`);
  }

  // Normal template check (scale-01 shortlist). shortlist() reads
  // brief.copyEngine internally — fine here: only consulted when copyEngine
  // is set and equals resolvedEngine (thing/trust).
  const bridgeable = engine === 'thing' || engine === 'trust' || engine === 'work';
  const sl = known && bridgeable ? shortlist(brief) : [];

  if (tags.length === 0 && known && bridgeable && sl.length > 0) {
    const pickedTemplateId = pickTemplate(brief, sl);
    return {
      outcome: 'serve',
      // audienceType derives from the PICKED TEMPLATE (atelier-template phase 1),
      // falling back to the engine bridge if a template is ever unmapped. Total
      // Record today ⇒ fallback never fires ⇒ byte-identical to prior behavior.
      audienceType: TEMPLATE_AUDIENCE[pickedTemplateId] ?? BRIDGEABLE_ENGINES[engine],
      templateId: pickedTemplateId,
      shortlist: sl,
    };
  }

  // Fallback (latent-gap guard): a KNOWN thing/trust/work type whose required
  // caps no template AND no shared block covers would otherwise reach here with
  // zero tags ⇒ missing===''. Emit a generic tag so `missing` is never empty on
  // a manual outcome. serve-gate-v2 narrowed WHAT reaches here: lead-form and
  // store-badges are now shared-block-satisfied (so download-app serves), and
  // inferred multi no longer derives an unsatisfiable multipage. `gallery`
  // (photographer) is the live path that still lands here via the rungC probe;
  // this generic guard remains the never-empty backstop for any future
  // unsatisfiable cap.
  if (tags.length === 0) {
    const caps = requiredCapabilitiesFromBrief(brief);
    const firstUnmet =
      caps.find((c) => !templateIds.some((t) => fit(t, engine, [c]))) ??
      caps[0] ??
      'shortlist-empty';
    tags.push(`rungC:${firstUnmet}`);
  }

  return { outcome: 'manual', missing: tags.join(','), tags, outOfIcp: false };
}
