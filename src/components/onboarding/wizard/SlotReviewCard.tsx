'use client';

// scale-06 phase 3 — the CORE-SLOT rendering primitives, shared by every slot.
//
// A slot renders its contract fields, resolved by the phase-1 waterfall state
// already computed into `useWizardStore.fields[id].state`:
//   • `ask`               → an editable question (WizardFieldInput).
//   • `scraped`/`inferred`→ a confirmable value; in review-mode grouped into the
//                           one-tap SlotReviewCard, in fill-mode shown as a
//                           prefilled editable input (same WizardFieldInput).
//   • `drop`              → never rendered.
//
// Labels/examples come from the businessType `wizardFields` when a key matches
// the contract field id, else a built-in default (contract supplies SHAPE, the
// businessType supplies COPY — D9/D10). This leaf file holds the shared helpers
// so slot components stay thin and there is no circular import with WizardShell.
//
// FIREWALL: client-only. Reads/writes `useWizardStore`; no template/renderer imports.

import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { useWizardStore } from '@/hooks/useWizardStore';
import {
  getContract,
  type ContractField,
  type WizardSlot,
} from '@/modules/engines/inputContracts';
import {
  businessTypes,
  type BusinessTypeEntry,
  type BusinessTypeKey,
} from '@/modules/businessTypes/config';
import ChipInput from '@/components/onboarding/shared/ChipInput';

// ---------------------------------------------------------------------------
// Field copy resolution (businessType wizardFields → default fallback).
// ---------------------------------------------------------------------------

export interface FieldCopy {
  label: string;
  example: string;
}

/** Built-in fallback copy keyed by contract field id (all engines). */
const DEFAULT_FIELD_COPY: Record<string, FieldCopy> = {
  // identity
  name: { label: 'What is it called?', example: 'e.g. Acme Invoicing' },
  oneLiner: {
    label: 'Describe it in one line',
    example: 'Invoicing software that auto-chases late payments',
  },
  // understanding — thing
  audience: {
    label: 'Who is it for?',
    example: 'Freelance designers billing 5–20 clients',
  },
  capabilities: {
    label: 'What can it do? (key features)',
    example: 'Auto-reminders, recurring invoices, payment links',
  },
  differentiator: {
    label: 'Why you over the obvious alternative?',
    example: 'Set up in 2 minutes; no accounting knowledge needed',
  },
  objectionFacts: {
    label: 'Anything that removes doubt? (optional)',
    example: 'Bank-level security, cancel anytime',
  },
  // understanding — trust
  whoProblem: {
    label: 'Who do you help, and with what problem?',
    example: 'Founders drowning in unpaid invoices',
  },
  services: {
    label: 'What do you do for clients?',
    example: 'Paid social + landing pages for D2C brands',
  },
  process: {
    label: 'How do you work / what makes it work?',
    example: 'Weekly sprints with a single point of contact',
  },
  // understanding — work
  whatYouTakeOn: {
    label: 'What kind of work do you take on? (optional)',
    example: 'Literary fiction, essays, ghostwriting',
  },
  genresStyle: {
    label: 'Genres / style',
    example: 'Hindi literary fiction, small-town essays',
  },
  bioStory: {
    label: 'Your story in a few lines',
    example: 'Grew up in Bhopal; writing about migration since 2015',
  },
  // offer
  offer: {
    label: 'What is the offer / next step?',
    example: 'Start a free 14-day trial',
  },
};

/** Prefer businessType wizardFields[field.id], else the built-in default. */
export function resolveFieldCopy(
  field: ContractField,
  btEntry: BusinessTypeEntry | null,
): FieldCopy {
  const wf = btEntry?.wizardFields?.[field.id];
  if (wf) return wf;
  return DEFAULT_FIELD_COPY[field.id] ?? { label: field.id, example: '' };
}

function businessTypeEntryFor(
  key: BusinessTypeKey | null,
): BusinessTypeEntry | null {
  return key && key in businessTypes ? businessTypes[key] : null;
}

// ---------------------------------------------------------------------------
// Single editable field, bound to the store.
// ---------------------------------------------------------------------------

