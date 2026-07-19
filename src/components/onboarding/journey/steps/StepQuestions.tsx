'use client';

// ============================================================================
// STEP 03 — questions. AGNOSTIC FRAME.
//
// Renders `seam.steps.questions(vm, ctx)` through a renderer for the FOUR CLOSED
// question kinds (text / group / price / choice). `choice` is the E3 extension
// (work-onboarding-questions, D-A): chips / one-tap confirm / multi-select /
// free-text escape — everything the E1 `text` kind cannot express. The frame
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
//
// ── CONTEXT (D-B) ────────────────────────────────────────────────────────────
// `questions(vm, ctx)` also receives `ctx` — upstream signals the VM can't
// carry: the profession wording key (`businessType`, off the store), the facts
// bag (confirm suggestions read `facts.entry`) and this session's answered ids
// (D-C price answered-detection). ctx is READ-ONLY input; commits still route
// only through the rail adapter.
//
// ── REQUIRED GATE (D-D) ──────────────────────────────────────────────────────
// The step reports `blocked = questions.some(q => q.required && !q.answered)`
// up to the shell (mirrors `onBuildingChange`); the shell disables Continue on
// STEP 03 while blocked. The gate lives in the agnostic Continue, not here.
// ============================================================================

import { useEffect, useState } from 'react';
import {
  useWizardStore,
  selectBriefFacts,
  selectBusinessTypeKey,
  selectCommitRail,
} from '@/hooks/useWizardStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type {
  JourneyQuestion,
  JourneyQuestionsContext,
  RailCommit,
} from '../engines/types';
import type { JourneyStepProps } from '../JourneyShell';

type PriceMode = 'exact' | 'from' | 'on-request';

const PRICE_MODES: { value: PriceMode; label: string }[] = [
  { value: 'on-request', label: 'On request' },
  { value: 'from', label: 'From' },
  { value: 'exact', label: 'Exact' },
];

// qa-0719 B2 — the currency the amount is quoted in. Default USD; the founder
// validates on preview. The rail's `priceLabel` renders whatever is committed.
const CURRENCIES: { value: string; label: string }[] = [
  { value: '$', label: '$ USD' },
  { value: '€', label: '€ EUR' },
  { value: '£', label: '£ GBP' },
  { value: '₹', label: '₹ INR' },
];
const DEFAULT_CURRENCY = '$';

