'use client';

// scale-06 phase 4 — the UNIFIED, contract-driven PROOF slot.
//
// Generalizes the service AssetsStep: instead of hardcoding service's 6 asset
// booleans, it iterates THIS engine's proof-slot contract fields
// (`getContract(engine).fields.filter(slot === 'proof')`). PRODUCT/THING gets a
// proof step for the FIRST time here. 1-tap toggles for the T2 existence
// booleans + a testimonial-type sub-choice when a testimonial boolean is on;
// values write to `useWizardStore.proof`.
//
// PROOF HARD RULE surface: a T2 boolean left OFF ⇒ its section is unpromised ⇒
// dropped downstream (contract `dropTarget`; enforced at product section
// assembly in parseStrategyProduct, at service section selection for trust).
//
// CARRY-FORWARD (phase-1 review): the `skippableWithWarning` real-numbers field
// (thing `realNumbers` / trust `outcomes` / work `achievements`) is rendered as
// an OPTIONAL chips input AND, when left empty (i.e. being skipped), surfaces the
// trust warning — the waterfall otherwise DROPs it silently.
//
// FIREWALL: client-only. Reads/writes `useWizardStore`; no template/renderer imports.

import { Label } from '@/components/ui/label';
import { useWizardStore, type WizardProofState } from '@/hooks/useWizardStore';
import { getContract, type ContractField } from '@/modules/engines/inputContracts';
import {
  businessTypes,
  type BusinessTypeEntry,
  type BusinessTypeKey,
} from '@/modules/businessTypes/config';
import { WizardFieldInput } from './SlotReviewCard';

type BooleanProofKey = {
  [K in keyof WizardProofState]: WizardProofState[K] extends boolean ? K : never;
}[keyof WizardProofState];

type TestimonialType = NonNullable<WizardProofState['testimonialType']>;

/**
 * Contract proof-field id → the WizardProofState boolean it toggles + display
 * copy. Keyed by contract id so it is engine-agnostic; phases 8/9 extend it for
 * additional trust/work proof types. All three current T2 proof fields
 * (thing.proofTestimonials / trust.testimonials / work.praise) are "has quotes"
 * existence booleans that gate a testimonial-style section.
 */
const BOOLEAN_PROOF_META: Record<
  string,
  { proofKey: BooleanProofKey; label: string; hint: string; testimonial?: boolean }
> = {
  proofTestimonials: { proofKey: 'hasTestimonials', label: 'Customer testimonials', hint: 'Quotes you can publish', testimonial: true },
  testimonials: { proofKey: 'hasTestimonials', label: 'Client testimonials', hint: 'Quotes you can publish', testimonial: true },
  praise: { proofKey: 'hasTestimonials', label: 'Praise / reviews', hint: 'Quotes about your work', testimonial: true },
};

const TESTIMONIAL_TYPES: Array<{ value: TestimonialType; label: string }> = [
  { value: 'text', label: 'Text quotes' },
  { value: 'photos', label: 'With client photos' },
  { value: 'video', label: 'Video testimonials' },
  { value: 'transformation', label: 'Transformation stories' },
];

function businessTypeEntryFor(key: BusinessTypeKey | null): BusinessTypeEntry | null {
  return key && key in businessTypes ? businessTypes[key] : null;
}

function ProofToggle({
  meta,
  value,
  onToggle,
}: {
  meta: { proofKey: BooleanProofKey; label: string; hint: string };
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left p-4 rounded-lg border transition-all flex items-start justify-between ${
        value
          ? 'border-brand-accentPrimary bg-brand-accentPrimary/5'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div>
        <div className="font-medium text-gray-900">{meta.label}</div>
        <div className="text-sm text-gray-500">{meta.hint}</div>
      </div>
      <div
        className={`mt-1 w-10 h-6 rounded-full relative transition-colors ${
          value ? 'bg-brand-accentPrimary' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            value ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
}

/** Real-numbers (skippableWithWarning) chips field + skip warning when empty. */
function SkippableNumbersField({
  field,
  btEntry,
}: {
  field: ContractField;
  btEntry: BusinessTypeEntry | null;
}) {
  const entry = useWizardStore((s) => s.fields[field.id]);
  const value = Array.isArray(entry?.value) ? (entry!.value as string[]) : [];
  const beingSkipped = value.length === 0;
  return (
    <div className="space-y-2">
      <WizardFieldInput field={field} btEntry={btEntry} />
      {beingSkipped && (
        <p className="text-xs text-amber-600">
          Optional, but concrete numbers are your strongest proof. Skipping means
          we won&apos;t claim any — you can add them later in the editor.
        </p>
      )}
    </div>
  );
}

export default function ProofSlot() {
  const engine = useWizardStore((s) => s.engine);
  const btKey = useWizardStore((s) => s.businessTypeKey);
  const proof = useWizardStore((s) => s.proof);
  const setProof = useWizardStore((s) => s.setProof);

  const btEntry = businessTypeEntryFor(btKey);

  const proofFields = engine
    ? getContract(engine).fields.filter((f) => f.slot === 'proof')
    : [];

  const booleanFields = proofFields.filter(
    (f) => f.input === 'boolean' && BOOLEAN_PROOF_META[f.id]
  );
  // T1 skippable numeric proof (real-numbers) — surfaced as an ASK-with-warning.
  const numbersFields = proofFields.filter((f) => f.skippableWithWarning);
  // Other T1 proof fields (e.g. trust credentials) render as plain inputs.
  const otherFields = proofFields.filter(
    (f) =>
      f.input !== 'boolean' &&
      !f.skippableWithWarning &&
      !f.wizardArtifact // T3 wizard uploads (work.theWork) are phase-9 territory
  );

  const anyTestimonialOn = booleanFields.some(
    (f) => BOOLEAN_PROOF_META[f.id].testimonial && proof[BOOLEAN_PROOF_META[f.id].proofKey]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          What do you have to work with?
        </h1>
        <p className="mt-2 text-gray-600">
          Toggle on what you already have. We only build sections you can
          actually fill in — you can flip any of these later.
        </p>
      </div>

      {booleanFields.length > 0 && (
        <div className="space-y-2">
          {booleanFields.map((f) => {
            const meta = BOOLEAN_PROOF_META[f.id];
            const value = proof[meta.proofKey];
            return (
              <ProofToggle
                key={f.id}
                meta={meta}
                value={value}
                onToggle={() => {
                  const next = !value;
                  const patch: Partial<WizardProofState> = { [meta.proofKey]: next };
                  // Turning a testimonial boolean off clears the sub-choice.
                  if (meta.testimonial && !next) patch.testimonialType = null;
                  setProof(patch);
                }}
              />
            );
          })}
        </div>
      )}

      {anyTestimonialOn && (
        <div className="space-y-2">
          <Label className="text-gray-700">
            What kind of testimonials? <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {TESTIMONIAL_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setProof({ testimonialType: value })}
                className={`px-3 py-2 rounded-md border text-sm transition-all ${
                  proof.testimonialType === value
                    ? 'border-brand-accentPrimary bg-brand-accentPrimary/5 text-brand-accentPrimary ring-2 ring-brand-accentPrimary/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {numbersFields.map((f) => (
        <SkippableNumbersField key={f.id} field={f} btEntry={btEntry} />
      ))}

      {otherFields.map((f) => (
        <WizardFieldInput key={f.id} field={f} btEntry={btEntry} />
      ))}
    </div>
  );
}