export function WizardFieldInput({
  field,
  btEntry,
}: {
  field: ContractField;
  btEntry: BusinessTypeEntry | null;
}) {
  const entry = useWizardStore((s) => s.fields[field.id]);
  const setFieldValue = useWizardStore((s) => s.setFieldValue);
  const copy = resolveFieldCopy(field, btEntry);

  if (field.input === 'chips') {
    const value = Array.isArray(entry?.value) ? (entry!.value as string[]) : [];
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-800">{copy.label}</label>
        <ChipInput
          value={value}
          onChange={(next) => setFieldValue(field.id, next)}
          placeholder={copy.example}
          ariaLabel={copy.label}
        />
      </div>
    );
  }

  // free-text (default) + guided-chips (starters seed the same free-text box).
  // boolean/upload fields belong to proof — not rendered here.
  const value = typeof entry?.value === 'string' ? entry.value : '';

  // guided-chips: tap a starter to SEED the phrase into the editable text box.
  // Chips are starters, not a locked multi-select — the stored value is the
  // final free text. Append to any existing text so multiple taps compound.
  function seedChip(phrase: string) {
    const current = value.trim();
    const next = current ? `${current} ${phrase}` : phrase;
    setFieldValue(field.id, next);
  }

  const chips = field.input === 'guided-chips' ? field.chips ?? [] : [];

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-800">{copy.label}</label>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-0.5">
          {chips.map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => seedChip(phrase)}
              className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50
                         text-brand-accentPrimary border border-orange-200 text-sm
                         hover:bg-orange-100 transition-colors duration-200"
            >
              {phrase}
            </button>
          ))}
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => setFieldValue(field.id, e.target.value)}
        placeholder={copy.example}
        rows={2}
        aria-label={copy.label}
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm
                   outline-none focus:ring-2 focus:ring-brand-accentPrimary/30 focus:border-brand-accentPrimary/40
                   placeholder:text-gray-400"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// One-tap confirm-per-slot review card (review-mode prefilled values).
// ---------------------------------------------------------------------------

function displayValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') return value;
  return '';
}

export default function SlotReviewCard({
  fields,
  btEntry,
}: {
  fields: ContractField[];
  btEntry: BusinessTypeEntry | null;
}) {
  const fieldMap = useWizardStore((s) => s.fields);
  const confirmField = useWizardStore((s) => s.confirmField);

  const allConfirmed = fields.every((f) => fieldMap[f.id]?.confirmed);

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-accentPrimary">
        We pulled this from your site — confirm or edit
      </p>
      <div className="space-y-2">
        {fields.map((f) => {
          const copy = resolveFieldCopy(f, btEntry);
          const val = displayValue(fieldMap[f.id]?.value);
          return (
            <div key={f.id} className="text-sm">
              <span className="text-gray-500">{copy.label} </span>
              <span className="text-gray-900 font-medium">{val || '—'}</span>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => fields.forEach((f) => confirmField(f.id))}
        disabled={allConfirmed}
        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full
                   bg-white border border-orange-200 text-brand-accentPrimary
                   hover:bg-orange-50 disabled:opacity-60 transition-colors duration-200"
      >
        <Check className="w-3.5 h-3.5" />
        {allConfirmed ? 'Confirmed' : 'Looks right'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slot body orchestrator — shared by every core slot component.
// ---------------------------------------------------------------------------

export function SlotBody({
  slot,
  title,
  description,
}: {
  slot: WizardSlot;
  title: string;
  description?: string;
}) {
  const engine = useWizardStore((s) => s.engine);
  const mode = useWizardStore((s) => s.mode);
  const btKey = useWizardStore((s) => s.businessTypeKey);
  const fieldMap = useWizardStore((s) => s.fields);

  const btEntry = businessTypeEntryFor(btKey);

  const { reviewFields, askFields } = useMemo(() => {
    const review: ContractField[] = [];
    const ask: ContractField[] = [];
    if (engine) {
      for (const f of getContract(engine).fields) {
        if (f.slot !== slot) continue;
        const st = fieldMap[f.id]?.state ?? 'ask';
        if (st === 'drop') continue; // never rendered
        if (st === 'ask') ask.push(f);
        else review.push(f); // scraped | inferred
      }
    }
    return { reviewFields: review, askFields: ask };
  }, [engine, slot, fieldMap]);

  // fill-mode: no scrape prefill to confirm — show review fields as editable
  // inputs too (so the user still fills them). review-mode: group into the card.
  const showReviewCard = mode === 'review' && reviewFields.length > 0;
  const editableFields = showReviewCard
    ? askFields
    : [...reviewFields, ...askFields];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && <p className="mt-2 text-gray-600">{description}</p>}
      </div>

      {showReviewCard && (
        <SlotReviewCard fields={reviewFields} btEntry={btEntry} />
      )}

      {editableFields.length > 0 && (
        <div className="space-y-4">
          {editableFields.map((f) => (
            <WizardFieldInput key={f.id} field={f} btEntry={btEntry} />
          ))}
        </div>
      )}
    </div>
  );
}
