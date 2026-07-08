// src/modules/goals/injectGoalSections.ts
// scale-05 phase 7 — deterministic goal-section injector. PLAIN module (NO
// 'use client') so both onboarding GeneratingSteps can import it firewall-safely.
//
// For the `download-app` intent (mechanism M3) with ≥1 store link in
// `brief.goal.param.links` (EXACTLY where Phase 1's writeback persisted them),
// append a `storeBadges-<uuid>` section after the hero, layout
// `SharedStoreBadges`, content elements { appstore_url, playstore_url,
// badge_label } derived from the links by URL host sniff (play.google.com →
// Play, apps.apple.com → App Store). One link → one badge, two → two.
//
// Deterministic, NO AI. Idempotent: no-op when a storeBadges section already
// exists (resume / regeneration never double-injects).

import type { Brief } from '@/types/brief';
import { badgeKindForUrl, STORE_BADGES_DEFAULT_LABEL } from '@/modules/generatedLanding/sharedBlocks/StoreBadges/badgeArt';
import { FOLLOW_STRIP_DEFAULT_HEADING } from '@/modules/generatedLanding/sharedBlocks/FollowStrip/socialIcons';
import { inferPlatform } from '@/modules/goals/goalToDestination';

type BriefGoal = NonNullable<Brief['goal']>;
type SocialProfile = { platform?: string; url?: string };

/** Optional injection context. `socialProfiles` (Brief.socialProfiles) is the
 *  M4 follow-strip fallback source when the goal carries no `param.links`. */
export interface InjectGoalSectionsCtx {
  socialProfiles?: SocialProfile[] | null;
}

/** Shared StoreBadges layout name (registry key = lowercased type `storebadges`). */
const SHARED_STORE_BADGES_LAYOUT = 'SharedStoreBadges';

/** Shared FollowStrip layout name (registry key = lowercased type `followstrip`). */
const SHARED_FOLLOW_STRIP_LAYOUT = 'SharedFollowStrip';

/** Short uuid suffix for a `${type}-${uuid}` section id (crypto when available). */
function shortId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().slice(0, 8);
    }
  } catch {
    /* fall through */
  }
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Inject deterministic goal-driven sections into the onboarding `finalContent`
 * (mutates `sections` / `sectionLayouts` / `content` in place). Currently
 * handles the M3 `download-app` store-badges row; further goal sections can be
 * added here (single seam, both GeneratingSteps call it).
 *
 * @param sections        ordered section-id array (finalContent.layout.sections)
 * @param sectionLayouts  section-id → layout-name map (finalContent.layout.sectionLayouts)
 * @param content         section-id → section-content map (finalContent.content)
 * @param goal            the Brief goal (intent + mechanism + param)
 * @param _ctx            reserved for future goal-section context (unused today)
 */
export function injectGoalSections(
  sections: string[] | undefined,
  sectionLayouts: Record<string, string> | undefined,
  content: Record<string, any> | undefined,
  goal: BriefGoal | null | undefined,
  ctx?: InjectGoalSectionsCtx
): void {
  if (!goal || !Array.isArray(sections) || !content || typeof content !== 'object') {
    return;
  }

  if (goal.intent === 'download-app') {
    injectStoreBadges(sections, sectionLayouts, content, goal);
  }

  // M4 follow-strip — `follow-social` ONLY. `subscribe-newsletter` is an M1 form
  // (design call #6, Phases 4–5) and must NEVER inject a strip.
  if (goal.intent === 'follow-social') {
    injectFollowStrip(sections, sectionLayouts, content, goal, ctx);
  }
}

/**
 * Append a `storeBadges-<uuid>` section after the hero, deriving the two store
 * URLs from `goal.param.links` by host sniff. Idempotent + skips when no link
 * points at a recognised store.
 */
