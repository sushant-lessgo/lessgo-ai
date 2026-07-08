'use client';

// scale-06 phase 3 — the UNIFIED wizard shell + dispatcher.
//
// One renderer for every engine. Receives the confirmed Brief + serveGate result
// (fetched by the entry page's load-detection) as props, hydrates `useWizardStore`
// once on mount, then renders the current slot with progress + back/next chrome.
//
// Slots built this phase: identity · understanding · offer (core copy facts).
// goal · proof · style · structure · generating arrive in phases 4/5 — rendered
// as a "coming soon" placeholder here so navigation is functional for the pilot
// handoff without pulling unbuilt code in.
//
// FIREWALL: this whole component tree is DYNAMICALLY IMPORTED by the entry page
// (`next/dynamic`, ssr:false) so template-adjacent slot code (future StyleSlot
// pickers) never enters the firewall-pure entry bundle. Client-only; reads/writes
// `useWizardStore`; no template resolver/registry/renderer imports.

import { useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Brief } from '@/types/brief';
import type { AudienceType, TemplateId } from '@/types/service';
import type { WizardSlot } from '@/modules/engines/inputContracts';
import { useWizardStore } from '@/hooks/useWizardStore';
import { Button } from '@/components/ui/button';
import IdentitySlot from './IdentitySlot';
import UnderstandingSlot from './UnderstandingSlot';
import OfferSlot from './OfferSlot';
import GoalSlot from './GoalSlot';
import ProofSlot from './ProofSlot';
import StyleSlot from './StyleSlot';
import StructureSlot from './StructureSlot';
import GeneratingSlot from './GeneratingSlot';

interface WizardShellProps {
  tokenId: string;
  brief: Brief;
  audienceType: AudienceType | null;
  templateId: TemplateId | null;
}

const SLOT_LABELS: Record<WizardSlot, string> = {
  identity: 'Basics',
  understanding: 'Understanding',
  goal: 'Goal',
  offer: 'Offer',
  proof: 'Proof',
  style: 'Style',
  structure: 'Structure',
  generating: 'Building',
};

// Slots implemented in phases 3–5.
const BUILT_SLOTS: Partial<Record<WizardSlot, () => JSX.Element>> = {
  identity: IdentitySlot,
  understanding: UnderstandingSlot,
  goal: GoalSlot,
  offer: OfferSlot,
  proof: ProofSlot,
  style: StyleSlot,
  structure: StructureSlot,
  generating: GeneratingSlot,
};

function SlotPlaceholder({ slot }: { slot: WizardSlot }) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-gray-900">
        {SLOT_LABELS[slot]}
      </h1>
      <p className="text-gray-500">This step is coming soon.</p>
    </div>
  );
}

export default function WizardShell({
  tokenId,
  brief,
  audienceType,
  templateId,
}: WizardShellProps) {
  const hydrate = useWizardStore((s) => s.hydrate);
  const save = useWizardStore((s) => s.save);
  const nextSlot = useWizardStore((s) => s.nextSlot);
  const prevSlot = useWizardStore((s) => s.prevSlot);

  const hydrated = useWizardStore((s) => s.hydrated);
  const slots = useWizardStore((s) => s.slots);
  const currentSlot = useWizardStore((s) => s.currentSlot);
  const engine = useWizardStore((s) => s.engine);

  // Hydrate once from the DB-confirmed brief (load-detection already fetched it).
  useEffect(() => {
    hydrate({ tokenId, brief, audienceType, templateId });
    // brief is a stable per-mount payload; re-running on every render would
    // clobber user edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated || !engine || slots.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">Loading your page…</div>
    );
  }

  const index = Math.max(0, slots.indexOf(currentSlot));
  const isFirst = index === 0;
  const isLast = index === slots.length - 1;
  const SlotComponent = BUILT_SLOTS[currentSlot];

  const handleNext = () => {
    void save();
    nextSlot();
  };
  const handleBack = () => {
    prevSlot();
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span>{SLOT_LABELS[currentSlot]}</span>
          <span>
            {index + 1} / {slots.length}
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-gray-100">
          <div
            className="h-1 rounded-full bg-brand-accentPrimary transition-all duration-300"
            style={{ width: `${((index + 1) / slots.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Slot body */}
      {SlotComponent ? <SlotComponent /> : <SlotPlaceholder slot={currentSlot} />}

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleBack}
          disabled={isFirst}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={isLast}
          className="bg-brand-accentPrimary hover:bg-orange-500 transition-all duration-200"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
