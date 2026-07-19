'use client';

// D1 — "One line in" entry composer (engineDecider Phase 2).
//
// The hi-fi entry screen: a live-read rail on the LEFT (matching the work
// journey's rail convention) whose "WHAT YOUR SITE LEADS WITH" field animates
// spinner → resolved card as classification lands, + a centered composer to its
// right. It WRAPS the shared `useEntryClassify` hook (URL ⇒
// /api/v2/scrape-website, text ⇒ /api/v2/understand, entry:true) — same submit
// logic as the legacy EntryInputStep, new chrome.
//
// Firewall: this segment imports only pure `@/modules/brief` + the agnostic rail
// field + fetch (via the hook). No template/generation/seam graph.
//
// Phase 2 scope: D1 replaces the bare input step; on a resolved read it dwells a
// beat on the resolved rail card, then hands the draft up via `onSuccess` to the
// existing confirm/journey branch (routing is re-pointed to D2–D6 in Phases 3–4).

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Images,
  Loader2,
  Rocket,
  Store,
  Zap,
} from 'lucide-react';
import type { Brief } from '@/types/brief';
import type { ResolvedEngine, EngineStatus } from '@/modules/brief/classify';
import { getEntryFacts } from '@/modules/brief/classify';
import {
  EngineRailField,
  type EngineRailFieldData,
} from '@/components/onboarding/journey/UnderstoodRail';
import { cn } from '@/lib/utils';
import { useEntryClassify } from '../EntryInputStep';

/**
 * Plain-language "what your site leads with" copy per resolved engine (NO engine
 * jargon in user-facing text — the closed-5 engine names never surface here).
 */
const ENGINE_COPY: Record<
  ResolvedEngine,
  { label: string; descriptor: string; icon: React.ReactNode }
> = {
  work: {
    label: 'Lead with your work',
    descriptor: 'your portfolio does the talking',
    icon: <Images className="w-[18px] h-[18px]" />,
  },
  trust: {
    label: 'Lead with your experience',
    descriptor: 'people trust your track record',
    icon: <BadgeCheck className="w-[18px] h-[18px]" />,
  },
  thing: {
    label: 'Lead with your product',
    descriptor: 'what it does, made obvious',
    icon: <Boxes className="w-[18px] h-[18px]" />,
  },
  place: {
    label: 'Lead with your place',
    descriptor: 'your space, menu or location',
    icon: <Store className="w-[18px] h-[18px]" />,
  },
  'quick-yes': {
    label: 'One clear ask',
    descriptor: 'they already know you — just act',
    icon: <Zap className="w-[18px] h-[18px]" />,
  },
};

const EXAMPLES: { text: string; tag: string; ambiguous?: boolean }[] = [
  { text: 'AI note-taker for sales calls', tag: 'PRODUCT' },
  { text: 'Leadership coaching for new managers', tag: 'EXPERIENCE' },
  { text: 'Branding & design studio', tag: 'COULD GO TWO WAYS', ambiguous: true },
];

interface D1EntryProps {
  onSuccess: (rawInput: string, briefDraft: Brief) => void;
}

