'use client';

// src/modules/templates/useTemplateReady.ts
// Client-side single-boundary preload for service templates. templateId is
// constant for a page render, so we resolve the module once and flip a ready
// flag — no per-block React.lazy / Suspense flicker (PO call #2). Product
// pages skip it entirely (ready immediately).

import { useEffect, useState } from 'react';
import { preloadTemplate, getLoadedTemplate } from './registry';
import type { TemplateId } from '@/types/service';
import { usesTemplateModule } from '@/types/service';
import type { TemplateModule } from '@/types/template';

export interface TemplateModuleState {
  /** True when the page is safe to render (product = always; service = loaded). */
  ready: boolean;
  /** Loaded module for service pages, else null. */
  tmpl: TemplateModule | null;
}

export function useTemplateModule(
  audienceType: string | undefined,
  templateId: string | null | undefined,
): TemplateModuleState {
  const usesTemplate = usesTemplateModule(audienceType, templateId);
  const id = (templateId || 'hearth') as TemplateId;

  const [tmpl, setTmpl] = useState<TemplateModule | null>(
    () => (usesTemplate ? getLoadedTemplate(id) ?? null : null),
  );

  useEffect(() => {
    if (!usesTemplate) {
      setTmpl(null);
      return;
    }
    const cached = getLoadedTemplate(id);
    if (cached) {
      setTmpl(cached);
      return;
    }
    let alive = true;
    preloadTemplate(id).then((m) => {
      if (alive) setTmpl(m);
    });
    return () => {
      alive = false;
    };
  }, [usesTemplate, id]);

  return { ready: !usesTemplate || !!tmpl, tmpl };
}
