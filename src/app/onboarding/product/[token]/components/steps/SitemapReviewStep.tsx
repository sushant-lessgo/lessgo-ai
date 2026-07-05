'use client';

// Sitemap review — the HUMAN GATE on the site's shape (newGeneration Phase 2).
// AI proposes the pages + each page's section order (strategy Step 5, clamped
// server-side); the user reviews/edits/approves BEFORE any copy is generated —
// no tokens spent writing pages that get cut, and the user owns the structure.
//
// UnderstandingStep pattern: auto-fire on mount when data absent → localEdits
// buffer → commit on continue. Strategy is stored in the generation store and
// REUSED by GeneratingStep (no second strategy charge).

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowDown, ArrowUp, Loader2, Plus, X } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useProductGenerationStore } from '@/hooks/useProductGenerationStore';
import { Button } from '@/components/ui/button';
import ErrorRetry from '@/components/onboarding/shared/ErrorRetry';
import {
  getPageArchetypesForTemplate,
  type PageArchetypeDef,
} from '@/modules/audience/product/pageArchetypes';
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

export default function SitemapReviewStep() {
  const router = useRouter();
  const params = useParams();
  const tokenId = params?.token as string;
  const posthog = usePostHog();

  const templateId = useProductGenerationStore((s) => s.templateId);
  const productName = useProductGenerationStore((s) => s.productName);
  const oneLiner = useProductGenerationStore((s) => s.oneLiner);
  const understanding = useProductGenerationStore((s) => s.understanding);
  const landingGoal = useProductGenerationStore((s) => s.landingGoal);
  const offer = useProductGenerationStore((s) => s.offer);
  const strategy = useProductGenerationStore((s) => s.strategy);
  const savedSitemap = useProductGenerationStore((s) => s.sitemap);
  const setStrategy = useProductGenerationStore((s) => s.setStrategy);
  const setSitemap = useProductGenerationStore((s) => s.setSitemap);
  const nextStep = useProductGenerationStore((s) => s.nextStep);
  const goToStep = useProductGenerationStore((s) => s.goToStep);

  const menu = getPageArchetypesForTemplate(templateId) ?? [];
  const menuByKey = new Map(menu.map((a) => [a.key, a]));

  // Re-entering the gate (Back from a later step) restores prior EDITS, not the
  // original AI proposal.
  const [draft, setDraft] = useState<SitemapPage[] | null>(
    savedSitemap ?? strategy?.sitemap ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditsError, setCreditsError] = useState(false);
  const hasFetched = useRef(false);

  const fetchStrategy = useCallback(async () => {
    if (!understanding || !landingGoal) {
      setError('Missing onboarding data. Please restart from the beginning.');
      return;
    }
    setLoading(true);
    setError(null);
    setCreditsError(false);
    const audiences = understanding.audiences ?? [];
    try {
      const res = await fetch('/api/audience/product/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim() || 'Your Product',
          oneLiner,
          features: understanding.features ?? [],
          landingGoal,
          offer,
          primaryAudience: audiences[0] || 'early adopters',
          otherAudiences: audiences.slice(1),
          categories: understanding.categories ?? [],
          templateId,
        }),
      });
      const json = await res.json();
      posthog?.capture('product_strategy_call_complete', {
        success: !!json?.success,
        creditsUsed: json?.creditsUsed,
        creditsRemaining: json?.creditsRemaining,
        audienceType: 'product',
        gate: 'sitemap',
      });
      if (!res.ok || !json?.success) {
        if (res.status === 402 || /credit/i.test(json?.error ?? '')) {
          setCreditsError(true);
          return;
        }
        throw new Error(json?.message || 'Strategy generation failed');
      }
      const s = json.data as ProductStrategyOutput;
      setStrategy(s);
      setDraft(s.sitemap ?? []);
    } catch (e: any) {
      setError(e?.message || 'Strategy generation failed.');
    } finally {
      setLoading(false);
    }
  }, [understanding, landingGoal, productName, oneLiner, offer, templateId, posthog, setStrategy]);

  useEffect(() => {
    // No menu (single-page template) — nothing to review; shouldn't normally
    // land here, but never trap the user.
    if (!menu.length) {
      goToStep('generating');
      return;
    }
    if (hasFetched.current || strategy) return;
    hasFetched.current = true;
    fetchStrategy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== draft edits (local until Continue) =====

  const updatePage = (idx: number, next: SitemapPage) =>
    setDraft((d) => (d ? d.map((p, i) => (i === idx ? next : p)) : d));

  const removePage = (idx: number) =>
    setDraft((d) => (d ? d.filter((_, i) => i !== idx) : d));

  const addPage = (def: PageArchetypeDef) =>
    setDraft((d) => [
      ...(d ?? []),
      {
        archetypeKey: def.key,
        title: def.title,
        pathSlug: def.pathSlug,
        sections: [...def.defaultSections],
      },
    ]);

  const moveSection = (pageIdx: number, secIdx: number, dir: -1 | 1) => {
    const page = draft?.[pageIdx];
    if (!page) return;
    const to = secIdx + dir;
    if (to < 0 || to >= page.sections.length) return;
    const sections = [...page.sections];
    [sections[secIdx], sections[to]] = [sections[to], sections[secIdx]];
    updatePage(pageIdx, { ...page, sections });
  };

  const removeSection = (pageIdx: number, secIdx: number) => {
    const page = draft?.[pageIdx];
    if (!page) return;
    const def = menuByKey.get(page.archetypeKey);
    const sec = page.sections[secIdx];
    if (def?.requiredSections.includes(sec)) return; // required — non-removable
    updatePage(pageIdx, { ...page, sections: page.sections.filter((_, i) => i !== secIdx) });
  };

  const addSection = (pageIdx: number, sec: string) => {
    const page = draft?.[pageIdx];
    if (!page || page.sections.includes(sec)) return;
    updatePage(pageIdx, { ...page, sections: [...page.sections, sec] });
  };

  const handleContinue = () => {
    if (!draft?.length) return;
    setSitemap(draft);
    posthog?.capture('product_sitemap_gate_approved', {
      pageCount: draft.length,
      pages: draft.map((p) => p.archetypeKey),
      audienceType: 'product',
    });
    nextStep();
  };

  // ===== views =====

  if (creditsError) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Out of credits</h3>
        <p className="text-gray-600 mb-6">
          You&apos;ve used your generation credits. Top up to continue.
        </p>
        <a
          href="/dashboard/settings"
          className="px-5 py-2.5 rounded-lg bg-brand-accentPrimary text-white hover:bg-orange-500"
        >
          View plans
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorRetry
        title="Couldn't draft your site plan"
        message={error}
        onRetry={() => {
          hasFetched.current = false;
          setError(null);
          fetchStrategy();
        }}
        retryLabel="Try again"
        onSecondary={() => router.push(`/edit/${tokenId}`)}
        secondaryLabel="Skip to editor"
      />
    );
  }

  if (loading || !draft) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-accentPrimary mb-4" />
        <h2 className="text-lg font-medium text-gray-900">Drafting your site plan…</h2>
        <p className="text-sm text-gray-500 mt-1">
          Which pages your site needs, and what goes on each.
        </p>
      </div>
    );
  }

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
          const available = (def?.allowedSections ?? []).filter(
            (s) => !page.sections.includes(s)
          );
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

      <Button
        onClick={handleContinue}
        disabled={!draft.length}
        className="w-full bg-brand-accentPrimary hover:bg-orange-500"
        size="lg"
      >
        Looks good — write the copy
      </Button>
    </div>
  );
}
