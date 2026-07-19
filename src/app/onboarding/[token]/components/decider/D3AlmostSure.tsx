'use client';

// D3 — "Almost sure → one-tap confirm" (engineDecider Phase 3).
//
// The engine resolved via a committed lookup but BELOW the confidence floor
// (`engineStatus: 'almost-sure'`), so instead of asking a real question we offer
// a single tap to confirm the SAME lookup engine. "Yes" is PURE LOCAL STATE — it
// does NOT re-classify and burns NO extra UNDERSTAND credit (the engine is
// already resolved; the copyEngine is already on the draft). "Something else"
// reopens D4 (Phase 4; greyed placeholder until then).
//
// NO editable one-liner here — typed once at D1 (the O1 kill).
//
// Firewall: pure `@/modules/brief` types + agnostic rail field + lucide only.

import { ArrowRight, Check } from 'lucide-react';
import type { Brief } from '@/types/brief';
import type { ResolvedEngine } from '@/modules/brief/classify';
import { getEntryFacts } from '@/modules/brief/classify';
import { EngineRailField } from '@/components/onboarding/journey/UnderstoodRail';
import JourneyTopBar from '@/components/onboarding/journey/JourneyTopBar';
import { ENGINE_LEAD, ENGINE_QUESTION } from './engineCopy';
import { cn } from '@/lib/utils';

interface D3AlmostSureProps {
  briefDraft: Brief;
  resolvedEngine: ResolvedEngine;
  /** "Yes" → D6 (pure local state; no re-classify, no credit). */
  onYes: () => void;
  /** "Something else" → D4 (Phase 4). Absent ⇒ greyed placeholder. */
  onSomethingElse?: () => void;
}

export default function D3AlmostSure({
  briefDraft,
  resolvedEngine,
  onYes,
  onSomethingElse,
}: D3AlmostSureProps) {
  const facts = getEntryFacts(briefDraft);
  const copy = ENGINE_LEAD[resolvedEngine];

  return (
    <div className="app-chrome fixed inset-0 flex flex-col bg-app-canvas">
      <JourneyTopBar step={null} right={<span />} />

      <div className="flex-1 min-h-0 overflow-auto flex">
        {/* Live-read rail (LEFT — matches the work journey's rail convention). */}
        <aside className="w-[320px] flex-none bg-app-surface-sunken border-r border-app-border-frame flex flex-col">
          <div className="flex-none px-[22px] pt-5 pb-3.5">
            <div className="font-app-mono font-bold text-[10px] tracking-[0.11em] text-app-faint">
              WHAT WE UNDERSTOOD
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto px-[22px]">
            <div className="py-[11px] border-t border-app-hairline">
              <div className="font-app-mono font-semibold text-[10px] tracking-[0.06em] text-app-faint mb-1.5">
                WHAT YOU DO
              </div>
              <span className="font-app-sans font-medium text-[13px] text-app-slate">
                {facts?.summary || facts?.oneLiner || '—'}
              </span>
            </div>
            <EngineRailField
              engine={{
                status: 'almost-sure',
                label: copy.label,
                descriptor: copy.descriptor,
                icon: copy.icon,
                onChangeEngine: onSomethingElse,
              }}
            />
          </div>
        </aside>

        <div className="flex-1 flex flex-col items-center justify-center p-10 bg-[radial-gradient(120%_90%_at_50%_-6%,#eef4ff_0%,#fcfcfd_58%)]">
          <div data-testid="decider-d3" className="w-full max-w-[520px] flex flex-col items-center text-center">
            <h1 className="font-app-sans font-extrabold text-[28px] leading-[1.18] tracking-[-0.8px] text-app-ink max-w-[460px]">
              {ENGINE_QUESTION[resolvedEngine]}
            </h1>

            <div className="mt-7 w-full max-w-[420px] flex flex-col gap-2.5">
              <button
                type="button"
                data-testid="decider-d3-yes"
                onClick={onYes}
                className="rounded-app-panel border-[1.5px] border-app-primary bg-app-tint px-4 py-4 flex items-center gap-3 text-left transition-colors hover:bg-app-tint/70"
              >
                <span className="flex-none w-[30px] h-[30px] rounded-full bg-app-primary text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </span>
                <span className="font-app-sans font-bold text-[15px] text-app-ink">
                  Yes — that&rsquo;s it
                </span>
                <ArrowRight className="w-4 h-4 text-app-primary ml-auto" />
              </button>

              <button
                type="button"
                data-testid="decider-d3-something-else"
                onClick={onSomethingElse}
                disabled={!onSomethingElse}
                title={onSomethingElse ? undefined : 'Coming soon — you can change this once we add it'}
                className={cn(
                  'rounded-app-panel border px-4 py-3.5 text-left transition-colors',
                  onSomethingElse
                    ? 'border-app-border-hairline bg-app-surface hover:border-app-primary/40'
                    : 'border-app-border-hairline bg-app-surface opacity-60 cursor-not-allowed'
                )}
              >
                <span className="font-app-sans font-semibold text-[13.5px] text-app-ink">
                  It&rsquo;s something else
                </span>
                <span className="block font-app-sans text-[12px] text-app-muted mt-0.5">
                  {onSomethingElse ? 'Pick how buyers decide' : 'Changing this is coming soon'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
