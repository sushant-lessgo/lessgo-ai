'use client';

// scale-06 phase 4 → scale-07 phase 4 — the universal STRUCTURE slot (7b gate).
// thing AND trust hit it now (work keeps its skip).
//
// MULTIPAGE mode (page-archetype menu): ports the product SitemapReviewStep
// sitemap-editing behavior AS-IS onto the wizard store (review / rename /
// reorder / add / remove pages + sections). scale-07 phase 5: detection is
// re-keyed off the template's `multipage` CAPABILITY (+ businessType
// structureDefault) via `isMultipage` — no vestria hardcode.
//
// SINGLE-PAGE mode (scale-07 phase 4, no menu — meridian + every trust
// template): ONE section list from the fetched strategy. Required engine-core
// sections are LOCKED (hero first, cta where the core demands it);
// capability/gated optionals toggle OFF only — NO add-section in single mode.
// "Looks good" = the shell's Continue (default accept in 1 tap). The confirmed
// (reduced, reordered) list is what generation copies — a toggled-off section
// gets NO copy.
//
// SOURCING (scale-07 phase 3): this slot OWNS the strategy sourcing. On mount,
// if the store has no strategy yet, it fires the store's `fetchStrategy`
// action (engine-aware: thing → runStrategy, trust → runTrustStrategy — the
// server charges credits + clamps) and renders a loading state. The status
// guard in `fetchStrategy` makes back-navigation charge-safe (a 'done' status
// never refetches).
//
// PERSISTENCE (scale-07 phase 6): the confirmed structure is PERSISTED to
// `Project.brief.structure` — the shell's Continue (the confirm tap) calls the
// store's save(), whose buildBriefPatch now carries `brief.structure` (mode +
// sections / pageDetails) through saveDraft's key-wise brief merge. This slot
// recomputes the required-capability set client-side on every structure edit
// (requiredCapabilitiesFromStructure — dropping a section relaxes hard-fit for
// the phase-7 swap shortlist) and feeds the PERSISTED `structure.mode`
// (rehydrated by the store) into `isMultipage`, so slot UI and generation read
// the same mode signal.
//
// FIREWALL: client-only. Reads/writes `useWizardStore`; imports the data-only
// pageArchetypes menu + engine contract helpers (no block components).

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Loader2, Plus, X } from 'lucide-react';
import { useWizardStore } from '@/hooks/useWizardStore';
import { lockedSectionsForEngine } from '@/modules/engines/inputContracts';
import {
  getPageArchetypesForTemplate,
  isMultipage,
  type PageArchetypeDef,
} from '@/modules/audience/product/pageArchetypes';
import { filterSectionsByProof } from '@/modules/audience/product/strategy/parseStrategyProduct';
import { humanizeGenerationError } from '@/modules/wizard/generation/errorMessage';
import { businessTypes } from '@/modules/businessTypes/config';
import { getCollectionDef, type CollectionKey } from '@/modules/collections/registry';
import type { CollectionEntry } from '@/modules/brief/collections';
import type { ProductStrategyOutput, SitemapPage } from '@/types/product';

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero',
  trust: 'Client logos',
  industries: 'Industries',
  about: 'About + stats',
  features: 'Services',
  catalog: 'Catalogue grid',
  materials: 'Materials',
  process: 'Process',
  testimonials: 'Testimonials',
  contact: 'Quote form',
};
const sectionLabel = (s: string) => SECTION_LABELS[s] ?? s;

// Single-page mode labels — engine-generic (the multipage map above keeps its
// vestria-specific wording, e.g. features → "Services").
const SINGLE_PAGE_LABELS: Record<string, string> = {
  hero: 'Hero',
  features: 'Features',
  services: 'Services',
  testimonials: 'Testimonials',
  packages: 'Packages',
  pricing: 'Pricing',
  cta: 'Call to action',
  logos: 'Client logos',
  about: 'About',
  casestudies: 'Case studies',
  stats: 'Results & stats',
};
const singlePageLabel = (s: string) => SINGLE_PAGE_LABELS[s] ?? SECTION_LABELS[s] ?? s;

const EMPTY_ENTRIES: CollectionEntry[] = [];

