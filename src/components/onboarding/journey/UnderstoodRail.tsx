'use client';

// ============================================================================
// UnderstoodRail — the persistent "What we understood" rail. FULLY AGNOSTIC.
//
// It renders a `RailVM` and NOTHING else. It knows no field names, no field
// order, no engine: labels, order, kinds, skeleton state and editability all
// come from `seam.rail.toVM(briefFacts)`. Every write is CONSTRUCTED by the
// seam (`applyEdit` / `appendNote`) against the CURRENT `briefFacts` and applied
// by the agnostic store action `commitRail`.
//
// ── THE CHIP LIFECYCLE RULE (chip stable-id rule; landmine 15) ──────────────
// Chip ids are valid ONLY against the facts bag they were projected from, and
// the rail MUST NOT carry a chip array across a commit. Enforced here
// STRUCTURALLY, not by discipline:
//
//   • the chips editor is a SEPARATE component keyed on `projectionKey(facts)`
//     — a new facts bag ⇒ a new key ⇒ React unmounts the editor and its draft
//     dies with it. No chip array can outlive the projection that issued its
//     ids;
//   • `liveFacts` passed to `applyEdit` is ALWAYS the store's current
//     `briefFacts` (the same bag `toVM` just projected), never a captured copy;
//   • the UI never MINTS, reuses or reorders an id. Surviving chips carry their
//     `id` verbatim; a new chip has NO id (the seam seeds it).
//
// Rebuilding groups from labels or positions here would re-introduce the
// photos/items wipe one layer up — which is the entire reason ids exist.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
// No `@/modules/wizard/work/**`, no generation graph, no templateId literal.
// The engine is reached ONLY through the injected adapter.
// (`journeyAgnostic.test.ts` asserts this file's imports.)
// ============================================================================

import { useMemo, useState } from 'react';
import {
  useWizardStore,
  selectBriefFacts,
  selectCommitRail,
} from '@/hooks/useWizardStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type {
  JourneyRailAdapter,
  RailChipEdit,
  RailCommit,
  RailFieldVM,
} from './engines/types';

export interface UnderstoodRailProps {
  /** The engine's rail adapter (from the seam). The ONLY door to engine code. */
  rail: JourneyRailAdapter;
}

/**
 * A stable key per FACTS-BAG IDENTITY — the projection's identity.
 *
 * `commitRail` replaces `briefFacts` with the seam's merged bag in one `set`, so
 * a new object reference IS "a commit happened, ids re-issued". Keying the chips
 * editor on this is what makes "never carry a chip array across a commit" a
 * structural guarantee rather than a code-review promise.
 *
 * A WeakMap (not a hash of the content) because identity is exactly the
 * question: two commits that happen to produce identical chip labels are still
 * two different projections.
 */
const PROJECTION_IDS = new WeakMap<object, number>();
let projectionSeq = 0;
function projectionKey(facts: object | null | undefined): string {
  if (!facts) return 'empty';
  let id = PROJECTION_IDS.get(facts);
  if (id === undefined) {
    id = ++projectionSeq;
    PROJECTION_IDS.set(facts, id);
  }
  return `p${id}`;
}

