// /app/edit/[token]/components/layout/EditHeader.tsx
"use client";

// PHASE 4 — SINGLE-BAR COLLAPSE (decision 1).
//
// This file used to render a SECOND `<header>` row nested inside the right
// content column (below GlobalAppHeader, beside the canvas, NOT spanning the
// rail). t1 is ONE 56px full-width bar, so that row is gone: what remains here
// are the two CLUSTERS its content became, mounted by GlobalAppHeader (the one
// surviving `<header>`).
//
// Nothing about behavior moved with it:
//  - the design-control dispatch below is UNCHANGED (byte-identical to the old
//    EditHeader L24-52), including its render-read selector;
//  - the `!allComplete` ReviewPill guard is UNCHANGED (old L70) — it double-gates
//    with ReviewPill's own self-hide, and BOTH are deliberate (scout §D).
//
// LANGUAGES CONTROL — REMOVED, do NOT restore (decision 8b, founder ruling at the
// phase-4 gate; it reverses the earlier "removing a working control is a behavior
// change" call and authorizes the removal). LanguageToggle is invisible until a
// project declares a 2nd locale, so on ~every project the pair was dead weight.
// The two components are deliberately LEFT ON DISK, unimported, at
// ../editor/{LanguageToggle,LocaleSettings}.tsx: there is a LOGGED OPEN RISK (see
// docs/product/orchestrator.md) that bilingual projects (Lumen EN/NL, naayom→Hindi)
// now have no locale-switch affordance — keeping them makes re-mounting cheap.
// The regen locale-lock in EditHeaderRightPanel is UNAFFECTED: it reads
// activeLocale/localeConfig from the store, never the toggle component.
//
// There is no `EditHeader` component any more; EditLayout mounts GlobalAppHeader
// only. Kept in this file (rather than inlined into GlobalAppHeader) so the
// dispatch comment + selector stay where reviewers of this track expect them.

import React from 'react';
import { ThemePopover } from '../ui/ThemePopover';
import { ServiceThemePopover } from '../ui/ServiceThemePopover';
import { VestriaThemePopover } from '../ui/VestriaThemePopover';
import { ReviewPill } from '../ui/ReviewPill';
import { SaveStateChip } from '../ui/SaveStateChip';
import { AppIcon } from '@/components/ui/icon';
import { Coming } from '@/components/ui/coming';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore } from '@/hooks/useEditStore';
import { useReviewState } from '@/hooks/useReviewState';
import { usesTemplateModule } from '@/types/service';

/**
 * Left-cluster editor controls: the design-system popover for this project's
 * audience/template. (The i18n controls that used to sit beside it were removed
 * — see the LANGUAGES CONTROL note at the top of this file.)
 */
export function EditorDesignControls() {
  // Render-read: audienceType + templateId select which design-control popover renders.
  const { audienceType, templateId } = useEditStore(
    useShallow((s) => ({ audienceType: s.audienceType, templateId: s.templateId })),
  );
  const isService = audienceType === 'service';
  const usesTemplate = usesTemplateModule(audienceType, templateId);

  // Design-system control selection:
  //  - Service templates get the template/variant/palette picker (fit-filtered
  //    template swap via TemplateSwapList, scale-07 phase 7).
  //  - Product template-module projects (meridian/vestria/techpremium) get the
  //    product picker — meridian is UNLOCKED (scale-07 phase 7): the old static
  //    "locked for the pilot" label is gone; swap targets come from the same
  //    fit-filtered shortlist (only templates that render every section this
  //    site has, same copy engine).
  //  - Writer (granth, white-glove) template projects show no theme controls —
  //    the legacy ThemePopover targets the old product color system and must
  //    not surface for template-module projects.
  //  - Legacy (non-template) product keeps the old theme panel.
  let designControls: React.ReactNode;
  if (isService) {
    designControls = <ServiceThemePopover />;
  } else if (usesTemplate && audienceType === 'product') {
    designControls = <VestriaThemePopover />;
  } else if (usesTemplate) {
    designControls = null;
  } else {
    designControls = <ThemePopover />;
  }

  return <div className="flex items-center gap-2">{designControls}</div>;
}

/**
 * Right-cluster status pills: setup-guide pill (hidden once every guide task is
 * done) + the save-state chip (which also owns the beforeunload dirty guard).
 */
export function EditorStatusCluster() {
  const { allComplete } = useReviewState();

  return (
    <div className="flex items-center gap-2">
      {/* Score pill (t1) — nothing scores a page today, so it renders greyed
          rather than being omitted (decision 15 / "render greyed, never omit"). */}
      <Coming
        what="the page score"
        className="rounded-app-badge border border-app-score-border bg-app-score-bg px-2 py-1 text-[12px] font-semibold text-app-primary-deep"
      >
        <AppIcon name="insights" size={15} />
        7.4
      </Coming>

      {/* Double-gated with ReviewPill's own self-hide — preserve BOTH (scout §D). */}
      {!allComplete && <ReviewPill />}
      <SaveStateChip />
    </div>
  );
}
