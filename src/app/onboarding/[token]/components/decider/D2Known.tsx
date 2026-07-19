'use client';

// D2 — "Known & unambiguous → don't ask" (engineDecider Phase 3).
//
// The ~80% path: the engine resolved via a committed registry lookup with enough
// confidence (`engineStatus: 'known'`), so we ask ZERO questions. We simply tell
// the visitor how we'll lead — and hand off (Continue → D6, which owns the
// confirm handoff). The engine is a REVISABLE BELIEF: a "not quite right?"
// change-affordance reopens D4 (Phase 4). Until D4 exists it is a greyed,
// honest placeholder (no dead-end route) per the greyed-placeholder rule.
//
// NO editable one-liner appears here — that screen (the old JourneyEntryStep) is
// retired; the one-liner is typed exactly ONCE, at D1 (the O1 kill).
//
// Firewall: pure `@/modules/brief` types + the agnostic rail field + lucide only.
// No template/generation/seam graph.

import { ArrowRight, BadgeCheck, Boxes, Images, Store, Zap } from 'lucide-react';
import type { Brief } from '@/types/brief';
import type { ResolvedEngine } from '@/modules/brief/classify';
import { getEntryFacts } from '@/modules/brief/classify';
import { EngineRailField } from '@/components/onboarding/journey/UnderstoodRail';
import JourneyTopBar from '@/components/onboarding/journey/JourneyTopBar';
import { cn } from '@/lib/utils';

/** Plain-language "how you win" copy per engine (no engine jargon surfaces).
 *  Phase 7 does final humanization + the icon pass. */
export const ENGINE_LEAD: Record<
  ResolvedEngine,
  { label: string; descriptor: string; lead: string; icon: React.ReactNode }
> = {
  work: {
    label: 'Lead with your work',
    descriptor: 'your portfolio does the talking',
    lead: 'so your site will lead with your work',
    icon: <Images className="w-[18px] h-[18px]" />,
  },
  trust: {
    label: 'Lead with your experience',
    descriptor: 'people trust your track record',
    lead: 'so your site will lead with your experience',
    icon: <BadgeCheck className="w-[18px] h-[18px]" />,
  },
  thing: {
    label: 'Lead with your product',
    descriptor: 'what it does, made obvious',
    lead: 'so your site will lead with what your product does',
    icon: <Boxes className="w-[18px] h-[18px]" />,
  },
  place: {
    label: 'Lead with your place',
    descriptor: 'your space, menu or location',
    lead: 'so your site will lead with your place',
    icon: <Store className="w-[18px] h-[18px]" />,
  },
  'quick-yes': {
    label: 'One clear ask',
    descriptor: 'they already know you — just act',
    icon: <Zap className="w-[18px] h-[18px]" />,
    lead: 'so your site will make one clear ask',
  },
};

interface D2KnownProps {
  briefDraft: Brief;
  resolvedEngine: ResolvedEngine;
  /** Continue → D6 (the confirm handoff). */
  onContinue: () => void;
  /** "Not quite right?" → reopens D4 (Phase 4). Absent ⇒ greyed placeholder. */
  onChange?: () => void;
}

export default function D2Known({ briefDraft, resolvedEngine, onContinue, onChange }: D2KnownProps) {
  const facts = getEntryFacts(briefDraft);
  const copy = ENGINE_LEAD[resolvedEngine];
  const noun = briefDraft.businessType?.trim();

  return (
    <div className="app-chrome fixed inset-0 flex flex-col bg-app-canvas">
      <JourneyTopBar step={null} right={<span />} />

      <div className="flex-1 min-h-0 overflow-auto flex">
        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center p-10 bg-[radial-gradient(120%_90%_at_50%_-6%,#eef4ff_0%,#fcfcfd_58%)]">
          <div data-testid="decider-d2" className="w-full max-w-[560px] flex flex-col items-center text-center">
            <span className="flex-none w-[52px] h-[52px] rounded-[14px] bg-app-tint text-app-primary flex items-center justify-center mb-5">
              {copy.icon}
            </span>

            <h1 className="font-app-sans font-extrabold text-[32px] leading-[1.14] tracking-[-1px] text-app-ink max-w-[480px]">
              {noun ? (
                <>
                  You&rsquo;re a {noun} — {copy.lead}.
                </>
              ) : (
                <>We read your line — {copy.lead}.</>
              )}
            </h1>
            <p className="mt-3 font-app-sans text-[15px] text-app-muted max-w-[440px]">
              That&rsquo;s the fastest way to win the visitors you want. No questions needed — you
              can still change this any time before we build.
            </p>

            {/* Change-affordance (→ D4, Phase 4). Greyed placeholder until then. */}
            <button
              type="button"
              data-testid="decider-d2-change"
              onClick={onChange}
              disabled={!onChange}
              title={onChange ? undefined : 'Coming soon — you can change this once we add it'}
              className={cn(
                'mt-6 w-full max-w-[420px] rounded-app-input border px-4 py-3 text-left transition-colors',
                onChange
                  ? 'border-app-border-hairline bg-app-surface hover:border-app-primary/40'
                  : 'border-app-border-hairline bg-app-surface opacity-60 cursor-not-allowed'
              )}
            >
              <div className="font-app-sans font-semibold text-[13px] text-app-ink">
                Not quite how your buyers decide?
              </div>
              <div className="font-app-sans text-[12px] text-app-muted mt-0.5">
                {onChange ? 'Change how buyers decide' : 'Changing this is coming soon'}
              </div>
            </button>

            <button
              type="button"
              data-testid="decider-d2-continue"
              onClick={onContinue}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-[11px] bg-app-primary px-6 py-3 font-app-sans font-bold text-[13.5px] text-white shadow-app-btn-primary"
            >
              Looks right — continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live-read rail (right) */}
        <aside className="w-[320px] flex-none bg-app-surface-sunken border-l border-app-border-frame flex flex-col">
          <div className="flex-none px-[22px] pt-5 pb-3.5">
            <div className="font-app-mono font-bold text-[10px] tracking-[0.11em] text-app-faint">
              WHAT WE UNDERSTOOD
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto px-[22px]">
            <DeciderRailFact label="WHAT YOU DO" value={facts?.summary || facts?.oneLiner} />
            <EngineRailField
              engine={{
                status: 'known',
                label: copy.label,
                descriptor: copy.descriptor,
                icon: copy.icon,
                onChangeEngine: onChange,
              }}
            />
            <DeciderRailFact label="WHAT YOU SELL" value={facts?.offer} />
          </div>
        </aside>
      </div>
    </div>
  );
}

/** A single read-only rail row (value or dash). */
function DeciderRailFact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-[11px] border-t border-app-hairline">
      <div className="font-app-mono font-semibold text-[10px] tracking-[0.06em] text-app-faint mb-1.5">
        {label}
      </div>
      <span className="font-app-sans font-medium text-[13px] text-app-slate">{value || '—'}</span>
    </div>
  );
}