export default function StepQuestions({ seam, onBlockedChange }: JourneyStepProps) {
  const briefFacts = useWizardStore(selectBriefFacts);
  const businessTypeKey = useWizardStore(selectBusinessTypeKey);
  const commitRail = useWizardStore(selectCommitRail);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  // Question SLOTS answered THIS session (D-C). Feeds ctx so the gating layer can
  // tell a genuine "on request" answer from the seed default after an answer.
  // qa-0719 B3 — tracked by `slot` (not `id`): the gating layer decides re-render
  // via `session(slot)`, and a question's `id` can DIFFER from its slot (work's
  // identity question is `id:'name'`). Keying by id left `session('identity')`
  // permanently false → the name question VANISHED after being answered.
  const [answeredIds, setAnsweredIds] = useState<readonly string[]>([]);
  // Which answered-compact rows the user re-opened to correct (D-E). Same slot key.
  const [expandedIds, setExpandedIds] = useState<readonly string[]>([]);

  const facts = briefFacts ?? undefined;
  const ctx: JourneyQuestionsContext = {
    businessType: businessTypeKey ?? null,
    facts,
    sessionAnswered: answeredIds,
  };
  // Re-projected on every commit, so an answered question either disappears
  // (known upstream) or collapses to its answered-compact state (D-E) — the
  // rail filling up IS the journey's promise.
  const questions = seam.steps.questions(seam.rail.toVM(facts), ctx);

  // Required gate (D-D). Report up to the shell whenever the derived block flips.
  const blocked = questions.some((q) => q.required && !q.answered);
  useEffect(() => {
    onBlockedChange?.(blocked);
  }, [blocked, onBlockedChange]);

  /** The ONE write path (identical failure semantics to the rail's). `slotKey`
   *  is the question's gating SLOT (`slot ?? id`) — see `answeredIds` above. */
  const submit = async (result: RailCommit, slotKey: string): Promise<boolean> => {
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
    setAnsweredIds((ids) => (ids.includes(slotKey) ? ids : [...ids, slotKey]));
    // Collapse the row back to compact after a successful correction.
    setExpandedIds((ids) => ids.filter((id) => id !== slotKey));
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

      {questions.map((question) => {
        // Gating SLOT key (qa-0719 B3): `slot` when the seam supplies it, else the
        // id. Session-answered + expand state are tracked by THIS, so the gating
        // layer's `session(slot)` re-render decision fires for every slot.
        const slotKey = question.slot ?? question.id;
        return (
          <QuestionCard
            key={question.id}
            question={question}
            saving={saving}
            expanded={expandedIds.includes(slotKey)}
            onExpand={() =>
              setExpandedIds((ids) => (ids.includes(slotKey) ? ids : [...ids, slotKey]))
            }
            onCommit={(result) => submit(result, slotKey)}
            liveFacts={facts}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The renderer for the FOUR CLOSED kinds (+ answered-compact per D-E)
// ─────────────────────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  saving,
  expanded,
  liveFacts,
  onExpand,
  onCommit,
}: {
  question: JourneyQuestion;
  saving: boolean;
  expanded: boolean;
  liveFacts: Record<string, unknown> | undefined;
  onExpand: () => void;
  onCommit: (result: RailCommit) => Promise<boolean>;
}) {
  // Answered-compact (D-E): an asked+answered slot stays VISIBLE but collapses
  // to "value — Change" instead of vanishing (correctable, and required slots
  // stay reachable). It re-opens on tap.
  const compact = question.answered && !expanded;

  return (
    <div
      data-testid={`question-${question.id}`}
      className="rounded-app-card border border-app-hairline bg-app-surface p-4 space-y-3"
    >
      <div className="font-app-sans text-sm font-semibold text-app-ink">{question.label}</div>

      {compact ? (
        <AnsweredCompact id={question.id} summary={answeredSummary(question)} onChange={onExpand} />
      ) : (
        <>
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

          {question.kind === 'choice' && (
            <ChoiceAnswer
              id={question.id}
              options={question.options}
              multi={question.multi ?? false}
              allowCustom={question.allowCustom ?? false}
              suggested={question.suggested ?? []}
              selected={question.selected ?? []}
              saving={saving}
              onSubmit={(values) => onCommit(question.commit(values, liveFacts))}
            />
          )}
        </>
      )}
    </div>
  );
}

/** Best-effort answered value for the compact summary. The descriptor carries
 *  no explicit answer field, so we derive from what each kind exposes; falls
 *  back to nothing (the label above already names the slot). */
function answeredSummary(question: JourneyQuestion): string {
  if (question.kind === 'text') return question.prefill ?? '';
  // qa-0719 B5 — the COMMITTED value(s), projected from live facts — NOT
  // `suggested` (the confirm candidate set), which mis-reported the answer.
  // Map each committed value back to its option LABEL so single-select rows read
  // "Established"/"WhatsApp", not the raw enum values; fall back to the raw value
  // (dreamClient/languages/praise where value===label, or a custom entry).
  if (question.kind === 'choice') {
    const labelOf = (value: string) =>
      question.options.find((o) => o.value === value)?.label ?? value;
    return (question.selected ?? []).map(labelOf).join(', ');
  }
  return '';
}

function AnsweredCompact({
  id,
  summary,
  onChange,
}: {
  id: string;
  summary: string;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-app-sans text-sm text-app-muted truncate">
        {summary || 'Answered'}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        data-testid={`question-change-${id}`}
        onClick={onChange}
      >
        Change
      </Button>
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
  onSubmit: (price: { mode: PriceMode; amount?: number; currency?: string }) => Promise<boolean>;
}) {
  const [mode, setMode] = useState<PriceMode>('on-request');
  const [amount, setAmount] = useState('');
  // qa-0719 B2 — currency for the from/exact modes (defaults USD).
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

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
        <div className="flex items-center gap-2">
          <SegmentedControl
            value={currency}
            onValueChange={setCurrency}
            options={CURRENCIES}
            aria-label="Currency"
            data-testid={`question-price-currency-${id}`}
          />
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
        </div>
      )}

      <Button
        type="button"
        size="sm"
        disabled={!canSubmit}
        data-testid={`question-save-${id}`}
        onClick={() =>
          void onSubmit(
            mode === 'on-request' ? { mode } : { mode, amount: parsed, currency }
          )
        }
      >
        Save
      </Button>
    </div>
  );
}

/** De-dupe an ordered string list (order-preserving). */
function dedupe(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

/**
 * `choice` (E3, D-A). ONE mental model — "pick, then Save" (qa-0719 B4):
 *   • single-select → tapping a chip SELECTS it (radio); Save commits it.
 *   • multi         → every option is a TOGGLE chip; Save commits the array.
 *   • allowCustom   → a small input + add appends a free-text chip to the
 *                     selection (single: replaces the selection).
 *
 * The selection is SEEDED from `selected` (the committed value, projected from
 * live facts) — or, when nothing is committed yet, from `suggested` (the
 * one-tap-confirm candidate set). So pre-selected / already-answered chips arrive
 * ACTIVE and Save is enabled on mount (qa-0719 B5/B6), and a multi commit can
 * never DROP a value the user did not re-tap (pre-fix the field was REPLACED with
 * only the re-tapped chips).
 *
 * `suggested` options render PROMINENT within the full option list — never the
 * only tappable options (orchestrator ruling: multi renders ALL options).
 */
function ChoiceAnswer({
  id,
  options,
  multi,
  allowCustom,
  suggested,
  selected: seededSelected,
  saving,
  onSubmit,
}: {
  id: string;
  options: { value: string; label: string }[];
  multi: boolean;
  allowCustom: boolean;
  suggested: string[];
  selected: string[];
  saving: boolean;
  onSubmit: (values: string[]) => Promise<boolean>;
}) {
  // Seed from the committed value(s); confirm posture (nothing committed) seeds
  // the suggested set so it can be confirmed in one Save tap.
  const [selected, setSelected] = useState<readonly string[]>(() => {
    const committed = seededSelected.filter((v) => v.trim().length > 0);
    return dedupe(committed.length > 0 ? committed : suggested);
  });
  const [custom, setCustom] = useState('');
  // Custom values added this session PLUS any seeded selection not in `options`
  // (an earlier free-text answer) — rendered as extra chips so they show ACTIVE.
  const [extras, setExtras] = useState<{ value: string; label: string }[]>(() => {
    const known = new Set(options.map((o) => o.value));
    return dedupe(seededSelected.filter((v) => v.trim().length > 0 && !known.has(v))).map(
      (v) => ({ value: v, label: v })
    );
  });

  const isSuggested = (value: string) => suggested.includes(value);
  const allOptions = [...options, ...extras];

  const toggle = (value: string) =>
    setSelected((cur) => {
      if (!multi) return cur.includes(value) ? [] : [value];
      return cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    });

  const addCustom = () => {
    const v = custom.trim();
    if (!v || saving) return;
    if (!allOptions.some((o) => o.value === v)) setExtras((e) => [...e, { value: v, label: v }]);
    setSelected((cur) => (multi ? (cur.includes(v) ? cur : [...cur, v]) : [v]));
    setCustom('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {allOptions.map((opt) => {
          const active = selected.includes(opt.value);
          const prominent = isSuggested(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              disabled={saving}
              data-testid={`question-chip-${id}-${opt.value}`}
              aria-pressed={active}
              onClick={() => toggle(opt.value)}
              className={cn(
                'font-app-sans inline-flex items-center rounded-app-pill border px-3 py-1.5 text-[13px]',
                'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
                prominent
                  ? 'border-app-primary bg-app-tint font-semibold text-app-ink'
                  : 'border-app-hairline bg-app-surface text-app-muted hover:text-app-ink',
                active && 'ring-2 ring-app-primary ring-offset-1'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {allowCustom && (
        <div className="flex items-center gap-2">
          <Input
            value={custom}
            disabled={saving}
            data-testid={`question-input-${id}`}
            aria-label={`Add your own for ${id}`}
            placeholder="Something else…"
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addCustom();
            }}
            className="h-9 text-[13px]"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={saving || !custom.trim()}
            data-testid={`question-add-${id}`}
            onClick={addCustom}
          >
            Add
          </Button>
        </div>
      )}

      <Button
        type="button"
        size="sm"
        disabled={saving || selected.length === 0}
        data-testid={`question-save-${id}`}
        onClick={() => void onSubmit([...selected])}
      >
        Save
      </Button>
    </div>
  );
}
