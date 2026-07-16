'use client';

// ============================================================================
// useJourneySeam — how an AGNOSTIC step body reaches its engine's seam (P4).
//
// `JourneyShell` renders step bodies with NO props (`STEP_BODIES: Record<…, () =>
// JSX.Element>`), so each step resolves the seam itself: engine ← the store
// (hydrated from `brief.copyEngine`), seam ← the registry's ASYNC loader. That
// is the same door the shell uses, and the only one: no step ever statically
// imports a seam (landmine 14 — seams load pre-confirm on the entry page, and a
// static import would drag the generation+template graph onto it).
//
// The loader is a dynamic `import()`, so the module is fetched once and cached
// by the module system — three steps calling this is three cache hits, not three
// chunks.
//
// AGNOSTIC: no engine name, no templateId, no `@/modules/wizard/**` import.
// ============================================================================

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/hooks/useWizardStore';
import { loadJourneySeam } from '../engines/registry';
import type { JourneyEngineSeam } from '../engines/types';

/** `null` while loading (or when the engine has no seam — unreachable via the
 *  entry page's eligibility dispatch, but never a throw). */
export function useJourneySeam(): JourneyEngineSeam | null {
  const engine = useWizardStore((s) => s.engine);
  const [seam, setSeam] = useState<JourneyEngineSeam | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadJourneySeam(engine);
      if (!cancelled) setSeam(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [engine]);

  return seam;
}