export default function UnderstoodRail({ rail }: UnderstoodRailProps) {
  const briefFacts = useWizardStore(selectBriefFacts);
  const commitRail = useWizardStore(selectCommitRail);
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const facts = briefFacts ?? undefined;
  const vm = useMemo(() => rail.toVM(facts), [rail, facts]);
  const pKey = projectionKey(briefFacts);

  /**
   * The ONE write path. Two distinct failure modes, both surfaced — never
   * swallowed:
   *   • `{ok:false}` from the seam = zod pre-validation failed ⇒ nothing was
   *     sent (landmine 5). Show the seam's own message.
   *   • `{ok:false}` from `commitRail` = saveDraft rejected ⇒ the store already
   *     REVERTED the optimistic state (decision 5). Say so.
   */
  const submit = async (result: RailCommit): Promise<boolean> => {
    if (!result.ok) {
      toast(result.error, { variant: 'error' });
      return false;
    }
    setSaving(true);
    const saved = await commitRail(result);
    setSaving(false);
    if (!saved.ok) {
      toast('Couldn’t save — reverted, try again', { variant: 'error' });
      return false;
    }
    return true;
  };

  const submitText = async (fieldId: string, value: string) => {
    // liveFacts = the CURRENT bag, always (never a captured copy).
    const ok = await submit(rail.applyEdit(fieldId, { kind: 'text', value }, facts));
    if (ok) setEditingId(null);
  };

  const submitChips = async (fieldId: string, chips: RailChipEdit[]) => {
    const ok = await submit(rail.applyEdit(fieldId, { kind: 'chips', value: chips }, facts));
    if (ok) setEditingId(null);
  };

  const submitNote = async (note: string) => submit(rail.appendNote(note, facts));

  return (
    <aside
      data-testid="understood-rail"
      className="w-[312px] flex-none bg-app-canvas border-r border-app-hairline
                 flex flex-col min-h-0"
    >
      <div className="flex-none px-[22px] pt-5 pb-3.5">
        <div className="font-app-mono font-bold text-[10px] tracking-[0.11em] text-app-faint">
          WHAT WE UNDERSTOOD
        </div>
        <div className="font-app-sans text-[11.5px] text-app-placeholder mt-[3px]">
          Tap anything to correct it
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-[22px]">
        {vm.fields.map((field) => (
          <RailField
            key={field.id}
            field={field}
            editing={editingId === field.id}
            saving={saving}
            projectionKey={pKey}
            onEdit={() => setEditingId(field.id)}
            onCancel={() => setEditingId(null)}
            onSubmitText={(v) => submitText(field.id, v)}
            onSubmitChips={(chips) => submitChips(field.id, chips)}
          />
        ))}
      </div>

      <NoteBox saving={saving} onSubmit={submitNote} />
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// One rail block
// ─────────────────────────────────────────────────────────────────────────────

function RailField({
  field,
  editing,
  saving,
  projectionKey: pKey,
  onEdit,
  onCancel,
  onSubmitText,
  onSubmitChips,
}: {
  field: RailFieldVM;
  editing: boolean;
  saving: boolean;
  projectionKey: string;
  onEdit: () => void;
  onCancel: () => void;
  onSubmitText: (value: string) => void;
  onSubmitChips: (chips: RailChipEdit[]) => void;
}) {
  return (
    <div
      data-testid={`rail-field-${field.id}`}
      data-skeleton={field.skeleton ? 'true' : 'false'}
      className={cn('py-[11px] border-t border-app-hairline', field.skeleton && 'opacity-50')}
    >
      <div className="font-app-mono font-semibold text-[10px] tracking-[0.06em] text-app-faint mb-1.5">
        {field.label}
      </div>

      {/* UNKNOWN — the honest state. Not "" (which would be a claim we never
          made), and not a default (a rail headed WHAT WE UNDERSTOOD must not
          present a guess as a belief). */}
      {field.skeleton && !editing && (
        <div className="flex items-center gap-1.5">
          <span
            data-testid={`rail-skeleton-${field.id}`}
            aria-label="Not known yet"
            className="h-[9px] w-[70%] rounded-[5px] bg-app-stripes"
          />
          {field.editable && <EditAffordance fieldId={field.id} onEdit={onEdit} />}
        </div>
      )}

      {!field.skeleton && field.kind !== 'chips' && !editing && (
        <div className="flex items-center gap-1.5">
          <span
            data-testid={`rail-value-${field.id}`}
            className="flex-1 font-app-sans font-medium text-[13px] text-app-slate"
          >
            {field.value}
          </span>
          {field.editable && <EditAffordance fieldId={field.id} onEdit={onEdit} />}
        </div>
      )}

      {!field.skeleton && field.kind === 'chips' && !editing && (
        <div className="flex items-start gap-1.5">
          <div className="flex-1 flex flex-wrap gap-[5px]">
            {(field.chips ?? []).map((chip) => (
              <Badge key={chip.id} data-testid={`rail-chip-${chip.id}`} variant="secondary">
                {chip.label}
              </Badge>
            ))}
          </div>
          {field.editable && <EditAffordance fieldId={field.id} onEdit={onEdit} />}
        </div>
      )}

      {editing && field.kind !== 'chips' && (
        <TextEditor
          fieldId={field.id}
          initial={field.value ?? ''}
          saving={saving}
          onCancel={onCancel}
          onSubmit={onSubmitText}
        />
      )}

      {editing && field.kind === 'chips' && (
        // KEYED ON THE PROJECTION (chip stable-id rule): a commit swaps the facts
        // bag ⇒ new key ⇒ this editor unmounts and its chip draft — whose ids
        // belong to the OLD bag — cannot survive into the next edit.
        <ChipsEditor
          key={`${field.id}-${pKey}`}
          fieldId={field.id}
          initial={field.chips ?? []}
          saving={saving}
          onCancel={onCancel}
          onSubmit={onSubmitChips}
        />
      )}
    </div>
  );
}

function EditAffordance({ fieldId, onEdit }: { fieldId: string; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      data-testid={`rail-edit-${fieldId}`}
      aria-label="Edit"
      className="text-app-placeholder hover:text-app-ink transition-colors duration-200"
    >
      <AppIcon name="edit" size={15} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline editors — thin, no dialog
// ─────────────────────────────────────────────────────────────────────────────

function TextEditor({
  fieldId,
  initial,
  saving,
  onCancel,
  onSubmit,
}: {
  fieldId: string;
  initial: string;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex items-center gap-1.5">
      <Input
        autoFocus
        value={value}
        disabled={saving}
        data-testid={`rail-input-${fieldId}`}
        aria-label={`Edit ${fieldId}`}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit(value);
          if (e.key === 'Escape') onCancel();
        }}
        className="h-8 text-[13px]"
      />
      <button
        type="button"
        onClick={() => onSubmit(value)}
        disabled={saving}
        data-testid={`rail-save-${fieldId}`}
        aria-label="Save"
        className="text-app-primary disabled:opacity-40"
      >
        <AppIcon name="check" size={18} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        data-testid={`rail-cancel-${fieldId}`}
        aria-label="Cancel"
        className="text-app-placeholder hover:text-app-ink"
      >
        <AppIcon name="close" size={16} />
      </button>
    </div>
  );
}

/**
 * The chips editor. Its ONLY jobs are to carry ids and to collect labels.
 *
 * It NEVER mints an id, never re-derives one, never reorders one onto a
 * different chip: a surviving chip keeps `id` verbatim, a new chip has NO id
 * (the seam applies its own seed defaults), a removed chip simply stops being
 * submitted (the seam deletes the unreferenced live entry), and the submitted
 * ARRAY ORDER is the new order. All of the join semantics live in the adapter.
 */
function ChipsEditor({
  fieldId,
  initial,
  saving,
  onCancel,
  onSubmit,
}: {
  fieldId: string;
  initial: { id: string; label: string }[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (chips: RailChipEdit[]) => void;
}) {
  // Seeded ONCE from the projection this component is keyed to (see the key at
  // the call site) — never re-seeded, never carried across a commit.
  const [draft, setDraft] = useState<RailChipEdit[]>(() =>
    initial.map((c) => ({ id: c.id, label: c.label }))
  );

  const setLabel = (index: number, label: string) =>
    setDraft((d) => d.map((c, i) => (i === index ? { ...c, label } : c)));

  return (
    <div className="space-y-1.5" data-testid={`rail-chips-editor-${fieldId}`}>
      {draft.map((chip, i) => (
        <div key={chip.id ?? `new-${i}`} className="flex items-center gap-1.5">
          <Input
            value={chip.label}
            disabled={saving}
            data-testid={`rail-chip-input-${i}`}
            aria-label={`Item ${i + 1}`}
            onChange={(e) => setLabel(i, e.target.value)}
            className="h-8 text-[13px]"
          />
          <button
            type="button"
            onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
            disabled={saving}
            data-testid={`rail-chip-remove-${i}`}
            aria-label={`Remove item ${i + 1}`}
            className="text-app-placeholder hover:text-app-danger"
          >
            <AppIcon name="close" size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        // NO id — that is what tells the seam "this is a NEW entry".
        onClick={() => setDraft((d) => [...d, { label: '' }])}
        disabled={saving}
        data-testid="rail-chip-add"
        className="font-app-sans text-[12px] font-semibold text-app-primary inline-flex items-center gap-1"
      >
        <AppIcon name="add" size={14} />
        Add
      </button>

      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          disabled={saving}
          data-testid="rail-chips-save"
          onClick={() => onSubmit(draft)}
        >
          Save
        </Button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          data-testid="rail-chips-cancel"
          className="font-app-sans text-[12px] text-app-muted hover:text-app-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "Something wrong?" — append-only free text
// ─────────────────────────────────────────────────────────────────────────────

function NoteBox({
  saving,
  onSubmit,
}: {
  saving: boolean;
  onSubmit: (note: string) => Promise<boolean>;
}) {
  const [note, setNote] = useState('');

  const send = async () => {
    if (!note.trim()) return;
    const ok = await onSubmit(note.trim());
    if (ok) setNote('');
  };

  return (
    <div className="flex-none px-[22px] py-3.5 border-t border-app-hairline">
      <div className="font-app-sans font-semibold text-[11px] text-app-muted mb-[7px]">
        Something wrong?
      </div>
      <div className="flex items-center gap-[7px]">
        <AppIcon name="chat_bubble" size={16} className="text-app-placeholder" />
        <Input
          value={note}
          disabled={saving}
          placeholder="Tell us…"
          data-testid="rail-note-input"
          aria-label="Something wrong?"
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send();
          }}
          className="h-9 text-[12px]"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={saving || !note.trim()}
          data-testid="rail-note-submit"
          aria-label="Send"
          className="text-app-primary disabled:opacity-40"
        >
          <AppIcon name="send" size={16} />
        </button>
      </div>
    </div>
  );
}
