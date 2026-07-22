// app/edit/[token]/components/toolbars/SectionToolbar.tsx - Priority-Resolved Section Toolbar
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore } from '@/hooks/useEditStore';
import { useSectionCRUD } from '@/hooks/useSectionCRUD';
import { AddSectionButton } from '../content/SectionCRUD';
import LoadingButtonBar from '@/components/shared/LoadingButtonBar';
import type { SectionType } from '@/types/core/content';
import { logger } from '@/lib/logger';
import { getSectionTypeFromLayout } from '@/utils/layoutSectionTypeMapping';
import { ElementToggleModal } from '../ui/ElementToggleModal';
import { isChromeId } from '@/hooks/editStore/pageHelpers';
import { eligibleVariantCount } from '../ui/BlockVariantSelector';
import { usesTemplateModule } from '@/types/service';
import { ToolbarButton, ToolbarDivider, ToolbarLabel, useHideToolbarChrome } from './ToolbarButton';
// phase 4: the Social manage-items entry point. Direct import (not the
// `lessgo:manage-social` window event) because SectionToolbar is APP code, not a
// template module — the event exists to let template blocks request the panel
// across the firewall. GlobalAppHeader.tsx:55 already imports it the same way, and
// there is no cycle: GlobalModals imports no toolbar.
import { showSocialModal } from '../ui/GlobalModals';
// section-background phase 2: the Background action's TEMPLATE gate. Pure data
// (no React, no template/skeleton module) → firewall-safe, and deliberately the
// SAME predicate `resolveSectionSurface` uses, so the toolbar and the renderer can
// never drift about which projects have surfaces.
import { isSkeletonBacked } from '@/modules/skeletons/ids';
import { BackgroundPanel } from './BackgroundPanel';

// Shared chrome (header/footer) is site-wide: hide per-page structural actions.
// `regen` joins the list — chrome isn't a copy-contract section, so a section
// regen there is undefined (ruling 1: hide, not grey).
const CHROME_HIDDEN_ACTIONS = ['move-up', 'move-down', 'duplicate', 'delete', 'regen'];

/**
 * Actions that belong to the FOOTER alone (toolbarPlan's Footer + Social Beta
 * columns). Gated by `isFooterId`, NOT by `isChromeId` — the latter is true for the
 * HEADER too, whose Beta column is Menu (deferred entirely per ruling 9). Leaking
 * any of these onto the header is the most plausible regression here, so the header
 * e2e case asserts their absence explicitly.
 */
const FOOTER_ONLY_ACTIONS = ['manage-links', 'manage-social', 'social-orientation'];

/**
 * Human label for the toolbar's status chip, from the `${type}-${uuid}` section-id
 * convention (`extractSectionType`'s grammar; every audience/template stamps it).
 *
 * toolbar-standard-beta phase 2 delivers the Footer's "Footer" label. The chip used
 * to show the WHOLE id capitalised — `Footer-a1b2c3d4`, `Hero-9f0e1d2c` (flagged in
 * phase 1's audit as "looks rough"). Dropping the uuid is what makes the label read
 * as an element name, and it is the same one-expression change for every section
 * type, so it is not footer-special-cased. `socialProof-x` → `SocialProof`; a
 * suffix-less id (legacy `footer`) → `Footer`.
 *
 * Deliberately NOT sourced from `sectionList`'s labels — those are prose ("Social
 * Proof Logos / Stats", "Primary CTA Section") sized for a picker, not a chip, and
 * that list is the PRODUCT section vocabulary only (service/work types are absent),
 * so it would degrade to this fallback for half the templates anyway.
 */