export default function D1Entry({ onSuccess }: D1EntryProps) {
  const [mode, setMode] = useState<'describe' | 'site'>('describe');
  const [result, setResult] = useState<{ rawInput: string; draft: Brief } | null>(null);

  const {
    value,
    setValue,
    loading,
    error,
    creditsBlocked,
    normalizedUrl,
    isValid,
    validationError,
    actionCost,
    submit,
  } = useEntryClassify((rawInput, draft) => setResult({ rawInput, draft }));

  // Dwell a beat on the resolved rail card, THEN hand off. Keeps the "spinner →
  // resolved" read visible before the confirm/journey branch takes over (Phase
  // 2 has no D2–D6 to route to yet). Cleaned up if the component unmounts first.
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => onSuccessRef.current(result.rawInput, result.draft), 700);
    return () => clearTimeout(t);
  }, [result]);

  const submitting = loading || !!result;

  // Rail engine field: resolving while the call is in flight, then the read from
  // facts (null engine ⇒ ambiguous ⇒ "could go two ways").
  const facts = result ? getEntryFacts(result.draft) : null;
  const status: EngineStatus | undefined = loading ? 'resolving' : facts?.engineStatus;
  const engine: ResolvedEngine | null = facts?.resolvedEngine ?? null;
  const copy = engine ? ENGINE_COPY[engine] : null;
  const engineRail: EngineRailFieldData | undefined = status
    ? { status, label: copy?.label, descriptor: copy?.descriptor, icon: copy?.icon }
    : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit();
  };

  return (
    <div className="min-h-screen flex bg-app-frame">
      {/* Live-read rail (LEFT — matches the work journey's rail convention). */}
      <aside className="w-[320px] flex-none bg-app-surface-sunken border-r border-app-border-frame flex flex-col">
        <div className="flex-none px-[22px] pt-5 pb-3.5">
          <div className="font-app-mono font-bold text-[10px] tracking-[0.11em] text-app-faint">
            WHAT WE UNDERSTOOD
          </div>
          <div className="font-app-sans text-[11.5px] text-app-placeholder mt-[3px]">
            A first read — nothing here is locked
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-[22px]">
          <D1RailFact label="WHAT YOU DO" value={facts?.summary || facts?.oneLiner} />
          <D1RailFact label="WHERE" value={facts?.deliveryModel ?? undefined} />
          {engineRail && <EngineRailField engine={engineRail} />}
          <D1RailFact label="WHAT YOU SELL" value={facts?.offer} />
        </div>

        <div className="flex-none px-[22px] py-3.5 border-t border-app-hairline">
          <p className="font-app-sans text-[11px] text-app-faint">
            This is just a first read — you can change any of it before we build.
          </p>
        </div>
      </aside>

      {/* Composer */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-[radial-gradient(120%_90%_at_50%_-6%,#eef4ff_0%,#fcfcfd_58%)]">
        <div className="w-full max-w-[700px] flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 rounded-app-pill bg-app-tint px-2.5 py-1 font-app-sans font-semibold text-[11px] text-app-primary-deep">
            <Rocket className="w-3.5 h-3.5" />
            Welcome to Lessgo AI
          </div>

          <h1 className="mt-4 font-app-sans font-extrabold text-[38px] leading-[1.12] tracking-[-1.2px] text-app-ink max-w-[620px]">
            Tell us what you do — in a line.
          </h1>
          <p className="mt-3 font-app-sans text-[15px] text-app-muted max-w-[520px]">
            One sentence about your business, or paste your current site. We read
            it and set the page up the way your buyers actually decide.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-7 w-full max-w-[560px] rounded-app-modal border border-app-border-input bg-app-surface p-[18px] shadow-app-float text-left"
          >
            {/* 2-tab segmented control */}
            <div className="inline-flex rounded-app-ctl bg-app-track p-0.5 mb-3">
              {(
                [
                  ['describe', 'Describe your business'],
                  ['site', 'Use my current site'],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'rounded-[8px] px-3 py-1.5 font-app-sans font-semibold text-[12px] transition-colors',
                    mode === m
                      ? 'bg-app-surface text-app-ink shadow-app-card'
                      : 'text-app-muted'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <textarea
              id="d1-entry-input"
              data-testid="d1-entry-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={submitting}
              maxLength={500}
              placeholder={
                mode === 'site'
                  ? 'yourcompany.com'
                  : 'e.g. Documentary wedding photography in Amsterdam'
              }
              className="w-full min-h-[52px] resize-none font-app-sans text-[16px] text-app-ink placeholder:text-app-placeholder outline-none"
            />

            <div className="flex items-center justify-between mt-1">
              <p className="font-app-sans text-[12px] text-app-danger">
                {!isValid && value.length > 0 ? validationError : ''}
              </p>
              <p className="font-app-sans text-[11px] text-app-faint">{value.length}/500</p>
            </div>

            {normalizedUrl && (
              <p className="font-app-sans text-[12px] text-app-muted mt-1">
                Looks like a website — we&apos;ll read it and pull your copy + testimonials.
              </p>
            )}

            {error && (
              <p className="font-app-sans text-[12px] text-app-danger mt-2">{error}</p>
            )}

            {creditsBlocked && (
              <div
                data-testid="entry-credits-notice"
                className="mt-2 rounded-app-input border border-app-cta/40 bg-app-cta/5 p-3"
              >
                <p className="font-app-sans text-[12px] text-app-ink">
                  {typeof creditsBlocked.required === 'number' &&
                  typeof creditsBlocked.available === 'number' ? (
                    <>
                      Not enough credits — this needs {creditsBlocked.required} credit
                      {creditsBlocked.required === 1 ? '' : 's'} and you have{' '}
                      {creditsBlocked.available} left.
                    </>
                  ) : (
                    <>You don&apos;t have enough credits left for this.</>
                  )}
                </p>
                <a
                  href="/dashboard/billing"
                  className="mt-1 inline-block font-app-sans font-semibold text-[12px] text-app-primary underline"
                >
                  Get more credits
                </a>
              </div>
            )}

            <button
              type="submit"
              data-testid="d1-continue"
              disabled={!isValid || submitting}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-[11px] bg-app-cta px-4 py-3 font-app-sans font-bold text-[13.5px] text-white shadow-app-btn-cta disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {normalizedUrl ? 'Reading your site…' : 'Understanding…'}
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="font-app-sans text-[11px] text-app-faint text-center mt-2">
              Takes ~30 seconds · Costs {actionCost} credit{actionCost === 1 ? '' : 's'}
            </p>
          </form>

          {/* Example rows */}
          <div className="mt-8 w-full max-w-[560px] text-left">
            <div className="font-app-mono font-semibold text-[10px] tracking-[0.11em] text-app-faint mb-2">
              A LINE IS ENOUGH — WE TAKE IT FROM THERE
            </div>
            <div className="flex flex-col gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.text}
                  type="button"
                  disabled={submitting}
                  onClick={() => setValue(ex.text)}
                  className="flex items-center justify-between gap-3 rounded-app-input border border-app-border-hairline bg-app-surface px-3 py-2 text-left hover:border-app-primary/40 transition-colors disabled:opacity-50"
                >
                  <span className="font-app-sans text-[13px] text-app-ink truncate">
                    &ldquo;{ex.text}&rdquo;
                  </span>
                  <span
                    className={cn(
                      'flex-none inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 font-app-mono font-bold text-[9.5px]',
                      ex.ambiguous
                        ? 'bg-[#fbf1e0] text-[#c47d1a]'
                        : 'bg-[#eef4ff] text-app-primary'
                    )}
                  >
                    <ArrowRight className="w-3 h-3" />
                    {ex.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A single live-read rail row: value when known, striped placeholder otherwise. */
function D1RailFact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div
      data-skeleton={value ? 'false' : 'true'}
      className={cn('py-[11px] border-t border-app-hairline', !value && 'opacity-50')}
    >
      <div className="font-app-mono font-semibold text-[10px] tracking-[0.06em] text-app-faint mb-1.5">
        {label}
      </div>
      {value ? (
        <span className="font-app-sans font-medium text-[13px] text-app-slate">{value}</span>
      ) : (
        <span
          aria-label="Not known yet"
          className="block h-[9px] w-[70%] rounded-[5px] bg-app-stripes"
        />
      )}
    </div>
  );
}
