'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import {
  useProductGenerationStore,
  type VestriaHeroVariant,
} from '@/hooks/useProductGenerationStore';
import HeroVariantPicker from '../fields/HeroVariantPicker';
import ProductStylePicker from '../fields/ProductStylePicker';
import { usePostHog } from 'posthog-js/react';
import ErrorRetry from '@/components/onboarding/shared/ErrorRetry';
import type { SectionCopy } from '@/types/generation';
import type { ProductStrategyOutput } from '@/types/product';
import {
  defaultMeridianPalette,
  defaultMeridianVariant,
  defaultTechPremiumPalette,
  defaultTechPremiumVariant,
  defaultVestriaPalette,
  defaultVestriaVariant,
} from '@/types/product';
import { buildTechPremiumHomeFinalContent } from '@/hooks/editStore/archetypes';
import { selectProductBlocks } from '@/modules/audience/product/selectBlocks';
import { isManufacturerFlow } from '@/modules/audience/product/manufacturerFlow';
import {
  buildMultiPageSkeleton,
  mergePageIntoFinalContent,
  finalizeMultiPageGeneration,
  isResumableGeneration,
  type MultiPageOnboardingData,
} from '@/modules/generation/multiPageAssembly';
import type { SitemapPage } from '@/types/product';
import { isImagesAtBirthEnabled } from '@/lib/generation/flag';
import { legacyGoalToBriefGoal } from '@/modules/brief/bridge';
import { seedGoalForm } from '@/modules/goals/seedGoalForm';
import { injectImagesForPage } from '@/lib/generation/imagesAtBirth';
// Plain data module (fields only, no component code) — safe to import statically
// without breaching the template bundle firewall.
import {
  DEFAULT_VESTRIA_LEAD_FIELDS,
  VESTRIA_LEAD_SUBMIT_TEXT,
  VESTRIA_LEAD_SUCCESS_MESSAGE,
} from '@/modules/templates/vestria/blocks/Contact/contactFields';

type Stage = 'strategy' | 'copy' | 'saving' | 'done';

interface StageDef {
  id: Stage;
  label: string;
}

const STAGES: StageDef[] = [
  { id: 'strategy', label: 'Building your strategy' },
  { id: 'copy', label: 'Writing the copy' },
  { id: 'saving', label: 'Saving the draft' },
];

// Pilot locks (P4). Picker enabling these is P6.
const PILOT_PALETTE = defaultMeridianPalette; // 'mint'
const PILOT_VARIANT = defaultMeridianVariant; // 'developer'
const PILOT_TEMPLATE = 'meridian';

const VESTRIA_HERO_LAYOUTS = ['VestriaTailoredHero', 'VestriaFullBleedHero'];

/**
 * Apply the picked vestria hero variant into a finalContent payload (mutates).
 * The AUTHORITATIVE field is `content[heroId].layout` — that's what the
 * renderers and getSchemaDefaults read; `sectionLayouts[heroId]` is mirrored
 * for consistency (matches updateSectionLayout). Hero sections are located by
 * their `${type}-${uuid}` id prefix, and only entries already carrying a
 * vestria hero layout are touched (meridian/service payloads pass through
 * untouched even if this were ever miscalled). Covers BOTH the flat top-level
 * content AND per-page entries in fc.pages (after a DB round-trip they are no
 * longer shared references).
 */
function applyHeroVariantToFinalContent(fc: any, variant: VestriaHeroVariant): void {
  if (!fc) return;

  const applyTo = (
    content: Record<string, any> | undefined,
    sectionLayouts: Record<string, string> | undefined
  ) => {
    if (!content) return;
    for (const id of Object.keys(content)) {
      if (!id.startsWith('hero-')) continue;
      const entry = content[id];
      if (!entry || !VESTRIA_HERO_LAYOUTS.includes(entry.layout)) continue;
      entry.layout = variant; // authoritative
      if (sectionLayouts && id in sectionLayouts) sectionLayouts[id] = variant; // mirror
    }
  };

  applyTo(fc.content, fc.layout?.sectionLayouts);
  if (fc.pages) {
    for (const key of Object.keys(fc.pages)) {
      const page = fc.pages[key];
      applyTo(page?.content, page?.sectionLayouts);
    }
  }
}