function injectStoreBadges(
  sections: string[],
  sectionLayouts: Record<string, string> | undefined,
  content: Record<string, any>,
  goal: BriefGoal
): void {
  const links = Array.isArray(goal.param?.links) ? goal.param!.links : [];
  if (links.length === 0) return;

  // Host-sniff each link into its store slot. First match per store wins.
  let appstoreUrl = '';
  let playstoreUrl = '';
  for (const raw of links) {
    const url = (raw || '').trim();
    if (!url) continue;
    const kind = badgeKindForUrl(url);
    if (kind === 'appstore' && !appstoreUrl) appstoreUrl = url;
    else if (kind === 'playstore' && !playstoreUrl) playstoreUrl = url;
  }

  // Unknown-host links (neither store) → nothing to render.
  if (!appstoreUrl && !playstoreUrl) return;

  // Idempotence: never inject a second storeBadges section.
  const already = sections.some(
    (id) => id === 'storeBadges' || id.startsWith('storeBadges-')
  );
  if (already) return;

  const sectionId = `storeBadges-${shortId()}`;

  // Position: after the hero (short scroll; matches the leadForm injector).
  const heroIdx = sections.findIndex((id) => id === 'hero' || id.startsWith('hero-'));
  const insertAt = heroIdx >= 0 ? heroIdx + 1 : sections.length;
  sections.splice(insertAt, 0, sectionId);

  if (sectionLayouts) {
    sectionLayouts[sectionId] = SHARED_STORE_BADGES_LAYOUT;
  }

  content[sectionId] = {
    id: sectionId,
    layout: SHARED_STORE_BADGES_LAYOUT,
    elements: {
      appstore_url: appstoreUrl,
      playstore_url: playstoreUrl,
      badge_label: STORE_BADGES_DEFAULT_LABEL,
    },
    backgroundType: 'neutral',
    aiMetadata: {
      aiGenerated: false,
      isCustomized: false,
      lastGenerated: Date.now(),
      aiGeneratedElements: [],
      excludedElements: [],
    },
  };
}

/**
 * Append a `followStrip-<uuid>` section after the hero for the `follow-social`
 * (M4) goal. Profile links come from `goal.param.links` (Phase 1's M4 capture),
 * falling back to `ctx.socialProfiles` (Brief.socialProfiles). Each URL's
 * platform is inferred via the ONE shared `inferPlatform` (goalToDestination) —
 * no second inferer. The list is MATERIALIZED into a `links_json` element at
 * injection, so renderers never read the Brief. Idempotent; skips when no link
 * is present.
 *
 * Documented limitation: later edits via SocialProfilesPanel do NOT auto-sync
 * the strip — the strip URLs are editable as this section's own elements.
 */
function injectFollowStrip(
  sections: string[],
  sectionLayouts: Record<string, string> | undefined,
  content: Record<string, any>,
  goal: BriefGoal,
  ctx?: InjectGoalSectionsCtx
): void {
  // Primary source: the M4 capture. Fallback: the Brief's site-level profiles.
  const paramLinks = Array.isArray(goal.param?.links) ? goal.param!.links : [];
  const profiles: SocialProfile[] =
    paramLinks.length > 0
      ? paramLinks.map((url) => ({ url }))
      : Array.isArray(ctx?.socialProfiles)
        ? ctx!.socialProfiles!
        : [];

  // Materialize {platform,url} for each usable URL (platform inferred, unless an
  // explicit profile.platform was supplied — e.g. from Brief.socialProfiles).
  const resolved: Array<{ platform: string; url: string }> = [];
  for (const p of profiles) {
    const url = (p?.url || '').trim();
    if (!url) continue;
    const platform = (p?.platform || '').trim().toLowerCase() || inferPlatform(url);
    resolved.push({ platform, url });
  }

  if (resolved.length === 0) return;

  // Idempotence: never inject a second followStrip section.
  const already = sections.some(
    (id) => id === 'followStrip' || id.startsWith('followStrip-')
  );
  if (already) return;

  const sectionId = `followStrip-${shortId()}`;

  // Position: after the hero (short scroll; matches the storeBadges/leadForm injectors).
  const heroIdx = sections.findIndex((id) => id === 'hero' || id.startsWith('hero-'));
  const insertAt = heroIdx >= 0 ? heroIdx + 1 : sections.length;
  sections.splice(insertAt, 0, sectionId);

  if (sectionLayouts) {
    sectionLayouts[sectionId] = SHARED_FOLLOW_STRIP_LAYOUT;
  }

  content[sectionId] = {
    id: sectionId,
    layout: SHARED_FOLLOW_STRIP_LAYOUT,
    elements: {
      strip_heading: FOLLOW_STRIP_DEFAULT_HEADING,
      links_json: JSON.stringify(resolved),
    },
    backgroundType: 'neutral',
    aiMetadata: {
      aiGenerated: false,
      isCustomized: false,
      lastGenerated: Date.now(),
      aiGeneratedElements: [],
      excludedElements: [],
    },
  };
}
