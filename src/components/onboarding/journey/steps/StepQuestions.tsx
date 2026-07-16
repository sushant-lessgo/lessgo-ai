'use client';

// ============================================================================
// STEP 03 — questions. AGNOSTIC FRAME.
//
// Renders `seam.steps.questions(vm)` through a renderer for the THREE CLOSED
// question kinds (text / group / price — closed for E1 by ruling). The frame
// never authors a question, never names a field, and never builds a payload:
// every answer calls the QUESTION's own `commit(answer, liveFacts)`, which the
// seam routes through its rail adapter. That is what guarantees an answer can
// never persist a malformed record (work: never a `kind`-less group ⇒ never the
// unrecoverable null-facts strategy 400 — landmine 6).
//
// ── WRITE PATH ──────────────────────────────────────────────────────────────
// `commit(...)` → `commitRail(...)`. ONE write door, shared with the rail; the
// store SERIALIZES commits (P4), so this second caller cannot interleave with a
// rail edit and have a late failure's revert wipe an earlier success.
//
// `liveFacts` is ALWAYS the store's current `briefFacts` — never a captured
// copy (chip stable-id rule: ids are valid only against the bag that issued
// them).
// ============================================================================

import { useState } from 'react';
import {
  useWizardStore,
  selectBriefFacts,
  selectCommitRail,
} from '@/hooks/useWizardStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useToast } from '@/components/ui/toast';
import type { JourneyQuestion, RailCommit } from '../engines/types';
import type { JourneyStepProps } from '../JourneyShell';

type PriceMode = 'exact' | 'from' | 'on-request';

const PRICE_MODES: { value: PriceMode; label: string }[] = [
  { value: 'on-request', label: 'On request' },
  { value: 'from', label: 'From' },
  { value: 'exact', label: 'Exact' },
];

export default function StepQuestions({ seam }: JourneyStepProps) {
  const briefFacts = useWizardStore(selectBriefFacts);
  const commitRail = useWizardStore(selectCommitRail);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const facts = briefFacts ?? undefined;
  // Re-projected on every commit, so an answered question disappears and the
  // next one (if any) appears — the rail filling up IS the journey's promise.
  const questions = seam.steps.questions(seam.rail.toVM(facts));

  /** The ONE write path (identical failure semantics to the rail's). */
  const submit = async (result: RailCommit): Promise<boolean> => {
    if (!result.ok) {
      // Seam zod pre-validation failed ⇒ nothing was sent (landmine 5).
      toast(result.error, { variant: 'error' });
      return false;
    }
    setSaving(true);
    const saved = await commitRail(result);
    setSaving(false);
    if (!saved.ok) {
      // The store already REVERTED the optimistic state (decision 5).
      toast('Couldn’t save — reverted, try again', { variant: 'error' });
      return false;
    }
    return true;
  };

  return (
    <div data-testid="step-questions" data-journey-step={3} className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-app-sans text-2xl font-semibold text-app-ink">
          A few quick questions
        </h1>
        <p className="font-app-sans text-sm text-app-muted">
          Only what we still need. Your answers land in the rail on the left.
        </p>
      </div>

      {questions.length === 0 && (
        <p
          data-testid="questions-none"
          role="status"
          className="font-app-sans text-sm text-app-muted"
        >
          Nothing else to ask — you&apos;re good to continue.
        </p>
      )}

      {questions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          saving={saving}
          onCommit={(result) => submit(result)}
          liveFacts={facts}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The renderer for the 3 CLOSED kinds
// ─────────────────────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  saving,
  liveFacts,
  onCommit,
}: {
  question: JourneyQuestion;
  saving: boolean;
  liveFacts: Record<string, unknown> | undefined;
  onCommit: (result: RailCommit) => Promise<boolean>;
}) {
  return (
    <div
      data-testid={`question-${question.id}`}
      className="rounded-app-card border border-app-hairline bg-app-surface p-4 space-y-3"
    >
      <div className="font-app-sans text-sm font-semibold text-app-ink">{question.label}</div>

      {question.kind === 'text' && (
        <TextAnswer
          id={question.id}
          prefill={question.prefill ?? ''}
          saving={saving}
          onSubmit={(value) => onCommit(question.commit(value, liveFacts))}
        />
      )}

      {question.kind === 'group' && (
        <TextAnswer
          id={question.id}
          prefill=""
          saving={saving}
          clearOnSuccess
          onSubmit={(value) => onCommit(question.commit(value, liveFacts))}
        />
      )}

      {question.kind === 'price' && (
        <PriceAnswer
          id={question.id}
          saving={saving}
          onSubmit={(price) => onCommit(question.commit(price, liveFacts))}
        />
      )}
    </div>
  );
}

function TextAnswer({
  id,
  prefill,
  saving,
  clearOnSuccess,
  onSubmit,
}: {
  id: string;
  prefill: string;
  saving: boolean;
  clearOnSuccess?: boolean;
  onSubmit: (value: string) => Promise<boolean>;
}) {
  const [value, setValue] = useState(prefill);

  const send = async () => {
    if (!value.trim() || saving) return;
    const ok = await onSubmit(value);
    if (ok && clearOnSuccess) setValue('');
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        disabled={saving}
        data-testid={`question-input-${id}`}
        aria-label={`Answer ${id}`}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void send();
        }}
        className="h-9 text-[13px]"
      />
      <Button
        type="button"
        size="sm"
        disabled={saving || !value.trim()}
        data-testid={`question-save-${id}`}
        onClick={() => void send()}
      >
        Save
      </Button>
    </div>
  );
}

/**
 * Price is OPTIONAL and defaults to `on-request` — which is a real answer, not
 * a blank. `exact`/`from` need an amount: the submit stays disabled without one
 * (and the seam refuses it anyway) rather than silently degrading the answer.
 */
function PriceAnswer({
  id,
  saving,
  onSubmit,
}: {
  id: string;
  saving: boolean;
  onSubmit: (price: { mode: PriceMode; amount?: number }) => Promise<boolean>;
}) {
  const [mode, setMode] = useState<PriceMode>('on-request');
  const [amount, setAmount] = useState('');

  const parsed = Number(amount);
  const amountOk = amount.trim() !== '' && Number.isFinite(parsed) && parsed >= 0;
  const canSubmit = !saving && (mode === 'on-request' || amountOk);

  return (
    <div className="space-y-3">
      <SegmentedControl
        value={mode}
        onValueChange={(v) => setMode(v as PriceMode)}
        options={PRICE_MODES}
        aria-label="How you price"
        data-testid={`question-price-mode-${id}`}
      />

      {mode !== 'on-request' && (
        <Input
          value={amount}
          disabled={saving}
          inputMode="decimal"
          placeholder="e.g. 2400"
          data-testid={`question-price-amount-${id}`}
          aria-label="Amount"
          onChange={(e) => setAmount(e.target.value)}
          className="h-9 text-[13px]"
        />
      )}

      <Button
        type="button"
        size="sm"
        disabled={!canSubmit}
        data-testid={`question-save-${id}`}
        onClick={() =>
          void onSubmit(
            mode === 'on-request' ? { mode } : { mode, amount: parsed }
          )
        }
      >
        Save
      </Button>
    </div>
  );
}