// scale-10 phase 4 — the COLLECTION channel at the 7b gate. ONE collapsible row
// per collection ("Products · 8 items"), entries editable (rename / remove /
// add name-only) — NEVER N flat AI section rows. This is a SEPARATE row type
// from the section/page rows above: it writes `Brief.facts.collections` via the
// store's collection actions (buildBriefPatch → save), and never touches
// toggleStructureSection. No waterfall change — collections are a parallel
// whole-list channel, not per-item ASK questions (decision 2).
function CollectionNode({ collectionKey }: { collectionKey: CollectionKey }) {
  const entries =
    useWizardStore((s) => s.collections[collectionKey]) ?? EMPTY_ENTRIES;
  const addCollectionEntry = useWizardStore((s) => s.addCollectionEntry);
  const renameCollectionEntry = useWizardStore((s) => s.renameCollectionEntry);
  const removeCollectionEntry = useWizardStore((s) => s.removeCollectionEntry);

  const def = getCollectionDef(collectionKey);
  const label = def?.label ?? collectionKey;
  const [open, setOpen] = useState(entries.length > 0);
  const [addValue, setAddValue] = useState('');

  const count = entries.length;

  const commitAdd = () => {
    const name = addValue.trim();
    if (!name) return;
    addCollectionEntry(collectionKey, name);
    setAddValue('');
    setOpen(true);
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
        <span className="font-medium text-gray-900">{label}</span>
        <span className="text-xs text-gray-500">
          · {count} {count === 1 ? 'item' : 'items'}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {count === 0 ? (
            <p className="text-xs text-gray-500">
              No {label.toLowerCase()} yet — add them here or later in the editor.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {entries.map((entry, idx) => (
                <li
                  // Slug-INDEPENDENT key: the slug re-derives on every keystroke
                  // (rename → slugify), so keying by slug would remount the input
                  // and drop focus. Index is stable (no per-entry reorder UI;
                  // inputs are fully store-controlled) — mirrors the sitemap
                  // page-row pattern (stable key, derived value rendered inside).
                  key={idx}
                  className="flex items-center gap-2 rounded-md bg-gray-50 border border-gray-100 px-3 py-1.5"
                >
                  <input
                    value={entry.name}
                    onChange={(e) =>
                      renameCollectionEntry(collectionKey, idx, e.target.value)
                    }
                    className="text-sm text-gray-800 flex-1 bg-transparent border-b border-transparent
                               hover:border-gray-300 focus:border-brand-accentPrimary focus:outline-none min-w-0"
                    aria-label={`${label} item name`}
                  />
                  <button
                    type="button"
                    onClick={() => removeCollectionEntry(collectionKey, idx)}
                    title="Remove item"
                    className="p-0.5 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              value={addValue}
              onChange={(e) => setAddValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitAdd();
                }
              }}
              placeholder={`Add ${label.toLowerCase().replace(/s$/, '')} name`}
              className="text-sm flex-1 rounded-md border border-gray-200 px-2.5 py-1.5
                         focus:border-brand-accentPrimary focus:outline-none min-w-0"
              aria-label={`Add ${label} item`}
            />
            <button
              type="button"
              onClick={commitAdd}
              disabled={!addValue.trim()}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md
                         bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-brand-accentPrimary
                         disabled:opacity-40 disabled:hover:bg-gray-100 disabled:hover:text-gray-600
                         transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Renders one CollectionNode per collection present in `facts.collections` OR
// declared by the businessType's `requiredCollections` (even when empty ⇒
// count-only/empty node, decision 2). Zero-entry state is allowed (the index
// page ships an empty-state later). Returns null when there are no collections
// to show, so single-page/multipage gates without collections are unchanged.
function CollectionNodes() {
  const businessTypeKey = useWizardStore((s) => s.businessTypeKey);
  const collections = useWizardStore((s) => s.collections);

  const keys = useMemo(() => {
    const required =
      (businessTypeKey && businessTypes[businessTypeKey]?.requiredCollections) || [];
    const present = Object.keys(collections) as CollectionKey[];
    return Array.from(new Set<CollectionKey>([...present, ...required]));
  }, [businessTypeKey, collections]);

  if (keys.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Collections</p>
      <div className="space-y-4">
        {keys.map((key) => (
          <CollectionNode key={key} collectionKey={key} />
        ))}
      </div>
    </div>
  );
}

export default function StructureSlot() {
  const templateId = useWizardStore((s) => s.templateId);
  const businessTypeKey = useWizardStore((s) => s.businessTypeKey);
  const engine = useWizardStore((s) => s.engine);
  const strategy = useWizardStore((s) => s.strategy) as ProductStrategyOutput | null;
  const storeSitemap = useWizardStore((s) => s.sitemap) as SitemapPage[] | null;
  const setSitemap = useWizardStore((s) => s.setSitemap);
  const strategyStatus = useWizardStore((s) => s.strategyStatus);
  const strategyError = useWizardStore((s) => s.strategyError);
  const strategyCreditsError = useWizardStore((s) => s.strategyCreditsError);
  const fetchStrategy = useWizardStore((s) => s.fetchStrategy);
  // Single-page mode (scale-07 phase 4).
  const structureSections = useWizardStore((s) => s.structureSections);
  const structureDisabled = useWizardStore((s) => s.structureDisabled);
  const toggleStructureSection = useWizardStore((s) => s.toggleStructureSection);
  const moveStructureSection = useWizardStore((s) => s.moveStructureSection);
  // Proof hard rule (scale 1-10 F22): the SAME proof signal the strategy path
  // feeds `assembleProductStrategy`, read client-side so a page ADDED at the gate
  // (and its addable-section chips) can never seed an unpromised proof section.
  const hasTestimonials = useWizardStore((s) => s.proof.hasTestimonials);
  // Structure persistence + hard-fit recompute (scale-07 phase 6).
  const briefStructureMode = useWizardStore((s) => s.briefStructureMode);
  const recomputeRequiredCapabilities = useWizardStore(
    (s) => s.recomputeRequiredCapabilities
  );

  const lockedSet = useMemo(
    () => new Set(engine ? lockedSectionsForEngine(engine) : []),
    [engine]
  );

  // Strategy sourcing (scale-07 phase 3): kick the charged fetch exactly once.
  // The store's status guard makes remounts/back-navigation no-ops.
  useEffect(() => {
    if (!strategy && strategyStatus === 'idle') void fetchStrategy();
  }, [strategy, strategyStatus, fetchStrategy]);

  // Hard-fit recompute (scale-07 phase 6): whenever the confirmed structure
  // changes (seed, toggle, reorder, page add/remove/edit), re-derive the
  // required-capability set from the SURVIVING sections — a dropped section's
  // owning capability leaves the requirement, so more templates become
  // swap-eligible (phase 7 reads the store's `requiredCapabilities`).
  useEffect(() => {
    recomputeRequiredCapabilities();
  }, [storeSitemap, structureSections, structureDisabled, recomputeRequiredCapabilities]);

  // Multi vs single mode (scale-07 phase 5 re-key): decided by the template's
  // `multipage` CAPABILITY + businessType structureDefault + (phase 6) the
  // PERSISTED confirmed `structure.mode` rehydrated by the store — an explicit
  // confirmed mode wins over the businessType default inside isMultipage, so
  // this slot and generation-side detection read the same persisted signal.
  const menu = useMemo(() => {
    const briefSignal =
      businessTypeKey || briefStructureMode
        ? {
            ...(businessTypeKey ? { businessType: businessTypeKey } : {}),
            ...(briefStructureMode ? { structure: { mode: briefStructureMode } } : {}),
          }
        : undefined;
    if (!isMultipage(templateId ?? undefined, briefSignal)) return [];
    return getPageArchetypesForTemplate(templateId ?? undefined) ?? [];
  }, [templateId, businessTypeKey, briefStructureMode]);
  const menuByKey = useMemo(() => new Map(menu.map((a) => [a.key, a])), [menu]);

  // Prefer prior edits (storeSitemap), else the strategy's proposal.
  const draft: SitemapPage[] | null = storeSitemap ?? strategy?.sitemap ?? null;

  // Strategy fetch failed — retry, never trap. The shell GATES Continue while
  // this error state is showing (F27b): the user can't walk a failed strategy
  // into a broken editor. `Try again` re-rolls; the escape hatch stays the
  // wizard Back button (single-page/skip paths are unaffected).
  if (strategyStatus === 'error') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Your site plan</h1>
        {strategyCreditsError ? (
          <>
            <p className="text-gray-600">
              You&apos;ve used your generation credits. Top up to continue.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="/dashboard/settings"
                className="px-5 py-2.5 rounded-lg bg-brand-accentPrimary text-white hover:bg-orange-500"
              >
                View plans
              </a>
              <button
                type="button"
                onClick={() => void fetchStrategy()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Try again
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-600">
              {strategyError
                ? humanizeGenerationError(strategyError)
                : 'We couldn’t draft your site plan.'}
            </p>
            <button
              type="button"
              onClick={() => void fetchStrategy()}
              className="px-5 py-2.5 rounded-lg bg-brand-accentPrimary text-white hover:bg-orange-500"
            >
              Try again
            </button>
          </>
        )}
      </div>
    );
  }

  // Drafting in flight (or the mount effect is about to kick it) — real
  // loading state, never a dead placeholder.
  if (!strategy && (strategyStatus === 'idle' || strategyStatus === 'fetching')) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Your site plan</h1>
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin text-brand-accentPrimary" />
          <span>Drafting the pages your site needs…</span>
        </div>
      </div>
    );
  }

  // ===== SINGLE-PAGE mode (no page-archetype menu — meridian + trust) =====
  // One section list: required (engine-core) sections locked, optionals toggle
  // OFF only, no adds; reorder within bounds (hero pinned first). Default
  // accept = the shell's Continue (1 tap).
  if (!menu.length) {
    const body = structureSections;
    if (!body || body.length === 0) {
      // Defensive: strategy present but no seeded list (shouldn't happen —
      // fetchStrategy seeds it). Nothing to configure; Continue stays open.
      return (
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-gray-900">Your page plan</h1>
          <p className="text-gray-600">
            This is a single-page site — nothing to configure. We&apos;ll write
            it next.
          </p>
        </div>
      );
    }

    const heroFirst = body[0] === 'hero';
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Your page plan</h1>
          <p className="mt-2 text-gray-600">
            We suggest these sections. Turn off anything you don&apos;t need —
            nothing is written until you approve the shape.
          </p>
        </div>

        <ul className="space-y-1.5">
          {body.map((sec, idx) => {
            const locked = lockedSet.has(sec);
            const off = structureDisabled.includes(sec);
            const isHero = sec === 'hero';
            const canUp = !isHero && idx > (heroFirst ? 1 : 0);
            const canDown = !isHero && idx < body.length - 1;
            return (
              <li
                key={sec}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
                  off
                    ? 'bg-gray-50 border-gray-100 opacity-50'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <span className={`text-sm flex-1 ${off ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                  {singlePageLabel(sec)}
                  {locked && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-400">
                      required
                    </span>
                  )}
                  {off && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-400 no-underline">
                      off
                    </span>
                  )}
                </span>
                {!isHero && (
                  <>
                    <button
                      type="button"
                      onClick={() => moveStructureSection(idx, -1)}
                      disabled={!canUp}
                      className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStructureSection(idx, 1)}
                      disabled={!canDown}
                      className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {off ? (
                  <button
                    type="button"
                    onClick={() => toggleStructureSection(sec)}
                    className="p-0.5 text-gray-400 hover:text-brand-accentPrimary"
                    title="Turn back on"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleStructureSection(sec)}
                    disabled={locked}
                    className="p-0.5 text-gray-400 hover:text-red-600 disabled:opacity-20"
                    title={locked ? 'Required section' : 'Turn off section'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <CollectionNodes />

        <p className="text-sm text-gray-500">
          Looks good? Hit Continue — we&apos;ll write the copy next.
        </p>
      </div>
    );
  }

  // Multi-page with strategy but no sitemap (defensive — clamp always yields
  // pages for multipage templates).
  if (!draft) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Your site plan</h1>
        <p className="text-gray-600">
          We&apos;ll draft the pages your site needs in a moment.
        </p>
      </div>
    );
  }

  // ===== draft edits (write straight to the store) =====
  const commit = (next: SitemapPage[]) => setSitemap(next);

  // Proof hard rule at the seed path (F22): unpromised proof sections are cut
  // from BOTH the added-page default sections AND the addable-section chips.
  const proofInput = { hasTestimonials };

  const updatePage = (idx: number, next: SitemapPage) =>
    commit(draft.map((p, i) => (i === idx ? next : p)));

  const removePage = (idx: number) => commit(draft.filter((_, i) => i !== idx));

  const addPage = (def: PageArchetypeDef) =>
    commit([
      ...draft,
      {
        archetypeKey: def.key,
        title: def.title,
        pathSlug: def.pathSlug,
        sections: filterSectionsByProof([...def.defaultSections], proofInput),
      },
    ]);

  const moveSection = (pageIdx: number, secIdx: number, dir: -1 | 1) => {
    const page = draft[pageIdx];
    if (!page) return;
    const to = secIdx + dir;
    if (to < 0 || to >= page.sections.length) return;
    const sections = [...page.sections];
    [sections[secIdx], sections[to]] = [sections[to], sections[secIdx]];
    updatePage(pageIdx, { ...page, sections });
  };

  const removeSection = (pageIdx: number, secIdx: number) => {
    const page = draft[pageIdx];
    if (!page) return;
    const def = menuByKey.get(page.archetypeKey);
    const sec = page.sections[secIdx];
    if (def?.requiredSections.includes(sec)) return; // required — non-removable
    updatePage(pageIdx, {
      ...page,
      sections: page.sections.filter((_, i) => i !== secIdx),
    });
  };

  const addSection = (pageIdx: number, sec: string) => {
    const page = draft[pageIdx];
    if (!page || page.sections.includes(sec)) return;
    updatePage(pageIdx, { ...page, sections: [...page.sections, sec] });
  };

  const includedKeys = new Set(draft.map((p) => p.archetypeKey));
  const addable = menu.filter((a) => !includedKeys.has(a.key));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Your site plan</h1>
        <p className="mt-2 text-gray-600">
          We suggest these pages. Adjust anything — nothing is written until you
          approve the shape.
        </p>
      </div>

      <div className="space-y-4">
        {draft.map((page, pageIdx) => {
          const def = menuByKey.get(page.archetypeKey);
          const isHome = !!def?.required;
          const available = filterSectionsByProof(
            def?.allowedSections ?? [],
            proofInput
          ).filter((s) => !page.sections.includes(s));
          return (
            <div key={page.archetypeKey} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-baseline gap-2 min-w-0">
                  <input
                    value={page.title}
                    onChange={(e) => updatePage(pageIdx, { ...page, title: e.target.value })}
                    className="font-medium text-gray-900 bg-transparent border-b border-transparent
                               hover:border-gray-300 focus:border-brand-accentPrimary focus:outline-none
                               min-w-0 max-w-[12rem]"
                    aria-label="Page title"
                  />
                  <span className="text-xs text-gray-400 font-mono flex-shrink-0">{page.pathSlug}</span>
                </div>
                {!isHome && (
                  <button
                    type="button"
                    onClick={() => removePage(pageIdx)}
                    title="Remove page"
                    className="p-1 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {page.reason && <p className="text-xs text-gray-500 mb-3">{page.reason}</p>}

              <ul className="space-y-1.5">
                {page.sections.map((sec, secIdx) => {
                  const required = def?.requiredSections.includes(sec);
                  return (
                    <li
                      key={sec}
                      className="flex items-center gap-2 rounded-md bg-gray-50 border border-gray-100 px-3 py-1.5"
                    >
                      <span className="text-sm text-gray-800 flex-1">
                        {sectionLabel(sec)}
                        {required && <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-400">required</span>}
                      </span>
                      <button
                        type="button"
                        onClick={() => moveSection(pageIdx, secIdx, -1)}
                        disabled={secIdx === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(pageIdx, secIdx, 1)}
                        disabled={secIdx === page.sections.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(pageIdx, secIdx)}
                        disabled={required}
                        className="p-0.5 text-gray-400 hover:text-red-600 disabled:opacity-20"
                        title={required ? 'Required section' : 'Remove section'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {available.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {available.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSection(pageIdx, s)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full
                                 bg-gray-100 text-gray-600 hover:bg-orange-50
                                 hover:text-brand-accentPrimary transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {sectionLabel(s)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {addable.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Add a page:</p>
          <div className="flex flex-wrap gap-2">
            {addable.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => addPage(a)}
                title={a.description}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg
                           border border-gray-200 text-gray-700 hover:border-orange-200
                           hover:text-brand-accentPrimary hover:bg-orange-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {a.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <CollectionNodes />
    </div>
  );
}