function sectionChipLabel(sectionId: string): string {
  const type = sectionTypeOf(sectionId);
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/** The `${type}-${uuid}` grammar, in one place (a suffix-less legacy `footer` id
 *  is its own type). Shared by the chip label, `isFooterId` and the phase-2
 *  Background section gate. */
function sectionTypeOf(sectionId: string): string {
  const dash = sectionId.indexOf('-');
  return dash === -1 ? sectionId : sectionId.slice(0, dash);
}

// ── section-background phase 2: the Background section gate (plan D7 + note N2) ──
//
// A DENYLIST, not an allowlist. The gallery — the atelier centrepiece and the most
// likely first thing a user recolours — has section type `work`, NOT `gallery`
// (`resolveWorkBlock.ts:114` registers it under `work`; `workSections.ts:204`
// declares `sectionType:'work'`; only the legacy name in `sectionRules.ts:25` says
// `gallery`). An allowlist transcribed from the plan's matrix would therefore ship
// the centrepiece body section greyed. Everything not listed here is eligible.
//
// Each entry is the mandatory "why" tooltip for a greyed placeholder (founder
// ruling 9) — a dead button with no explanation reads as a bug.
const BACKGROUND_DENIED_SECTION_TYPES: Record<string, string> = {
  // Phase 3 (D7): on the slider/image hero variants the band is fully covered by
  // `.wk-hero__media`/`__slides` + `__scrim`, so Color is INVISIBLE there until
  // `bgMode:'color'` suppresses the media. The hero ships as ONE coherent control.
  hero: 'Hero background lands with image mode.',
  // D5 / orchestrator R2: `--wk-header-bg` is declared on `:root` and cannot be
  // retro-bound per-section; the header's surface belongs to the header toolbar.
  header: 'Header background comes with the header toolbar.',
  // Orchestrator R1: the works catalog + project pages share one piece of
  // collection machinery; a per-section band there is a collection-wide decision.
  workcatalog: 'Collection pages share one background — that comes with the works settings.',
  workdetail: 'Collection pages share one background — that comes with the works settings.',
};

/** The verbatim pre-phase-2 tooltip. Every NON-work template keeps this string
 *  unchanged — `e2e/toolbar-dispatch.spec.ts` (which seeds meridian/hearth) matches
 *  on `/design system/i`, and those assertions must stay green UNMODIFIED. */
const BACKGROUND_UNSUPPORTED_TITLE = 'Section backgrounds are coming with the design system.';

/**
 * True for the shared FOOTER chrome section only.
 *
 * phase 3.5: the `manage-links` placeholder is Footer's Beta action, NOT a generic
 * chrome one — `isChromeId` is too wide (it is true for the HEADER too, whose Beta
 * column is Menu, deferred entirely per ruling 9). Uses the same `${type}-${uuid}`
 * grammar as `sectionChipLabel` above, so a suffix-less legacy `footer` id matches.
 */
function isFooterId(sectionId: string): boolean {
  return sectionTypeOf(sectionId) === 'footer';
}

interface SectionToolbarProps {
  sectionId: string;
}

// Phase-3: the ToolbarShell decides visibility and owns positioning. This
// component is a dumb child of the shell's floating container.
export function SectionToolbar({ sectionId }: SectionToolbarProps) {
  const [showElementToggle, setShowElementToggle] = useState(false);
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Narrow selector: pull ONLY the fields/actions this toolbar reads. Actions are
  // stable refs; the state slices (content/sections/sectionLayouts/aiGeneration)
  // are the ones this component genuinely renders from.
  const {
    content,
    sections,
    sectionLayouts,
    announceLiveRegion,
    aiGeneration,
    showLayoutChangeModal,
    audienceType,
    templateId,
    regenerateSection,
  } = useEditStore(
    useShallow((s) => ({
      content: s.content,
      sections: s.sections,
      sectionLayouts: s.sectionLayouts,
      announceLiveRegion: s.announceLiveRegion,
      aiGeneration: s.aiGeneration,
      showLayoutChangeModal: s.showLayoutChangeModal,
      audienceType: s.audienceType,
      templateId: s.templateId,
      regenerateSection: s.regenerateSection,
    })),
  );

  // Swap-button visibility gate (scale-09 phase 5). For template-module projects
  // the "Layout" action only makes sense when the section has >1 ELIGIBLE variant
  // (BlockVariantSelector). A section can declare >1 variant yet have only one
  // meet its `requiresAssets` needs (e.g. meridian hero without a photo) — the
  // picker would then show a single, dead one-card modal (F18), so gate on the
  // eligible count (post-asset-filter), not the declared count. Legacy (non-
  // template) projects keep the button always — they use LayoutChangeSelector's
  // full library. currentLayout drives the manifest lookup (unlike sectionType,
  // it uniquely identifies the owning variant set).
  const currentSectionLayout = sectionLayouts[sectionId];
  const isTemplateModule = usesTemplateModule(audienceType, templateId);
  const showChangeLayout = isTemplateModule
    ? eligibleVariantCount(templateId, currentSectionLayout, content[sectionId]) > 1
    : true;

  // Handle layout change action
  const handleChangeLayout = (sectionId: string) => {
    const section = content[sectionId];
    const currentLayout = sectionLayouts[sectionId];

    if (!section || !currentLayout) {
      logger.error('Section or layout not found:', { sectionId, section, currentLayout });
      return;
    }

    // Get section type from layout name
    let sectionType = getSectionTypeFromLayout(currentLayout);

    // If couldn't determine from layout, try parsing section ID
    if (sectionType === 'hero') {
      const sectionIdMatch = sectionId.match(/^(header|footer|hero|features|pricing|testimonials|faq|cta|problem|results|security|socialProof|founderNote|integrations|objectionHandling|useCases|comparisonTable|closeSection|beforeAfter|howItWorks|uniqueMechanism)-/);

      if (sectionIdMatch) {
        sectionType = sectionIdMatch[1];
      }
    }

    logger.debug('Layout change:', { sectionId, currentLayout, sectionType });

    // Show the layout change modal
    showLayoutChangeModal(sectionId, sectionType, currentLayout, section.elements);
  };

  // ── Background gate (section-background phase 2, plan D7 + N2) ───────────────
  // TWO axes, resolved to one of three greyed reasons or "live":
  //   1. TEMPLATE — only skeleton-backed projects have a surface vocabulary whose
  //      blocks consume `var(--u-bg)`. Every other template keeps the verbatim
  //      pre-phase-2 tooltip (see BACKGROUND_UNSUPPORTED_TITLE).
  //   2. SECTION — the denylist above (hero → phase 3; header → D5; collection
  //      machinery → R1).
  const backgroundSupported = isSkeletonBacked(templateId);
  const backgroundDeniedReason = BACKGROUND_DENIED_SECTION_TYPES[sectionTypeOf(sectionId)];
  const backgroundDisabledTitle = !backgroundSupported
    ? BACKGROUND_UNSUPPORTED_TITLE
    : backgroundDeniedReason;

  // Close the panel on ANY section switch. This component is RE-RENDERED, not
  // remounted, when the user selects a different section while the toolbar shell
  // stays mounted — so `showBackgroundPanel` survives the switch. Without this the
  // panel stays open and silently re-points at the newly selected section (with a
  // chip row still reading as the previous one's until it re-renders). Firing on
  // mount too is harmless: the initial state is already closed.
  useEffect(() => {
    setShowBackgroundPanel(false);
  }, [sectionId]);

  // Close the panel if the gate flips underneath it (e.g. a template switch) —
  // otherwise a dropdown could outlive the button that owns it.
  useEffect(() => {
    if (backgroundDisabledTitle) setShowBackgroundPanel(false);
  }, [backgroundDisabledTitle]);

  const {
    duplicateSection,
    removeSection,
    moveSectionUp,
    moveSectionDown,
  } = useSectionCRUD();

  const section = content[sectionId];
  const sectionIndex = sections.indexOf(sectionId);

  // Get validation status from existing metadata (read-only)
  const validation = useMemo(() => {
    if (!section) return null;
    
    // Read validation from existing metadata instead of triggering validation
    const validationStatus = section.editMetadata?.validationStatus;
    if (validationStatus) {
      return {
        sectionId,
        valid: validationStatus.isValid,
        isValid: validationStatus.isValid,
        errors: validationStatus.errors?.map((e: any) => e.message) || [],
        completionPercentage: section.editMetadata?.completionPercentage || 0,
        missingElements: validationStatus.missingRequired || [],
        hasRequiredContent: validationStatus.missingRequired?.length === 0,
      };
    }
    
    // Fallback to basic validation without triggering state updates
    return {
      sectionId,
      valid: true,
      isValid: true,
      errors: [],
      completionPercentage: 100,
      missingElements: [],
      hasRequiredContent: true,
    };
  }, [sectionId, section?.editMetadata]);

  // Primary Actions with enhanced functionality
  const primaryActions = [
    {
      id: 'change-layout',
      label: 'Layout',
      icon: 'layout',
      handler: () => handleChangeLayout(sectionId),
    },
    {
      id: 'add-element',
      label: 'Elements',
      icon: 'plus',
      handler: () => setShowElementToggle(true),
    },
    // AI section regen (one-click, one-shot) — sits ahead of the structural
    // moves per the plan's grouping. Calls the existing `regenerateSection`
    // action (image/shape-preserving merge lives there). Disabled while any AI
    // generation is in flight; the in-flight progress card + completion message
    // below already provide feedback. Hidden on chrome via CHROME_HIDDEN_ACTIONS.
    {
      id: 'regen',
      label: 'Regen',
      icon: 'refresh',
      disabled: aiGeneration.isGenerating,
      handler: () => {
        regenerateSection(sectionId);
      },
    },
    {
      id: 'move-up',
      label: 'Move Up',
      icon: 'arrow-up',
      disabled: sectionIndex === 0,
      handler: () => {
        moveSectionUp(sectionId);
        announceLiveRegion(`Moved section up`);
      },
    },
    {
      id: 'move-down',
      label: 'Move Down',
      icon: 'arrow-down',
      disabled: sectionIndex === sections.length - 1,
      handler: () => {
        moveSectionDown(sectionId);
        announceLiveRegion(`Moved section down`);
      },
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      handler: async () => {
        const newSectionId = await duplicateSection(sectionId);
        announceLiveRegion(`Duplicated section as ${newSectionId}`);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      variant: 'danger',
      handler: async () => {
        const confirmed = await removeSection(sectionId);
        if (confirmed) {
          announceLiveRegion(`Deleted section ${sectionId}`);
        }
      },
    },
    // ── Footer → Manage links: GREYED PLACEHOLDER (phase 3.5, founder ruling 9) ──
    // FOOTER ONLY (see `isFooterId` + the filter below) — toolbarPlan's Footer Beta
    // column is `manage links · background`, and no other section type has it.
    //
    // DISABLED with ZERO functionality: footer links are not in the store at all
    // (ruling 2). They are per-template BLOCK CONTENT, and the shape is not even
    // consistent — NESTED (`FooterColumn.links`) in meridian/techpremium but FLAT in
    // surge (footerDefaults.ts:5-16) — with no add/update/remove/reorder actions
    // anywhere. Wiring it = net-new store surface + published coupling.
    {
      id: 'manage-links',
      label: 'Manage links',
      icon: 'link',
      disabled: true,
      disabledTitle: 'Footer link editing is coming — footer links aren’t in the editor store yet.',
      handler: () => {},
    },
    // ── Footer → Manage social: REAL, ENABLED (phase 4, t5) ────────────────────
    // FOOTER ONLY, and hosted HERE rather than on an element toolbar because phase
    // 4 verified that social icons are NOT spine-selectable: `ToolbarType`
    // (selectionPriority.ts:29) has no 'social' member, and NOTHING in src/ emits a
    // `data-element-key` for a `socialMediaConfig` item — that config is not rendered
    // by any block at all. The plan's step 2 anticipated exactly this ("if not,
    // surface Manage-items on the containing chrome-section (footer) toolbar
    // instead"), so this is the sanctioned fallback path, not a workaround.
    //
    // ⚠️ WHAT THIS EDITS — the site-level `socialMediaConfig` store slice (the
    // LinkPicker's derived Social options + the Brief bridge). It is NOT the
    // `social_links` BLOCK CONTENT a template footer actually renders (hearth
    // ContactFooterRich:24,35), which is edited inline per-template. Those two are
    // separate today; joining them is a published-output change ⇒ own spec.
    //
    // NOT a new capability (honesty): add/edit/remove/reorder already existed in
    // SocialMediaEditor and were already reachable from the app header menu
    // (GlobalAppHeader.tsx:188). Phase 4 adds the t5 reskin + THIS entry point.
    {
      id: 'manage-social',
      label: 'Manage social',
      icon: 'share',
      handler: () => showSocialModal(),
    },
    // ── Social → Orientation: GREYED PLACEHOLDER (founder ruling 9, plan D-2) ───
    // Rides WITH the social action (ruling 9 says it lands "with phase 4's toolbar"),
    // which means the footer toolbar — because that is where the social action ended
    // up (see above). Sits next to `manage-social` so the pair reads as one group.
    //
    // DISABLED with ZERO functionality: `SocialMediaConfig` (state.ts:141-145) has
    // no orientation field. Adding one = a new store field that BOTH published
    // renderers must read — the exact class of change rulings 2/3 defer and this
    // spec's no-published-output rule forbids.
    {
      id: 'social-orientation',
      label: 'Orientation',
      icon: 'orientation',
      disabled: true,
      disabledTitle:
        'Social layout options are coming — orientation isn’t stored on your site yet.',
      handler: () => {},
    },
    // ── Section → Background (section-background phase 2) ───────────────────────
    // Last, per toolbarPlan's Beta column order (`… Duplicate · Delete · Background`);
    // it is also Footer's second Beta action, so it is deliberately NOT filtered to
    // non-chrome sections.
    //
    // WAS a greyed placeholder for every template (phase 3.5, ruling 9). It is now
    // LIVE on skeleton-backed projects' body sections, and still greyed everywhere
    // else — see the gate above for the three distinct "why" strings.
    //
    // ⚠️ The old comment here claimed the blocker was that "the write has nowhere to
    // land — `data-surface` is derived from `getSurfaceForSection(sectionType)` with
    // no override argument, and no served template's blocks consume `var(--u-bg)`".
    // Both halves are now stale. The truth, and the reason the write is delivered on
    // TWO channels (plan D2), is:
    //   1. CSS channel — `serializeStyleTokens` emits `[data-sid]{--u-bg;--u-fg;…}`
    //      and every work-skeleton block root SELF-PAINTS `background:var(--u-bg,
    //      <default>)`. A wrapper-only override would be painted over by the block,
    //      so this channel is what actually recolours the band.
    //   2. Wrapper channel — `resolveSectionSurface` feeds the wrapper's
    //      `data-surface`, which carries what the vars don't: `paper-2`'s
    //      `border-block` hairline, template-agnostic consumers, and the
    //      `[data-surface][id]` pair `analyticsGenerator.js:126` reads.
    // The two are resolved from the SAME stored value (`styleTokens[sectionId]
    // .background`) but are NOT redundant — foreground and hairline genuinely differ
    // between them. The override is ID-keyed; `getSurfaceForSection`'s own override
    // param is TYPE-keyed skin data and is deliberately left alone (D6).
    {
      id: 'background',
      label: 'Background',
      icon: 'palette',
      disabled: Boolean(backgroundDisabledTitle),
      disabledTitle: backgroundDisabledTitle,
      handler: () => setShowBackgroundPanel((open) => !open),
    },
  ]
    .filter((action) => !isChromeId(sectionId) || !CHROME_HIDDEN_ACTIONS.includes(action.id))
    .filter((action) => action.id !== 'change-layout' || showChangeLayout)
    // phase 3.5: keep `manage-links` off headers and every body section — it must not
    // leak out of the footer. Kept as its own filter rather than folded into
    // CHROME_HIDDEN_ACTIONS, which is the inverse gate (hide ON chrome) and is
    // load-bearing for the header.
    //
    // phase 4: `manage-social` + `social-orientation` join the same footer-only gate.
    //
    // section-background phase 2: `background` is deliberately NOT in this list. It is
    // a whole-Section action (LIVE on skeleton-backed body sections, greyed elsewhere),
    // not a footer-only one, so every section type keeps the button and the two gates
    // above decide whether it is enabled — the header included, where it renders greyed
    // with the D5 "comes with the header toolbar" reason. Nothing pins that in e2e: on
    // the work skeleton an atelier header dispatches no toolbar at all today (see
    // `e2e/section-background.spec.ts`, gate test), so the header case was dropped.
    .filter((action) => !FOOTER_ONLY_ACTIONS.includes(action.id) || isFooterId(sectionId));

  // Check if this specific section is being regenerated
  const isRegenerating = aiGeneration.isGenerating && 
    aiGeneration.context?.type === 'section' && 
    aiGeneration.context?.sectionId === sectionId;

  // Check if regeneration just completed for this section
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const prevIsRegeneratingRef = useRef(false);

  // Track regeneration state changes to show completion message
  useEffect(() => {
    // Check if regeneration just completed
    if (prevIsRegeneratingRef.current && !isRegenerating) {
      // Regeneration just finished
      setShowCompletionMessage(true);
      
      // Hide completion message after 3 seconds
      const timer = setTimeout(() => {
        setShowCompletionMessage(false);
      }, 3000);
      
      // Announce completion
      announceLiveRegion('Section content regenerated successfully');
      
      // Store the timer to clear it on cleanup
      return () => {
        clearTimeout(timer);
      };
    }
    
    // Update the previous state
    prevIsRegeneratingRef.current = isRegenerating;
  }, [isRegenerating, announceLiveRegion]);

  // While regenerating (and for the 3s completion card) this component renders a
  // fixed bottom-right card INSTEAD of a toolbar. The t2 chrome box lives in the
  // shell now, so tell it to stand down — otherwise an empty dark pill carrying
  // only the disabled Design ▾ would hover over the section, where today the
  // toolbar simply disappears.
  useHideToolbarChrome(isRegenerating || showCompletionMessage);

  return (
    <>
      {/* Show loading bar when regenerating this section */}
      {isRegenerating && (
        <div 
          className="fixed bottom-8 right-8 z-50 transition-all duration-200"
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-1">
            <LoadingButtonBar
              label="🔄 Regenerating section content..."
              duration={4000}
              colorClass="bg-[#006CFF]"
            />
          </div>
        </div>
      )}
      
      {/* Show completion message */}
      {showCompletionMessage && (
        <div 
          className="fixed bottom-8 right-8 z-50 transition-all duration-300"
          style={{
            animation: 'slideInFromRight 0.3s ease-out',
          }}
        >
          <div className="bg-[#006CFF] text-white rounded-lg shadow-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium">
                Section content regenerated successfully!
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Original toolbar - only show when not regenerating. The t2 chrome box
          (bg/border/radius/shadow) is the SHELL's now; this body supplies the
          label chip + the action row only. */}
      {!isRegenerating && !showCompletionMessage && (
        <div ref={toolbarRef} className="flex items-center gap-0.5">
          {/* Section Indicator with Validation */}
          <ToolbarLabel
            dotClassName={
              validation?.isValid
                ? 'bg-green-400'
                : (validation?.completionPercentage || 0) > 50
                ? 'bg-yellow-400'
                : 'bg-red-400'
            }
            text={sectionChipLabel(sectionId)}
          >
            {isChromeId(sectionId) ? (
              <span className="text-[10px] font-medium text-[#e8e8ee] bg-white/10 rounded px-1.5 py-0.5 whitespace-nowrap">
                Shared · all pages
              </span>
            ) : (
              <span className="text-[11px] text-[#7b7b88]">
                {validation?.completionPercentage || 0}%
              </span>
            )}
          </ToolbarLabel>

          {/* Primary Actions */}
          {primaryActions.map((action, index) => {
            const actionDisabled = (action as any).disabled === true;
            const isBackground = action.id === 'background';
            const button = (
              <ToolbarButton
                data-action={action.id}
                onClick={(e) => {
                  // phase 3.5: placeholders are inert. `disabled` on the DOM node
                  // already stops real clicks; this also covers force-clicks.
                  if (actionDisabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  action.handler();
                }}
                disabled={actionDisabled}
                // phase 3.5: honour an explicit `disabledTitle` (the placeholders'
                // mandatory "why"). Falling back to `action.label` preserves the
                // pre-existing tooltip for the move-up/move-down disabled states,
                // which have no "why" copy of their own.
                disabledTitle={(action as any).disabledTitle ?? action.label}
                variant={(action as any).variant === 'danger' ? 'danger' : 'default'}
                active={isBackground && showBackgroundPanel}
                icon={<ActionIcon icon={action.icon} />}
                label={action.label}
              />
            );
            return (
              <React.Fragment key={action.id}>
                {index > 0 && <ToolbarDivider />}
                {isBackground && !actionDisabled ? (
                  // The panel is an `absolute top-full left-0` SIBLING of its
                  // button (TextToolbarMVP's picker precedent, documented at
                  // ToolbarShell.tsx:248). `relative` here — not on the row — keeps
                  // the dropdown anchored to the Background button rather than to
                  // the whole pill.
                  <div className="relative">
                    {button}
                    {showBackgroundPanel && (
                      <BackgroundPanel
                        sectionId={sectionId}
                        onClose={() => setShowBackgroundPanel(false)}
                      />
                    )}
                  </div>
                ) : (
                  button
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <ElementToggleModal
        sectionId={sectionId}
        open={showElementToggle}
        onOpenChange={setShowElementToggle}
      />
    </>
  );
}

// Enhanced Action Icon Component
function ActionIcon({ icon }: { icon: string }) {
  const iconMap = {
    'layout': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    'plus': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    'arrow-up': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
      </svg>
    ),
    'arrow-down': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    ),
    'copy': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    'trash': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    'palette': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
      </svg>
    ),
    'refresh': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    // phase 3.5: the natural link glyph for the footer's `manage-links` placeholder.
    // Without this entry the icon map's fallback would render a grey square — which
    // reads as a rendering BUG rather than a deliberate "coming" state.
    'link': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    // phase 4: the share glyph for the footer's real `manage-social` action.
    'share': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342A3 3 0 108.684 10.658m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    // phase 4: the natural glyph for the `social-orientation` placeholder. Like
    // `link` above, an explicit entry matters — the icon map's fallback is a grey
    // square, which reads as a rendering BUG rather than a deliberate "coming" state.
    'orientation': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  };

  return iconMap[icon as keyof typeof iconMap] || <div className="w-3 h-3 bg-gray-400 rounded-sm" />;
}