export default function GeneratingStep() {
  const router = useRouter();
  const params = useParams();
  const tokenId = params?.token as string;
  const posthog = usePostHog();

  const productName = useProductGenerationStore((s) => s.productName);
  const oneLiner = useProductGenerationStore((s) => s.oneLiner);
  const understanding = useProductGenerationStore((s) => s.understanding);
  const landingGoal = useProductGenerationStore((s) => s.landingGoal);
  const goalParam = useProductGenerationStore((s) => s.goalParam);
  const offer = useProductGenerationStore((s) => s.offer);
  const importedTestimonials = useProductGenerationStore((s) => s.importedTestimonials);
  const importSourceUrl = useProductGenerationStore((s) => s.importSourceUrl);
  const storeTemplateId = useProductGenerationStore((s) => s.templateId);
  const storeStrategy = useProductGenerationStore((s) => s.strategy);
  const storeSitemap = useProductGenerationStore((s) => s.sitemap);
  const setGenerationError = useProductGenerationStore((s) => s.setGenerationError);
  const heroVariant = useProductGenerationStore((s) => s.heroVariant);
  const setHeroVariant = useProductGenerationStore((s) => s.setHeroVariant);

  const [stage, setStage] = useState<Stage>('strategy');
  const [creditsError, setCreditsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Multi-page fan-out progress ("Writing the copy — page X of N").
  const [pageProgress, setPageProgress] = useState<{ done: number; total: number } | null>(null);
  const startedAt = useRef<number>(Date.now());
  const hasRun = useRef(false);

  const buildFinalContent = (
    strategy: ProductStrategyOutput,
    sections: Record<string, SectionCopy>,
    title: string
  ) => {
    // strategy.sections are lowercase section types; strategy.uiblocks maps each
    // to a Meridian layout name (PascalCase). sectionType is the authoritative key.
    const sectionTypes = strategy.sections;
    const sectionIds = sectionTypes.map(
      (t) => `${t}-${crypto.randomUUID().slice(0, 8)}`
    );

    const sectionLayouts: Record<string, string> = {};
    const content: Record<string, any> = {};

    sectionIds.forEach((id, i) => {
      const sectionType = sectionTypes[i];
      const layout = strategy.uiblocks[sectionType] || 'default';
      sectionLayouts[id] = layout;

      const elements = sections[sectionType]?.elements ?? {};
      content[id] = {
        id,
        layout,
        elements,
        backgroundType: 'neutral',
        aiMetadata: {
          aiGenerated: true,
          isCustomized: false,
          lastGenerated: Date.now(),
          aiGeneratedElements: Object.keys(elements),
          excludedElements: [],
        },
      };
    });

    // Lead-form provisioning (vestria contact section) — mirror of pageActions'
    // ensureContactForm: a real MVPForm in finalContent.forms (top level — where
    // loadFromDraft restores from) + the section's form_id, so form.v1.js wires
    // up on publish and submissions land in the dashboard.
    let forms: Record<string, any> | undefined;
    if (storeTemplateId === 'vestria') {
      const contactId = sectionIds.find((id, i) => sectionTypes[i] === 'contact');
      if (contactId) {
        const formId = `form-${Date.now()}`;
        forms = {
          [formId]: {
            id: formId,
            name: 'Contact',
            fields: JSON.parse(JSON.stringify(DEFAULT_VESTRIA_LEAD_FIELDS)),
            submitButtonText: VESTRIA_LEAD_SUBMIT_TEXT,
            successMessage: VESTRIA_LEAD_SUCCESS_MESSAGE,
            integrations: [{ id: 'int-dashboard', type: 'dashboard', name: 'Dashboard', enabled: true }],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
        content[contactId].elements.form_id = formId;
      }
    }

    const finalContent = {
      layout: {
        sections: sectionIds,
        sectionLayouts,
        // Meridian tokens come from Project.paletteId/variantId at render time
        // via the Meridian ThemeInjector. No theme.colors block for product.
        theme: {},
        globalSettings: {},
      },
      content,
      meta: {
        id: tokenId,
        title,
        slug: '',
        lastUpdated: Date.now(),
        version: 1,
        tokenId,
      },
      ...(forms ? { forms } : {}),
      onboardingData: {
        oneLiner,
        productName,
        understanding,
        landingGoal,
        offer,
        // Durable project ↔ SiteContext link (Phase 1) + Phase 3 lookup key.
        ...(importSourceUrl ? { importSourceUrl } : {}),
      },
      generatedAt: Date.now(),
    };

    // scale-05 phase 4: M1 goals (incl. subscribe-newsletter) auto-seed an
    // on-site form, placed + wired to the CTA. No-op for non-M1 goals or when a
    // form already exists (e.g. the vestria contact form above).
    const briefGoal = landingGoal ? legacyGoalToBriefGoal(landingGoal, goalParam) : null;
    seedGoalForm(finalContent, briefGoal);

    return { finalContent };
  };

  const runPipeline = useCallback(async () => {
    // Strategy route requires a non-empty product name; fall back when skipped.
    const effectiveProductName = productName.trim() || 'Your Product';
    const title = (productName.trim() || oneLiner || 'Untitled Page').slice(0, 50);

    setError(null);
    setCreditsError(false);

    // scale-05 phase 1: goal writeback payload for every saveDraft body below.
    // Only when the store carries a goal — a RESUMED run has a reset store
    // (landingGoal null), so nothing is sent and saveDraft's shallow brief
    // merge leaves the previously persisted Brief.goal untouched.
    const briefPatch = landingGoal
      ? { brief: { goal: legacyGoalToBriefGoal(landingGoal, goalParam) } }
      : {};

    // ─── Explicit template selection wins (checked BEFORE the persona branch) ───
    // ?template=vestria → store.templateId; a vestria run must never be hijacked
    // by the hardware-founder persona bridge below.
    const explicitVestria = storeTemplateId === 'vestria';

    // ─── Multi-page fan-out (Phase 3): shared helpers ───
    // (Defined BEFORE the store-data guard — a RESUMED run reads everything from
    // the DB draft; the in-memory store is empty after a reload.)
    const saveFC = async (
      fc: any,
      templateInfo?: { templateId: string; paletteId: string; variantId: string }
    ) => {
      // Hero-variant race handling (onboarding2 Phase 3): the picker is
      // non-blocking, so the hero page may save before OR after the user picks.
      // Re-apply the CURRENT store value on every save (incl. the final save at
      // pipeline completion) so a late pick still lands. getState() (not the
      // hook selector) so a mid-pipeline pick is never stale. Gated on
      // heroVariantPicked — a RESUMED run resets the store (picked=false), so
      // the default is never re-applied over a previously persisted choice
      // (resume sets templateId='vestria' before mount, so the flow guard
      // alone is NOT enough). A fresh no-pick run also skips (merged hero
      // already defaults to tailored).
      const {
        heroVariant,
        heroVariantPicked,
        variantId: pickedVariantId,
        paletteId: pickedPaletteId,
        mood: pickedMood,
        styleVariantPicked,
        stylePalettePicked,
        styleMoodPicked,
      } = useProductGenerationStore.getState();
      if (isManufacturerFlow(storeTemplateId) && heroVariantPicked) {
        applyHeroVariantToFinalContent(fc, heroVariant);
      }
      // Cosmetic look (onboarding2 Phase 6) — same non-blocking + resume-safe
      // rules as the hero variant: apply the CURRENT store pick on every save,
      // but ONLY fields EXPLICITLY picked this session (per-field flags). A
      // resumed run (store reset → all false) sends nothing, so /api/saveDraft
      // leaves persisted variantId/paletteId/themeValues untouched (undefined
      // = skip); a partial pick on a resumed run sends ONLY the picked field.
      // Spread AFTER templateInfo so a pick wins over the skeleton defaults.
      const styleInfo = isManufacturerFlow(storeTemplateId)
        ? {
            ...(styleVariantPicked ? { variantId: pickedVariantId } : {}),
            ...(stylePalettePicked ? { paletteId: pickedPaletteId } : {}),
            ...(styleMoodPicked ? { themeValues: { mood: pickedMood } } : {}),
          }
        : {};
      const res = await fetch('/api/saveDraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          title: fc.meta?.title || title,
          ...(templateInfo ?? {}),
          ...styleInfo,
          ...briefPatch,
          finalContent: fc,
        }),
      });
      if (!res.ok) throw new Error('Failed to save draft');
    };

    // Sequential per-page loop with PER-PAGE PERSISTENCE: each completed page is
    // saved before the next generates — a paid page is never lost to a fetch
    // failure or a closed tab. Retry/reload resumes from the DB (first missing
    // page), never re-paying completed ones.
    const runFanOut = async (fc: any) => {
      const ob = fc.onboardingData as MultiPageOnboardingData;
      const sitemap: SitemapPage[] = ob.sitemap;
      const fanStrategy = ob.strategy;
      // Fan-out is vestria-only (manufacturer): copy features slot carries
      // valueAdds (D3). Fallback to SaaS-shape features keeps older drafts
      // (pre-manufacturer understanding) resumable.
      const fanFeatures: string[] =
        ob.understanding?.valueAdds ?? ob.understanding?.features ?? [];
      const sitePages = sitemap.map((p) => ({ title: p.title, pathSlug: p.pathSlug }));
      const total = sitemap.length;

      setStage('copy');
      try {
        for (let i = 0; i < sitemap.length; i++) {
          const page = sitemap[i];
          if (fc.generationProgress.completedPageKeys.includes(page.archetypeKey)) continue;
          setPageProgress({ done: fc.generationProgress.completedPageKeys.length + 1, total });

          const isHome = page.pathSlug === '/';
          const types = isHome ? ['header', ...page.sections, 'footer'] : [...page.sections];
          const { uiblocks } = selectProductBlocks({ sections: types, templateId: 'vestria' });

          const res = await fetch('/api/audience/product/generate-copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              strategy: fanStrategy,
              uiblocks,
              productName: (ob.productName || '').trim() || 'Your Product',
              oneLiner: ob.oneLiner,
              offer: ob.offer,
              landingGoal: ob.landingGoal,
              features: fanFeatures,
              // Real testimonials only for the page(s) that carry them.
              ...(page.sections.includes('testimonials') && ob.importedTestimonials?.length
                ? { realTestimonials: ob.importedTestimonials }
                : {}),
              templateId: 'vestria',
              page: {
                archetypeKey: page.archetypeKey,
                title: page.title,
                pathSlug: page.pathSlug,
                isHome,
              },
              sitePages,
              ...(ob.importSourceUrl ? { sourceUrl: ob.importSourceUrl } : {}),
            }),
          });
          const json = await res.json();
          posthog?.capture('product_copy_call_complete', {
            success: !!json?.success,
            creditsUsed: json?.creditsUsed,
            creditsRemaining: json?.creditsRemaining,
            attempts: json?.meta?.attempts,
            audienceType: 'product',
            page: page.archetypeKey,
            pageIndex: i,
            pageTotal: total,
          });
          if (!res.ok || !json?.success) {
            if (res.status === 402 || /credit/i.test(json?.error ?? '')) {
              setCreditsError(true);
              return;
            }
            throw new Error(json?.message || `Copy generation failed (${page.title})`);
          }

          mergePageIntoFinalContent({
            fc,
            page,
            order: i,
            copy: json.sections,
            templateId: 'vestria',
            formSpec: {
              fields: DEFAULT_VESTRIA_LEAD_FIELDS,
              submitButtonText: VESTRIA_LEAD_SUBMIT_TEXT,
              successMessage: VESTRIA_LEAD_SUCCESS_MESSAGE,
            },
          });

          // scale-03 (flag-gated): stock-fill stockable slots (industries cards)
          // into THIS page's content BEFORE it is persisted (resume-safe). Pass the
          // body-only, sectionId-keyed map for this page — for home its section
          // objects are shared refs with fc.content, so the flat view updates too.
          if (isImagesAtBirthEnabled()) {
            const style = useProductGenerationStore.getState();
            const imgPaletteId = style.stylePalettePicked
              ? style.paletteId
              : defaultVestriaPalette;
            const imgCategories: string[] =
              ob.understanding?.productCategories ?? ob.understanding?.categories ?? [];
            const stats = await injectImagesForPage({
              content: fc.pages[page.archetypeKey].content,
              templateId: 'vestria',
              paletteId: imgPaletteId,
              categories: imgCategories,
            });
            posthog?.capture('images_at_birth', { ...stats, page: page.archetypeKey });
          }

          await saveFC(fc); // persist THIS page before generating the next
        }
      } catch (e: any) {
        setError(e?.message || 'Copy generation failed.');
        return;
      }

      setStage('saving');
      try {
        finalizeMultiPageGeneration(fc);
        await saveFC(fc);
      } catch (e: any) {
        setError(e?.message || 'Could not save the draft.');
        return;
      }

      setStage('done');
      const finalStyle = useProductGenerationStore.getState();
      posthog?.capture('product_onboarding_complete', {
        totalDurationMs: Date.now() - startedAt.current,
        pageCount: total,
        templateId: 'vestria',
        paletteId: finalStyle.stylePalettePicked ? finalStyle.paletteId : defaultVestriaPalette,
        variantId: finalStyle.styleVariantPicked ? finalStyle.variantId : defaultVestriaVariant,
        mood: finalStyle.styleMoodPicked ? finalStyle.mood : undefined,
        stylePicked:
          finalStyle.styleVariantPicked ||
          finalStyle.stylePalettePicked ||
          finalStyle.styleMoodPicked,
        audienceType: 'product',
        multiPage: true,
      });
      setTimeout(() => router.push(`/generate/${tokenId}`), 600);
    };

    // ─── Resume check FIRST: an in-progress multi-page generation in the DB
    // wins (survives reload/tab close — the in-memory store is gone but the
    // draft carries sitemap + strategy + completed pages).
    try {
      const res = await fetch(`/api/loadDraft?tokenId=${encodeURIComponent(tokenId)}`);
      if (res.ok) {
        const json = await res.json();
        const loaded = json?.finalContent || json?.content?.finalContent || json?.content;
        if (isResumableGeneration(loaded)) {
          return runFanOut(loaded);
        }
      }
    } catch {
      /* resume is best-effort — fall through to a fresh run */
    }

    // ─── Fresh run: onboarding store data required from here on ───
    if (!understanding || !landingGoal) {
      setError('Missing onboarding data. Please restart from the beginning.');
      return;
    }
    // Manufacturer flow (onboarding1 D3): remap the manufacturer field set into
    // the EXISTING body keys (features ← valueAdds, categories ← productCategories,
    // otherAudiences ← industriesServed). SaaS path passes the old fields untouched.
    const isMfr = isManufacturerFlow(storeTemplateId);
    const features = isMfr
      ? understanding.valueAdds ?? understanding.features ?? []
      : understanding.features ?? [];
    const audiences = understanding.audiences ?? [];

    // ─── Persona → template (fired in parallel with generation; no serial cost) ───
    // The hardware-founder persona gets the TechPremium product template; every other
    // product persona keeps Meridian. On fetch error / null persona → Meridian (safe).
    const personaPromise: Promise<string | null> = explicitVestria
      ? Promise.resolve(null)
      : fetch('/api/user/persona')
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => (j?.persona ?? null) as string | null)
          .catch(() => null);

    // ─── TechPremium deterministic bridge (Phase 4c) ───
    // TODO(ai-fill): hardware-founder onboarding currently SKIPS AI strategy/copy and
    // seeds the 12-section naayom Home deterministically (0 credits). This is a
    // temporary naayom-era bridge — replace with an AI path that fills the 12
    // TechPremium section types before onboarding a 2nd hardware founder.
    const persona = await personaPromise;
    if (!explicitVestria && persona === 'hardware-founder') {
      setStage('saving');
      try {
        const finalContent = buildTechPremiumHomeFinalContent({
          tokenId,
          title,
          productName: productName.trim(),
          oneLiner,
          understanding,
          landingGoal,
          offer,
        });
        const res = await fetch('/api/saveDraft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId,
            title,
            paletteId: defaultTechPremiumPalette,
            templateId: 'techpremium',
            variantId: defaultTechPremiumVariant,
            ...briefPatch,
            finalContent,
          }),
        });
        if (!res.ok) throw new Error('Failed to save draft');
      } catch (e: any) {
        setError(e?.message || 'Could not save the draft.');
        return;
      }
      setStage('done');
      posthog?.capture('product_onboarding_complete', {
        totalDurationMs: Date.now() - startedAt.current,
        sectionCount: 12,
        templateId: 'techpremium',
        paletteId: defaultTechPremiumPalette,
        variantId: defaultTechPremiumVariant,
        audienceType: 'product',
        deterministic: true,
      });
      setTimeout(() => router.push(`/generate/${tokenId}`), 600);
      return;
    }

    // ─── Copy + Save (shared tail; strategy comes from the gate or the fetch below) ───
    const runCopyAndSave = async (strategy: ProductStrategyOutput) => {
      setStage('copy');
      const copyStart = Date.now();
      let copySections: Record<string, SectionCopy>;
      try {
        const res = await fetch('/api/audience/product/generate-copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategy,
            uiblocks: strategy.uiblocks,
            productName: effectiveProductName,
            oneLiner,
            offer,
            landingGoal,
            features,
            realTestimonials: importedTestimonials,
            templateId: storeTemplateId,
          }),
        });
        const json = await res.json();
        posthog?.capture('product_copy_call_complete', {
          success: !!json?.success,
          creditsUsed: json?.creditsUsed,
          creditsRemaining: json?.creditsRemaining,
          durationMs: Date.now() - copyStart,
          attempts: json?.meta?.attempts,
          audienceType: 'product',
        });
        if (!res.ok || !json?.success) {
          if (res.status === 402 || /credit/i.test(json?.error ?? '')) {
            setCreditsError(true);
            return;
          }
          throw new Error(json?.message || 'Copy generation failed');
        }
        copySections = json.sections as Record<string, SectionCopy>;
      } catch (e: any) {
        setError(e?.message || 'Copy generation failed.');
        return;
      }

      // ─── Save ───
      setStage('saving');
      // Hardware-founder (TechPremium) was handled by the deterministic branch
      // above; Meridian or Vestria reaches here (store templateId decides).
      // Vestria look comes from the generation store (Phase 6) — this path is
      // only reached on a FRESH run (resume goes through runFanOut), so store
      // defaults (cobalt/tailored) reproduce the old hardcoded behavior when
      // nothing was picked.
      const styleState = useProductGenerationStore.getState();
      const templateId = explicitVestria ? 'vestria' : PILOT_TEMPLATE;
      const paletteId = explicitVestria ? styleState.paletteId : PILOT_PALETTE;
      const variantId = explicitVestria ? styleState.variantId : PILOT_VARIANT;
      try {
        const { finalContent } = buildFinalContent(strategy, copySections, title);
        // Single-page vestria fallback: same hero-variant application as the
        // multi-page saveFC path — only after an EXPLICIT pick this session
        // (heroVariantPicked); resumed/no-pick runs never apply the default.
        const { heroVariant, heroVariantPicked, styleMoodPicked, mood } =
          useProductGenerationStore.getState();
        if (explicitVestria && heroVariantPicked) {
          applyHeroVariantToFinalContent(finalContent, heroVariant);
        }

        // scale-03 (flag-gated): stock-fill stockable slots before the save POST.
        // Meridian resolves to zero specs (no-op); the single-page vestria fallback
        // CAN carry an industries section and fills here.
        if (isImagesAtBirthEnabled()) {
          const imgCategories: string[] = isMfr
            ? understanding.productCategories ?? understanding.categories ?? []
            : understanding.categories ?? [];
          const stats = await injectImagesForPage({
            content: finalContent.content,
            templateId,
            paletteId,
            categories: imgCategories,
          });
          posthog?.capture('images_at_birth', { ...stats, page: 'single-page' });
        }

        const res = await fetch('/api/saveDraft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId,
            title,
            paletteId,
            templateId,
            variantId,
            // Mood only after an explicit pick (bone = renderer default; no
            // need to write it, and skipping avoids clobbering older drafts).
            ...(explicitVestria && styleMoodPicked ? { themeValues: { mood } } : {}),
            ...briefPatch,
            finalContent,
          }),
        });
        if (!res.ok) {
          throw new Error('Failed to save draft');
        }
      } catch (e: any) {
        setError(e?.message || 'Could not save the draft.');
        return;
      }

      setStage('done');
      posthog?.capture('product_onboarding_complete', {
        totalDurationMs: Date.now() - startedAt.current,
        sectionCount: strategy.sections.length,
        templateId,
        paletteId,
        variantId,
        audienceType: 'product',
      });

      // Reveal the generated page (wow moment) before the editor.
      setTimeout(() => router.push(`/generate/${tokenId}`), 600);
    };

    // ─── Strategy ───
    // Sitemap-gated flows (vestria) already fetched strategy in the review step
    // — reuse it (no second charge) and honor the USER-EDITED shape.
    if (storeStrategy) {
      // Multi-page: skeleton-save the gate output (durable BEFORE any copy
      // call), then fan out page by page.
      if (storeSitemap?.length) {
        const ob: MultiPageOnboardingData = {
          oneLiner,
          productName,
          understanding,
          landingGoal,
          offer,
          ...(importSourceUrl ? { importSourceUrl } : {}),
          ...(importedTestimonials?.length ? { importedTestimonials } : {}),
          sitemap: storeSitemap,
          strategy: storeStrategy,
        };
        const fc = buildMultiPageSkeleton({ tokenId, title, onboardingData: ob });
        try {
          // Skeleton save carries the CURRENT store look (Phase 6) — store
          // defaults are cobalt/tailored, so a no-pick run saves exactly what
          // the old hardcoded defaults did. saveFC's styleInfo overrides these
          // on later saves if the user picks mid-stream.
          const { variantId: styleVariantId, paletteId: stylePaletteId } =
            useProductGenerationStore.getState();
          await saveFC(fc, {
            templateId: 'vestria',
            paletteId: stylePaletteId,
            variantId: styleVariantId,
          });
        } catch (e: any) {
          setError(e?.message || 'Could not save the draft.');
          return;
        }
        return runFanOut(fc);
      }
      // Single-page fallback (no sitemap): behave as before.
      return runCopyAndSave(storeStrategy);
    }

    setStage('strategy');
    const strategyStart = Date.now();
    let strategy: ProductStrategyOutput;
    try {
      const res = await fetch('/api/audience/product/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: effectiveProductName,
          oneLiner,
          features,
          landingGoal,
          offer,
          primaryAudience:
            audiences[0] ||
            (isMfr ? 'trade buyers / procurement teams' : 'early adopters'),
          otherAudiences: isMfr
            ? understanding.industriesServed ?? []
            : audiences.slice(1),
          categories: isMfr
            ? understanding.productCategories ?? understanding.categories ?? []
            : understanding.categories ?? [],
          ...(isMfr && understanding.whatYouMake
            ? { whatYouMake: understanding.whatYouMake }
            : {}),
          templateId: storeTemplateId,
        }),
      });
      const json = await res.json();
      posthog?.capture('product_strategy_call_complete', {
        success: !!json?.success,
        creditsUsed: json?.creditsUsed,
        creditsRemaining: json?.creditsRemaining,
        durationMs: Date.now() - strategyStart,
        audienceType: 'product',
      });
      if (!res.ok || !json?.success) {
        if (res.status === 402 || /credit/i.test(json?.error ?? '')) {
          setCreditsError(true);
          return;
        }
        throw new Error(json?.message || 'Strategy generation failed');
      }
      strategy = json.data as ProductStrategyOutput;
    } catch (e: any) {
      setError(e?.message || 'Strategy generation failed.');
      return;
    }

    await runCopyAndSave(strategy);
  }, [
    understanding,
    landingGoal,
    goalParam,
    productName,
    oneLiner,
    offer,
    importedTestimonials,
    importSourceUrl,
    storeTemplateId,
    storeStrategy,
    storeSitemap,
    tokenId,
    posthog,
    router,
  ]);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    runPipeline();
  }, [runPipeline]);

  if (creditsError) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Out of credits</h3>
        <p className="text-gray-600 mb-6">
          You&apos;ve used your generation credits. Top up to continue.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <a
            href="/dashboard/settings"
            className="px-5 py-2.5 rounded-lg bg-brand-accentPrimary text-white hover:bg-orange-500"
          >
            View plans
          </a>
          <button
            onClick={() => router.push(`/edit/${tokenId}`)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Continue to editor without copy
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    setGenerationError(error);
    return (
      <ErrorRetry
        title="Generation hit a snag"
        message={error}
        onRetry={() => {
          hasRun.current = false;
          setError(null);
          runPipeline();
        }}
        retryLabel="Try again"
        onSecondary={() => router.push(`/edit/${tokenId}`)}
        secondaryLabel="Skip to editor"
      />
    );
  }

  return (
    <div className="py-8 px-2 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
        Building your page
      </h2>
      <p className="text-sm text-gray-500 text-center mb-8">
        This usually takes 20–40 seconds.
      </p>

      <ol className="space-y-4">
        {STAGES.map((s) => {
          const idx = STAGES.findIndex((x) => x.id === stage);
          const myIdx = STAGES.findIndex((x) => x.id === s.id);
          const status: 'done' | 'active' | 'pending' =
            stage === 'done' || myIdx < idx
              ? 'done'
              : myIdx === idx
                ? 'active'
                : 'pending';
          return (
            <li key={s.id} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  status === 'done'
                    ? 'bg-brand-accentPrimary text-white'
                    : status === 'active'
                      ? 'bg-brand-accentPrimary/10 text-brand-accentPrimary'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {status === 'done' ? (
                  <Check className="w-4 h-4" />
                ) : status === 'active' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-xs font-medium">
                    {STAGES.findIndex((x) => x.id === s.id) + 1}
                  </span>
                )}
              </div>
              <span
                className={`text-sm ${
                  status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                }`}
              >
                {s.label}
                {s.id === 'copy' && status === 'active' && pageProgress && pageProgress.total > 1
                  ? ` — page ${pageProgress.done} of ${pageProgress.total}`
                  : ''}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Hero-variant picker (onboarding2 Phase 3) — manufacturer/vestria only,
          shown during the multi-second copy fan-out. Purely optional and never
          awaited: the pipeline streams on regardless; the choice is applied to
          every draft save (incl. the final one) via saveFC. */}
      {stage === 'copy' && isManufacturerFlow(storeTemplateId) && (
        <>
          <HeroVariantPicker value={heroVariant} onChange={setHeroVariant} />
          {/* Cosmetic look picker (onboarding2 Phase 6) — hero variant first,
              then look, per spec. Same non-blocking contract: applied on every
              saveFC + re-applied at completion, gated on stylePicked. */}
          <ProductStylePicker />
        </>
      )}
    </div>
  );
}
