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

type BriefGoal = NonNullable<Brief['goal']>;

/** Shared StoreBadges layout name (registry key = lowercased type `storebadges`). */
const SHARED_STORE_BADGES_LAYOUT = 'SharedStoreBadges';

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
  _ctx?: unknown
): void {
  if (!goal || !Array.isArray(sections) || !content || typeof content !== 'object') {
    return;
  }

  if (goal.intent === 'download-app') {
    injectStoreBadges(sections, sectionLayouts, content, goal);
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
