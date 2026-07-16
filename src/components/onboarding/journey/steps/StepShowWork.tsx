'use client';

// ============================================================================
// STEP 02 — show-work. AGNOSTIC FRAME.
//
// Renders `seam.steps.showWork` (title / body / icon) and nothing else: the
// frame never knows what an engine's "work" looks like.
//
// ── E1 SCOPE (deliberate, do not "finish" it) ───────────────────────────────
// This is a NON-FUNCTIONAL dropzone-styled STUB + "Skip for now". There is no
// upload pipeline and no scrape here — image INGESTION is E2, and it is what
// will write `facts.work.groups[].photos` (the payload the rail's chip-id join
// already protects). Rendering the seam's content as a stub is an E1
// implementation choice, NOT a contract field (`stub:true` was deliberately
// kept out of `engines/types.ts`).
// ============================================================================

import { useWizardStore, selectSetJourneyStep } from '@/hooks/useWizardStore';
import { AppIcon } from '@/components/ui/icon';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { Button } from '@/components/ui/button';
import type { JourneyStepProps } from '../JourneyShell';

export default function StepShowWork({ seam }: JourneyStepProps) {
  const setJourneyStep = useWizardStore(selectSetJourneyStep);
  // The shell resolves the seam ONCE and passes it down (P5 folded away the
  // per-step `useJourneySeam` hook) — so there is no `seam === null` frame here
  // and this headline never paints empty before its content arrives.
  const content = seam.steps.showWork;

  return (
    <div data-testid="step-show-work" data-journey-step={2} className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-app-sans text-2xl font-semibold text-app-ink">
          {content.title}
        </h1>
        <p className="font-app-sans text-sm text-app-muted max-w-xl">{content.body}</p>
      </div>

      {/* The stub. `aria-disabled` + no handler: it LOOKS like the drop target
          E2 will build, and does nothing — better than a control that silently
          fails. */}
      <ImagePlaceholder
        aspect="16 / 7"
        data-testid="show-work-dropzone"
        aria-disabled="true"
        className="flex-col gap-2 text-center"
      >
        <AppIcon name={content.icon} size={28} />
        <span className="font-app-sans text-xs text-app-placeholder">
          Uploads arrive in the next release — skip for now and add images in the editor.
        </span>
      </ImagePlaceholder>

      <Button
        type="button"
        variant="ghost"
        data-testid="show-work-skip"
        onClick={() => setJourneyStep(3)}
      >
        Skip for now
        <AppIcon name="arrow_forward" size={16} className="ml-1.5" />
      </Button>
    </div>
  );
}
