// app/edit/[token]/components/layout/LeftPanel.tsx - Section Outline + Review Checklist
"use client";

import { useState, useEffect } from 'react';
import { useEditStoreContext, useStoreState } from '@/components/EditProvider';
import { useReviewState } from '@/hooks/useReviewState';
import { AppIcon } from '@/components/ui/icon';
import { Coming } from '@/components/ui/coming';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { CmsPanel, MANAGE_COLLECTIONS_EVENT } from '../cms/CmsPanel';

const getSectionLabel = (sectionId: string): string => {
  const type = sectionId.split('-')[0];
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Per-type Material Symbols ligatures (t1 rail rows). Replaces the emoji set —
// presentation only; the keys and the `custom`/fallback behavior are unchanged.
// Every name here is verified present in the subset font's icons.txt.
const SECTION_ICONS: Record<string, string> = {
  header: 'web_asset', hero: 'bolt', features: 'auto_awesome', testimonials: 'format_quote',
  cta: 'ads_click', faq: 'help', footer: 'bottom_navigation', pricing: 'sell',
  results: 'insights', objection: 'verified', howitworks: 'schema', founder: 'person',
  beforeafter: 'swap_horiz', custom: 'widgets',
};

// t1 gives the active row's icon FILL 1 on `bolt`; applied to whichever icon the
// active row happens to use.
const SECTION_ICON_FALLBACK = 'description';

// ---------------------------------------------------------------------------
// GettingStartedChecklist — shown when leftPanel.activeTab === 'review'.
// Renders the curated 4-item "Getting started" guide (auto-checked from content).
// No manual ticking: `done` is derived from live content by useReviewState.
// ---------------------------------------------------------------------------

function GettingStartedChecklist() {
  const { guideTasks } = useReviewState();
  const { store } = useEditStoreContext();

  // Only surfaces the page actually has.
  const visibleTasks = guideTasks.filter(t => t.present);

  const handleBack = () => {
    store?.getState()?.setLeftPanelTab('pageStructure');
  };

  const handleTaskClick = (target?: { sectionId: string; elementKey: string }) => {
    if (!target) return;
    const { sectionId, elementKey } = target;
    const sectionEl = document.querySelector(`[data-section-id="${sectionId}"]`);
    sectionEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      const el = sectionEl?.querySelector(`[data-element-key="${elementKey}"]`);
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  return (
    <div className="p-2.5">
      <button
        onClick={handleBack}
        className="mb-3 flex items-center gap-1 rounded-app-badge px-1.5 py-1 text-[12px] font-medium text-app-primary transition-colors hover:bg-app-hover"
      >
        <AppIcon name="arrow_back" size={16} />
        Back to sections
      </button>

      <h3 className="mb-2 px-2 text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint">
        Setup
      </h3>

      {visibleTasks.length === 0 ? (
        <p className="px-2 text-[13px] text-app-faint">Nothing to set up.</p>
      ) : (
        <div className="space-y-0.5">
          {visibleTasks.map(task => (
            <button
              key={task.id}
              onClick={() => handleTaskClick(task.target)}
              className={`group flex w-full items-center gap-[9px] rounded-lg px-[9px] py-2 text-left transition-colors hover:bg-app-hover ${
                task.done ? 'opacity-60' : ''
              }`}
              title={task.target ? `Go to ${task.label}` : task.label}
            >
              {/* Auto-check state — tick when done, open circle otherwise */}
              <span
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] ${
                  task.done
                    ? 'border border-app-success/30 bg-app-success-bg text-app-success'
                    : 'border border-app-border-soft text-transparent'
                }`}
                aria-hidden
              >
                <AppIcon name="check" size={13} />
              </span>
              <span
                className={`flex-1 truncate text-[13px] ${
                  task.done ? 'text-app-faint line-through' : 'font-medium text-app-label group-hover:text-app-ink'
                }`}
              >
                {task.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LeftPanel
// ---------------------------------------------------------------------------

/**
 * RAIL TABS (t1: `Sections | Pages | CMS | Theme`).
 *
 * `Sections` and — since cms-collections phase 8B — `CMS` are REAL surfaces.
 * Pages/Theme are drawn by the handoff but nothing implements them, so they
 * render via <Coming> (decision 15: the component, never the bare class — it
 * carries aria-disabled + the "why" tooltip inseparably) rather than being
 * omitted. Those two belong to the ui-redesign track.
 *
 * ⚠️ THE CMS TAB IS THE ONLY CMS ENTRY POINT. Phase 6 shipped a second one (a
 * "Collections" button in GlobalAppHeader) on the false premise that no rail
 * existed — leaving a greyed "CMS — coming soon" tab next to a working button.
 * Do not re-add a header entry; move this one if the IA changes.
 *
 * Geometry note for phase 4 (decision 17): <Coming> renders its own
 * `inline-flex items-center gap-1.5` span. Inside a SegmentedControl option
 * `label` this composes FINE — the option button is already inline-flex, so the
 * nested span adds no visible box. No new grey-out style was needed here.
 */
const RAIL_TABS = [
  { value: 'sections', label: 'Sections' },
  { value: 'pages', label: <Coming what="the pages panel">Pages</Coming> },
  // LABEL ONLY reads "Content" (matches the dashboard's Content tab). The VALUE
  // stays 'cms' — `RailTab`, `LIVE_RAIL_TABS` and the `lessgo:manage-collections`
  // switch all key off it; renaming the value breaks that plumbing silently.
  { value: 'cms', label: 'Content' },
  { value: 'theme', label: <Coming what="the rail theme panel">Theme</Coming> },
];

/** The rail tabs that are actually wired (the rest are inert `<Coming>`). */
type RailTab = 'sections' | 'cms';
const LIVE_RAIL_TABS: readonly string[] = ['sections', 'cms'];

export function LeftPanel() {
  const { store, tokenId } = useEditStoreContext();
  const leftPanel = useStoreState(state => state.leftPanel);
  const sections = useStoreState(state => state.sections);
  // Read-only: drives the t1 active-row treatment. No write path added here.
  const selectedSection = useStoreState(state => state.selectedSection);
  const { allComplete } = useReviewState();

  const storeState = store?.getState();
  const setLeftPanelWidth = storeState?.setLeftPanelWidth;
  const toggleLeftPanel = storeState?.toggleLeftPanel;

  const [isResizing, setIsResizing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // The rail tab is LOCAL state, deliberately. `leftPanel.activeTab` in the store
  // is a DIFFERENT axis with a different closed union ('pageStructure' | 'review'
  // | …) that drives the Setup checklist; widening it would mean editing
  // `types/store/state.ts` + `actions.ts`, neither of which this phase may touch,
  // for no behavioural gain — nothing outside this component reads the rail tab.
  const [railTab, setRailTab] = useState<RailTab>('sections');
  // A collection the CMS panel should open on, when the cue arrived while the
  // panel was unmounted (see the two-listener note in CmsPanel). CONSUME-ONCE —
  // see the clearing effect below.
  const [cmsTarget, setCmsTarget] = useState<string | null>(null);

  // Hide the Setup tab entirely once every guide task is done — even if the
  // active tab is still 'review', fall back to the sections view.
  const isReviewMode = leftPanel.activeTab === 'review' && !allComplete;
  // Review mode (the Setup checklist) takes precedence: it hides the tab strip
  // entirely, so a CMS selection cannot be reached or changed while it is on.
  const isCmsMode = !isReviewMode && railTab === 'cms';

  useEffect(() => setMounted(true), []);

  // "Manage items" on a placed collection block asks for this surface. The panel
  // itself also listens (for the already-mounted case); this listener is the half
  // that can SWITCH TABS, which the unmounted panel cannot do for itself.
  useEffect(() => {
    const onManage = (e: Event) => {
      const id = (e as CustomEvent<{ collectionId?: string }>).detail?.collectionId;
      setRailTab('cms');
      if (id) setCmsTarget(id);
    };
    window.addEventListener(MANAGE_COLLECTIONS_EVENT, onManage);
    return () => window.removeEventListener(MANAGE_COLLECTIONS_EVENT, onManage);
  }, []);

  // CONSUME-ONCE. `CmsPanel` reads `initialCollectionId` ONLY in a `useState`
  // initializer, so it is spent the moment the panel mounts — but the value
  // stayed here, and EVERY later remount (tab away and back, panel
  // collapse/expand) re-opened the item browser on it unbidden. Clearing it
  // right after the mount that used it is safe (the child ran its initializer
  // during that render, before this effect) and leaves the already-mounted case
  // to the panel's own listener. Same family as phase 6's "`editing` never
  // resets" carry.
  useEffect(() => {
    if (isCmsMode && cmsTarget) setCmsTarget(null);
  }, [isCmsMode, cmsTarget]);

  // Resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth >= 250 && newWidth <= 500) {
        setLeftPanelWidth?.(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setLeftPanelWidth]);

  const handleSectionClick = (sectionId: string) => {
    document.querySelector(`[data-section-id="${sectionId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!mounted) return null;

  if (leftPanel.collapsed) {
    return (
      <div className="flex h-full flex-col bg-app-surface">
        <button
          onClick={toggleLeftPanel}
          className="flex h-12 w-12 items-center justify-center border-b border-app-border-frame text-app-icon-faint transition-colors hover:bg-app-hover hover:text-app-ink"
          title="Show panel"
        >
          <AppIcon name="chevron_right" size={20} />
        </button>
        <div className="flex flex-1 items-center justify-center py-4">
          <div className="-rotate-90 whitespace-nowrap text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint">
            {isReviewMode ? 'Setup' : 'Page'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full bg-app-surface transition-all duration-300"
      style={{ width: `${leftPanel.width}px` }}
    >
      <div className="flex h-full flex-1 flex-col">
        {/* Rail tabs (t1) — only `Sections` is wired; the rest render greyed. */}
        {!isReviewMode && (
          <div className="flex-shrink-0 px-3 pb-1 pt-3">
            <SegmentedControl
              aria-label="Left rail panel"
              value={railTab}
              // Pages/Theme are inert: <Coming> swallows the click in the capture
              // phase, so this never fires for them. The allow-list is
              // belt-and-braces — a `<Coming>` removed by accident must not
              // silently become a selectable tab with no body.
              onValueChange={(next) => {
                if (LIVE_RAIL_TABS.includes(next)) setRailTab(next as RailTab);
              }}
              options={RAIL_TABS}
              className="w-full justify-between gap-0 rounded-app-ctl-sm bg-app-track p-[3px] [&>button]:flex-1 [&>button]:justify-center [&>button]:px-2 [&>button]:text-[12px]"
            />
          </div>
        )}

        {/* Header */}
        <div className="flex h-10 flex-shrink-0 items-center justify-between pl-4 pr-2.5">
          <h2 className="text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint">
            {isReviewMode ? 'Setup' : isCmsMode ? 'Collections' : 'Page sections'}
          </h2>
          <div className="flex items-center gap-0.5">
            {/* t1 draws an `add` affordance here. Add-section is owned by
                AddSectionButton / EnhancedAddSection, NOT this rail — there is
                no handler at this mount, so the slot renders greyed rather than
                being omitted or fake-wired. (CMS has its own "New collection"
                row, so the greyed slot is not shown on that tab.) */}
            {!isReviewMode && !isCmsMode && (
              <Coming what="adding sections from the rail" side="left" className="p-1">
                <AppIcon name="add" size={18} />
              </Coming>
            )}
            <button
              onClick={toggleLeftPanel}
              className="rounded-app-badge p-1 text-app-icon-faint transition-colors hover:bg-app-hover hover:text-app-ink"
              title="Hide Panel"
            >
              <AppIcon name="chevron_left" size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isReviewMode ? (
            <GettingStartedChecklist />
          ) : isCmsMode ? (
            /* The ONE CMS entry point (see the RAIL_TABS note). Mounted only
               while this tab is selected, which is what keeps its data fetch to
               one-per-open rather than one-per-editor-load. */
            <CmsPanel tokenId={tokenId} initialCollectionId={cmsTarget} />
          ) : (
            <div className="px-2.5 pb-3">
              <div className="space-y-0.5">
                {sections.map((sectionId) => {
                  const isActive = selectedSection === sectionId;
                  return (
                    <button
                      key={sectionId}
                      onClick={() => handleSectionClick(sectionId)}
                      className={`group flex w-full items-center gap-[9px] rounded-lg px-[9px] py-2 text-left text-[13px] transition-colors ${
                        isActive
                          ? 'bg-app-tint font-semibold text-app-primary-deep shadow-[inset_2px_0_0_#006CFF]'
                          : 'font-medium text-app-label hover:bg-app-hover'
                      }`}
                    >
                      {/* Drag-to-reorder is drawn by t1 but not wired in this rail. */}
                      <Coming what="reordering sections from the rail" side="right">
                        <AppIcon name="drag_indicator" size={16} />
                      </Coming>
                      <AppIcon
                        name={SECTION_ICONS[sectionId.split('-')[0].toLowerCase()] || SECTION_ICON_FALLBACK}
                        size={17}
                        filled={isActive}
                        className={isActive ? 'text-app-primary' : 'text-app-icon-muted'}
                      />
                      <span className="flex-1 truncate">{getSectionLabel(sectionId)}</span>
                      {/* Per-section show/hide is drawn by t1; no toggle exists.
                          NOTE: no hover-reveal here on purpose — `.app-coming`
                          sets `opacity:.5` from app-chrome.css, which is imported
                          AFTER the Tailwind utilities, so an `opacity-0
                          group-hover:opacity-50` pair would lose the cascade and
                          the icon would just sit at .5 anyway. Constant .5 is the
                          honest rendering of what actually paints. */}
                      <Coming what="hiding sections" side="left">
                        <AppIcon name="visibility" size={16} />
                      </Coming>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="group flex w-1.5 cursor-ew-resize items-center justify-center border-l border-app-border-frame transition-colors hover:bg-app-tint"
        onMouseDown={handleMouseDown}
        title="Resize panel"
      >
        <div className="h-6 w-px rounded-full bg-app-border-soft transition-colors group-hover:bg-app-primary" />
      </div>
    </div>
  );
}
